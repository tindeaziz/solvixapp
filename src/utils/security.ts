import CryptoJS from 'crypto-js';

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

// Codes d'activation valides (en production, ces codes seraient générés côté serveur)
const VALID_PREMIUM_CODES = [
  'SOLVIX2025-PREMIUM-001',
  'SOLVIX2025-PREMIUM-002', 
  'SOLVIX2025-PREMIUM-003',
  'SOLVIX2025-PREMIUM-004',
  'SOLVIX2025-PREMIUM-005',
  'SOLVIX2025-BETA-001',
  'SOLVIX2025-BETA-002',
  'SOLVIX2025-VIP-001'
];

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

// Validation sécurisée des codes d'activation
export const validatePremiumCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  
  const normalizedCode = code.trim().toUpperCase();
  
  // Vérifier si le code est dans la liste des codes valides
  if (!VALID_PREMIUM_CODES.includes(normalizedCode)) {
    return false;
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

    // Vérifier que le code est toujours valide
    return VALID_PREMIUM_CODES.includes(premiumData.code);
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
      code: premiumData.code.slice(-3), // Afficher seulement les 3 derniers caractères
      version: premiumData.version
    };
  } catch {
    return null;
  }
};