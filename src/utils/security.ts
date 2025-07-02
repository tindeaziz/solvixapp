import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'solvix-security-key-2025';

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};

// Génération d'empreinte digitale du dispositif
export const getDeviceFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Solvix Device ID', 2, 2);
    }

    const fingerprint = btoa(
      navigator.userAgent +
      screen.width + 
      screen.height +
      navigator.language +
      Intl.DateTimeFormat().resolvedOptions().timeZone +
      (canvas.toDataURL() || 'fallback')
    ).slice(0, 32);

    return fingerprint;
  } catch {
    // Fallback si canvas n'est pas disponible
    return btoa(navigator.userAgent + screen.width + screen.height).slice(0, 32);
  }
};

// Interface pour les données de quota
interface QuotaData {
  month: number;
  count: number;
  deviceFingerprint: string;
  lastReset: number;
}

// Gestion sécurisée des quotas
export const getSecureQuotaInfo = () => {
  const currentMonth = new Date().getMonth() + new Date().getFullYear() * 12;
  const deviceId = getDeviceFingerprint();
  const FREE_QUOTA_LIMIT = 3;

  try {
    const encryptedData = localStorage.getItem('solvix_quota_data');
    if (!encryptedData) {
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    const decryptedData = decryptData(encryptedData);
    if (!decryptedData) {
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    const quotaData: QuotaData = JSON.parse(decryptedData);

    // Vérification de l'intégrité du dispositif
    if (quotaData.deviceFingerprint !== deviceId) {
      console.warn('Device fingerprint mismatch - resetting quota');
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    // Reset automatique si nouveau mois
    if (quotaData.month !== currentMonth) {
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    return {
      used: quotaData.count,
      remaining: Math.max(0, FREE_QUOTA_LIMIT - quotaData.count),
      total: FREE_QUOTA_LIMIT,
      canCreateQuote: quotaData.count < FREE_QUOTA_LIMIT
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du quota:', error);
    return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
  }
};

// Reset du quota
const resetQuota = (month: number, deviceId: string, limit: number) => {
  const quotaData: QuotaData = { 
    month, 
    count: 0, 
    deviceFingerprint: deviceId,
    lastReset: Date.now()
  };
  
  try {
    const encrypted = encryptData(JSON.stringify(quotaData));
    localStorage.setItem('solvix_quota_data', encrypted);
  } catch (error) {
    console.error('Erreur lors du reset du quota:', error);
  }
  
  return { 
    used: 0, 
    remaining: limit, 
    total: limit,
    canCreateQuote: true
  };
};

// Incrémenter le compteur de quota
export const incrementQuotaUsage = (): boolean => {
  try {
    const quotaInfo = getSecureQuotaInfo();
    if (!quotaInfo.canCreateQuote) {
      return false;
    }

    const currentMonth = new Date().getMonth() + new Date().getFullYear() * 12;
    const deviceId = getDeviceFingerprint();
    
    const quotaData: QuotaData = {
      month: currentMonth,
      count: quotaInfo.used + 1,
      deviceFingerprint: deviceId,
      lastReset: Date.now()
    };

    const encrypted = encryptData(JSON.stringify(quotaData));
    localStorage.setItem('solvix_quota_data', encrypted);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation du quota:', error);
    return false;
  }
};

// Classe de gestion des codes d'activation
export class SecureCodeManager {
  private codes: ActivationCode[];
  
  constructor() {
    this.codes = this.loadCodes();
  }
  
  private loadCodes(): ActivationCode[] {
    try {
      const encrypted = localStorage.getItem('solvix_admin_codes');
      if (encrypted) {
        const decrypted = decryptData(encrypted);
        return JSON.parse(decrypted);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des codes:', error);
    }
    return [];
  }
  
  private saveCodes(): void {
    try {
      const encrypted = encryptData(JSON.stringify(this.codes));
      localStorage.setItem('solvix_admin_codes', encrypted);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des codes:', error);
    }
  }
  
  public generateCode(customerInfo?: CustomerInfo): string {
    const code = this.generateSecureCode();
    const codeData: ActivationCode = {
      id: uuidv4(),
      code: code,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
      customerInfo: customerInfo || {},
      price: 5000,
      usedAt: null,
      deviceId: null
    };
    
    this.codes.push(codeData);
    this.saveCodes();
    return code;
  }
  
  public generateBatch(quantity: number = 10): string[] {
    const batch: string[] = [];
    for (let i = 0; i < quantity; i++) {
      batch.push(this.generateCode());
    }
    return batch;
  }
  
  public markAsSold(code: string, customerContact: string): boolean {
    const codeItem = this.codes.find(c => c.code === code);
    if (codeItem && codeItem.status === 'AVAILABLE') {
      codeItem.status = 'SOLD';
      codeItem.customerInfo = {
        ...codeItem.customerInfo,
        contact: customerContact
      };
      codeItem.soldAt = new Date().toISOString();
      this.saveCodes();
      return true;
    }
    return false;
  }
  
  public validateAndActivateCode(inputCode: string, deviceId: string): ActivationResult {
    const code = inputCode.trim().toUpperCase();
    const codeItem = this.codes.find(c => c.code === code);
    
    if (!codeItem) {
      return { success: false, message: 'Code invalide' };
    }
    
    if (codeItem.status === 'USED') {
      return { success: false, message: 'Code déjà utilisé' };
    }
    
    if (codeItem.status !== 'SOLD' && codeItem.status !== 'AVAILABLE') {
      return { success: false, message: 'Code non disponible' };
    }
    
    // Activer le code
    codeItem.status = 'USED';
    codeItem.usedAt = new Date().toISOString();
    codeItem.deviceId = deviceId;
    this.saveCodes();
    
    return { success: true, message: 'Code activé avec succès!' };
  }
  
  public getStats(): CodeStats {
    const available = this.codes.filter(c => c.status === 'AVAILABLE').length;
    const sold = this.codes.filter(c => c.status === 'SOLD').length;
    const used = this.codes.filter(c => c.status === 'USED').length;
    const revenue = (sold + used) * 5000;
    
    return { 
      available, 
      sold, 
      used, 
      revenue, 
      total: this.codes.length 
    };
  }
  
  public getAllCodes(): ActivationCode[] {
    return [...this.codes];
  }
  
  public exportToCSV(): string {
    const headers = ['Code', 'Status', 'Created', 'Sold', 'Used', 'Customer', 'Price'];
    const rows = this.codes.map(c => [
      c.code,
      c.status,
      c.createdAt,
      c.soldAt || '',
      c.usedAt || '',
      c.customerInfo?.contact || '',
      c.price.toString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }
  
  private generateSecureCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Évite confusion 0,O,1,I
    const codeLength = 8;
    
    // Utiliser crypto.getRandomValues pour vraie randomness
    const randomValues = new Uint8Array(codeLength);
    crypto.getRandomValues(randomValues);
    
    let code = 'SOLVIX-';
    for (let i = 0; i < codeLength; i++) {
      code += alphabet[randomValues[i] % alphabet.length];
    }
    
    return code;
  }
}

// Types pour les codes d'activation
interface CustomerInfo {
  name?: string;
  contact?: string;
  email?: string;
  notes?: string;
}

interface ActivationCode {
  id: string;
  code: string;
  status: 'AVAILABLE' | 'SOLD' | 'USED' | 'REVOKED';
  createdAt: string;
  soldAt?: string | null;
  usedAt?: string | null;
  deviceId?: string | null;
  customerInfo: CustomerInfo;
  price: number;
}

interface ActivationResult {
  success: boolean;
  message: string;
}

interface CodeStats {
  available: number;
  sold: number;
  used: number;
  revenue: number;
  total: number;
}

// Singleton pour la gestion des codes
export const codeManager = new SecureCodeManager();

// Liste des codes valides (en production, ces codes seraient générés dynamiquement)
const VALID_PREMIUM_CODES = [
  'SOLVIX-ABCD1234',
  'SOLVIX-EFGH5678',
  'SOLVIX-IJKL9012',
  'SOLVIX-MNOP3456',
  'SOLVIX-QRST7890',
  'SOLVIX-UVWX1234',
  'SOLVIX-YZAB5678',
  'SOLVIX-CDEF9012',
  'SOLVIX-GHIJ3456',
  'SOLVIX-KLMN7890'
];

// Validation sécurisée des codes d'activation
export const validatePremiumCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  
  const normalizedCode = code.trim().toUpperCase();
  
  // Vérifier si le code est dans la liste des codes valides
  if (!VALID_PREMIUM_CODES.includes(normalizedCode)) {
    // Vérifier avec le gestionnaire de codes
    const allCodes = codeManager.getAllCodes();
    const codeExists = allCodes.some(c => 
      c.code === normalizedCode && 
      (c.status === 'AVAILABLE' || c.status === 'SOLD')
    );
    
    if (!codeExists) {
      return false;
    }
  }
  
  // Vérifier si le code n'a pas déjà été utilisé
  return !isCodeUsed(normalizedCode);
};

// Vérifier si un code a déjà été utilisé
const isCodeUsed = (code: string): boolean => {
  try {
    const usedCodes = getUsedCodes();
    return usedCodes.includes(code);
  } catch {
    return false;
  }
};

// Récupérer la liste des codes utilisés
const getUsedCodes = (): string[] => {
  try {
    const encrypted = localStorage.getItem('solvix_used_codes');
    if (!encrypted) return [];
    
    const decrypted = decryptData(encrypted);
    if (!decrypted) return [];
    
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
};

// Marquer un code comme utilisé
export const markCodeAsUsed = (code: string): void => {
  try {
    const usedCodes = getUsedCodes();
    const normalizedCode = code.trim().toUpperCase();
    
    if (!usedCodes.includes(normalizedCode)) {
      usedCodes.push(normalizedCode);
      const encrypted = encryptData(JSON.stringify(usedCodes));
      localStorage.setItem('solvix_used_codes', encrypted);
    }
  } catch (error) {
    console.error('Erreur lors du marquage du code:', error);
  }
};

// Interface pour les données Premium
interface PremiumData {
  status: 'active' | 'inactive';
  code: string;
  deviceId: string;
  activationTimestamp: number;
  version: string;
  expirationDate?: number;
}

// Vérifier si Premium est actif
export const isPremiumActive = (): boolean => {
  try {
    const encryptedData = localStorage.getItem('solvix_premium_data');
    if (!encryptedData) return false;

    const decryptedData = decryptData(encryptedData);
    if (!decryptedData) return false;

    const premiumData: PremiumData = JSON.parse(decryptedData);
    
    // Vérifications de sécurité
    if (premiumData.status !== 'active') return false;
    if (premiumData.deviceId !== getDeviceFingerprint()) return false;
    
    // Vérifier l'expiration si définie
    if (premiumData.expirationDate && Date.now() > premiumData.expirationDate) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification Premium:', error);
    return false;
  }
};

// Activer Premium avec un code
export const activatePremium = (code: string): boolean => {
  try {
    if (!validatePremiumCode(code)) {
      return false;
    }

    const premiumData: PremiumData = {
      status: 'active',
      code: code.trim().toUpperCase(),
      deviceId: getDeviceFingerprint(),
      activationTimestamp: Date.now(),
      version: '1.0'
      // Pas d'expiration pour l'accès à vie
    };

    const encrypted = encryptData(JSON.stringify(premiumData));
    localStorage.setItem('solvix_premium_data', encrypted);
    
    // Marquer le code comme utilisé
    markCodeAsUsed(code);
    
    // Activer le code dans le gestionnaire de codes
    codeManager.validateAndActivateCode(code, getDeviceFingerprint());
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'activation Premium:', error);
    return false;
  }
};

// Désactiver Premium (pour les tests ou support)
export const deactivatePremium = (): void => {
  try {
    localStorage.removeItem('solvix_premium_data');
  } catch (error) {
    console.error('Erreur lors de la désactivation Premium:', error);
  }
};

// Obtenir les informations Premium
export const getPremiumInfo = () => {
  try {
    const encryptedData = localStorage.getItem('solvix_premium_data');
    if (!encryptedData) return null;

    const decryptedData = decryptData(encryptedData);
    if (!decryptedData) return null;

    const premiumData: PremiumData = JSON.parse(decryptedData);
    
    return {
      isActive: isPremiumActive(),
      activationDate: new Date(premiumData.activationTimestamp),
      code: premiumData.code.slice(-4), // Afficher seulement les 4 derniers caractères
      version: premiumData.version
    };
  } catch {
    return null;
  }
};