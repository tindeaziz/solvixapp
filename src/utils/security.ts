import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

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
  const FREE_QUOTA_LIMIT = 3; // Corrigé: 3 devis gratuits par mois

  try {
    const encryptedData = localStorage.getItem('solvix_quota_data');
    if (!encryptedData) {
      console.log('📅 Première utilisation - Initialisation quota à 3 devis');
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    const decryptedData = decryptData(encryptedData);
    if (!decryptedData) {
      console.log('🔑 Données de quota corrompues - Réinitialisation');
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    const quotaData: QuotaData = JSON.parse(decryptedData);

    // Vérification de l'intégrité du dispositif
    if (quotaData.deviceFingerprint !== deviceId) {
      console.warn('🔒 Device fingerprint mismatch - resetting quota');
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    // Reset automatique si nouveau mois
    if (quotaData.month !== currentMonth) {
      console.log('📅 Nouveau mois détecté - Reset quota à 3 devis');
      return resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
    }

    console.log('📊 Quota actuel:', { 
      used: quotaData.count, 
      remaining: Math.max(0, FREE_QUOTA_LIMIT - quotaData.count),
      total: FREE_QUOTA_LIMIT
    });

    return {
      used: quotaData.count,
      remaining: Math.max(0, FREE_QUOTA_LIMIT - quotaData.count),
      total: FREE_QUOTA_LIMIT,
      canCreateQuote: quotaData.count < FREE_QUOTA_LIMIT
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du quota:', error);
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
    console.log('✅ Quota réinitialisé avec succès:', { used: 0, remaining: limit, total: limit });
  } catch (error) {
    console.error('❌ Erreur lors du reset du quota:', error);
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
      console.log('❌ Quota épuisé - Création impossible');
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

    console.log('📈 Incrémentation quota:', quotaInfo.used, '->', quotaData.count);

    const encrypted = encryptData(JSON.stringify(quotaData));
    localStorage.setItem('solvix_quota_data', encrypted);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'incrémentation du quota:', error);
    return false;
  }
};

// Fonction pour vérifier et corriger les quotas existants
export const fixExistingQuotas = async () => {
  try {
    const currentMonth = new Date().getMonth() + new Date().getFullYear() * 12;
    const deviceId = getDeviceFingerprint();
    const FREE_QUOTA_LIMIT = 3;
    
    const encryptedData = localStorage.getItem('solvix_quota_data');
    if (!encryptedData) {
      console.log('🔧 Aucun quota existant - Initialisation à 3 devis');
      resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
      return;
    }
    
    const decryptedData = decryptData(encryptedData);
    if (!decryptedData) {
      console.log('🔧 Données de quota invalides - Réinitialisation');
      resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
      return;
    }
    
    const quotaData: QuotaData = JSON.parse(decryptedData);
    
    // Si l'utilisateur a un quota de 1 mais n'a pas encore créé de devis
    if (quotaData.count > 0 && !(await hasCreatedAnyQuote())) {
      console.log('🐛 Bug détecté: Quota utilisé sans devis créé - Correction');
      resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
      return;
    }
    
    // Si le mois est différent, réinitialiser
    if (quotaData.month !== currentMonth) {
      console.log('🔄 Mois différent - Réinitialisation du quota');
      resetQuota(currentMonth, deviceId, FREE_QUOTA_LIMIT);
      return;
    }
    
    console.log('✅ Vérification quota terminée - Aucune correction nécessaire');
  } catch (error) {
    console.error('❌ Erreur lors de la correction des quotas:', error);
  }
};

// Vérifier si l'utilisateur a créé des devis
const hasCreatedAnyQuote = async (): Promise<boolean> => {
  try {
    // Importer supabase de manière dynamique pour éviter les problèmes de dépendance circulaire
    const { supabase } = await import('../lib/supabase');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('devis')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
      
    if (error) {
      console.error('❌ Erreur vérification devis:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Erreur vérification devis:', error);
    return false;
  }
};

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
  revokedAt?: string | null;
  revokedReason?: string | null;
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
  revoked: number;
  revenue: number;
  total: number;
}

// Classe de gestion des codes d'activation avec Supabase
export class SecureCodeManager {
  // Méthode pour générer un code d'activation
  public async generateCode(customerInfo?: CustomerInfo): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non connecté pour générer un code');
        return null;
      }

      // Appeler la fonction SQL pour générer un code
      const { data, error } = await supabase.rpc('generate_activation_codes', {
        quantity: 1,
        admin_id: user.id
      });

      if (error) {
        console.error('❌ Erreur lors de la génération du code:', error);
        return null;
      }

      if (data && data.length > 0) {
        console.log('✅ Code généré avec succès:', data[0].code);
        return data[0].code;
      }

      return null;
    } catch (error) {
      console.error('❌ Exception lors de la génération du code:', error);
      return null;
    }
  }

  // Méthode pour générer un lot de codes d'activation
  public async generateBatch(quantity: number = 10): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non connecté pour générer des codes');
        return [];
      }

      // Appeler la fonction SQL pour générer des codes
      const { data, error } = await supabase.rpc('generate_activation_codes', {
        quantity,
        admin_id: user.id
      });

      if (error) {
        console.error('❌ Erreur lors de la génération des codes:', error);
        return [];
      }

      if (data && data.length > 0) {
        console.log(`✅ ${data.length} codes générés avec succès`);
        return data.map(item => item.code);
      }

      return [];
    } catch (error) {
      console.error('❌ Exception lors de la génération des codes:', error);
      return [];
    }
  }

  // Méthode pour marquer un code comme vendu
  public async markAsSold(code: string, customerContact: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non connecté pour marquer un code comme vendu');
        return false;
      }

      // Appeler la fonction SQL pour marquer un code comme vendu
      const { data, error } = await supabase.rpc('mark_code_as_sold', {
        code_value: code,
        customer_contact: customerContact,
        admin_id: user.id
      });

      if (error) {
        console.error('❌ Erreur lors du marquage du code comme vendu:', error);
        return false;
      }

      console.log('✅ Code marqué comme vendu avec succès:', code);
      return true;
    } catch (error) {
      console.error('❌ Exception lors du marquage du code comme vendu:', error);
      return false;
    }
  }

  // Méthode pour valider et activer un code
  public async validateAndActivateCode(inputCode: string, deviceId: string): Promise<ActivationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non connecté pour activer un code');
        return { success: false, message: 'Utilisateur non connecté' };
      }

      const code = inputCode.trim().toUpperCase();

      // Appeler la fonction SQL pour activer un code
      const { data, error } = await supabase.rpc('activate_premium_code', {
        code_value: code,
        device_id: deviceId,
        user_id: user.id
      });

      if (error) {
        console.error('❌ Erreur lors de l\'activation du code:', error);
        return { success: false, message: error.message || 'Code invalide ou déjà utilisé' };
      }

      if (!data) {
        return { success: false, message: 'Code invalide ou déjà utilisé' };
      }

      console.log('✅ Code activé avec succès:', code);
      return { success: true, message: 'Code activé avec succès!' };
    } catch (error: any) {
      console.error('❌ Exception lors de l\'activation du code:', error);
      return { success: false, message: error.message || 'Une erreur est survenue' };
    }
  }

  // Méthode pour révoquer un code
  public async revokeCode(code: string, reason: string = ''): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non connecté pour révoquer un code');
        return false;
      }

      // Appeler la fonction SQL pour révoquer un code
      const { data, error } = await supabase.rpc('revoke_activation_code', {
        code_value: code,
        reason: reason || 'Révoqué par l\'administrateur',
        admin_id: user.id
      });

      if (error) {
        console.error('❌ Erreur lors de la révocation du code:', error);
        return false;
      }

      console.log('✅ Code révoqué avec succès:', code);
      return true;
    } catch (error) {
      console.error('❌ Exception lors de la révocation du code:', error);
      return false;
    }
  }

  // Méthode pour obtenir des statistiques sur les codes
  public async getStats(): Promise<CodeStats> {
    try {
      // Appeler la fonction SQL pour obtenir des statistiques
      const { data, error } = await supabase.rpc('get_activation_code_stats');

      if (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        return { available: 0, sold: 0, used: 0, revoked: 0, revenue: 0, total: 0 };
      }

      return {
        available: data.available || 0,
        sold: data.sold || 0,
        used: data.used || 0,
        revoked: data.revoked || 0,
        revenue: data.revenue || 0,
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ Exception lors de la récupération des statistiques:', error);
      return { available: 0, sold: 0, used: 0, revoked: 0, revenue: 0, total: 0 };
    }
  }

  // Méthode pour récupérer tous les codes
  public async getAllCodes(): Promise<ActivationCode[]> {
    try {
      const { data, error } = await supabase
        .from('premium_activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des codes:', error);
        return [];
      }

      // Convertir les données Supabase en format ActivationCode
      return data.map(item => ({
        id: item.id,
        code: item.code,
        status: item.status,
        createdAt: item.created_at,
        soldAt: item.sold_at,
        usedAt: item.used_at,
        deviceId: item.device_id,
        revokedAt: item.revoked_at,
        revokedReason: item.revoked_reason,
        customerInfo: item.customer_info || {},
        price: item.price || 5000
      }));
    } catch (error) {
      console.error('❌ Exception lors de la récupération des codes:', error);
      return [];
    }
  }

  // Méthode pour exporter les codes au format CSV
  public async exportToCSV(): Promise<string> {
    try {
      const codes = await this.getAllCodes();
      
      const headers = ['Code', 'Status', 'Created', 'Sold', 'Used', 'Revoked', 'Customer', 'Device', 'Reason', 'Price'];
      const rows = codes.map(c => [
        c.code,
        c.status,
        c.createdAt,
        c.soldAt || '',
        c.usedAt || '',
        c.revokedAt || '',
        c.customerInfo?.contact || '',
        c.deviceId?.substring(0, 8) || '',
        c.revokedReason || '',
        c.price.toString()
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      return csv;
    } catch (error) {
      console.error('❌ Exception lors de l\'export CSV:', error);
      return '';
    }
  }
}

// Singleton pour la gestion des codes
export const codeManager = new SecureCodeManager();

// Validation sécurisée des codes d'activation
export const validatePremiumCode = async (code: string): Promise<boolean> => {
  if (!code || typeof code !== 'string') return false;
  
  const normalizedCode = code.trim().toUpperCase();
  
  try {
    // Vérifier si le code existe et est disponible
    const { data, error } = await supabase
      .from('premium_activation_codes')
      .select('status')
      .eq('code', normalizedCode)
      .maybeSingle();
    
    if (error || !data) {
      return false;
    }
    
    // Le code est valide s'il est disponible ou vendu
    return data.status === 'AVAILABLE' || data.status === 'SOLD';
  } catch (error) {
    console.error('❌ Erreur lors de la validation du code:', error);
    return false;
  }
};

// Vérifier si Premium est actif
export const isPremiumActive = async (): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ PREMIUM - Utilisateur non connecté');
      return false;
    }
    
    // Récupérer l'ID de l'appareil
    const deviceId = getDeviceFingerprint();
    
    // Vérifier si l'utilisateur a un code premium actif
    const { data, error } = await supabase
      .from('premium_activation_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('device_id', deviceId)
      .eq('status', 'USED')
      .maybeSingle();
    
    if (error) {
      console.error('❌ PREMIUM - Erreur vérification statut:', error);
      return false;
    }
    
    const isPremium = !!data;
    console.log(`🔍 PREMIUM - Statut pour User ID ${user.id}: ${isPremium ? 'Actif' : 'Inactif'}`);
    
    return isPremium;
  } catch (error) {
    console.error('❌ PREMIUM - Exception vérification statut:', error);
    return false;
  }
};

// Activer Premium avec un code
export const activatePremium = async (code: string): Promise<boolean> => {
  try {
    if (!await validatePremiumCode(code)) {
      return false;
    }

    const deviceId = getDeviceFingerprint();
    
    // Activer le code dans la base de données
    const result = await codeManager.validateAndActivateCode(code, deviceId);
    
    if (!result.success) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'activation Premium:', error);
    return false;
  }
};

// Obtenir les informations Premium
export const getPremiumInfo = async () => {
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }
    
    // Récupérer l'ID de l'appareil
    const deviceId = getDeviceFingerprint();
    
    // Récupérer les informations du code premium
    const { data, error } = await supabase
      .from('premium_activation_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('device_id', deviceId)
      .eq('status', 'USED')
      .maybeSingle();
    
    if (error || !data) {
      return null;
    }
    
    return {
      isActive: true,
      activationDate: new Date(data.used_at),
      code: data.code.slice(-4), // Afficher seulement les 4 derniers caractères
      version: '1.0'
    };
  } catch {
    return null;
  }
};