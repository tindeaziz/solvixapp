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

// Interface pour les informations de quota
interface QuotaInfo {
  used: number;
  remaining: number;
  total: number;
  canCreateQuote: boolean;
  isPremium?: boolean;
}

// Gestion des quotas basée sur la base de données
export const getSecureQuotaInfo = async (): Promise<QuotaInfo> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ QUOTA - Utilisateur non connecté');
      return {
        used: 0,
        remaining: 0,
        total: 0,
        canCreateQuote: false
      };
    }

    // Vérifier d'abord si l'utilisateur est premium
    const isPremiumStatus = await isPremiumActive();
    if (isPremiumStatus) {
      console.log('💎 QUOTA - Utilisateur premium, quota illimité');
      return {
        used: 0,
        remaining: 999999,
        total: 999999,
        canCreateQuote: true,
        isPremium: true
      };
    }

    // Récupérer les informations de quota depuis la base de données
    const { data, error } = await supabase.rpc('get_user_quota_info');
    
    if (error) {
      console.error('❌ QUOTA - Erreur lors de la récupération du quota:', error);
      
      // Fallback en cas d'erreur
      return {
        used: 0,
        remaining: 3,
        total: 3,
        canCreateQuote: true
      };
    }
    
    console.log('📊 QUOTA - Informations récupérées:', data);
    
    return {
      used: data.used || 0,
      remaining: data.remaining || 0,
      total: data.total || 3,
      canCreateQuote: data.canCreateQuote || false,
      isPremium: data.isPremium || false
    };
  } catch (error) {
    console.error('❌ QUOTA - Exception lors de la récupération du quota:', error);
    
    // Fallback en cas d'exception
    return {
      used: 0,
      remaining: 3,
      total: 3,
      canCreateQuote: true
    };
  }
};

// Incrémenter le compteur de quota
export const incrementQuotaUsage = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ QUOTA - Utilisateur non connecté pour incrémenter');
      return false;
    }

    // Vérifier d'abord si l'utilisateur est premium
    const isPremiumStatus = await isPremiumActive();
    if (isPremiumStatus) {
      console.log('💎 QUOTA - Utilisateur premium, pas besoin d\'incrémenter');
      return true;
    }

    // Appeler la fonction RPC pour incrémenter le quota
    const { data, error } = await supabase.rpc('increment_user_quota', {
      user_uuid: user.id
    });
    
    if (error) {
      console.error('❌ QUOTA - Erreur lors de l\'incrémentation:', error);
      return false;
    }
    
    console.log('📈 QUOTA - Incrémentation réussie:', data);
    return data === true;
  } catch (error) {
    console.error('❌ QUOTA - Exception lors de l\'incrémentation:', error);
    return false;
  }
};

// Fonction pour vérifier si l'utilisateur peut créer un devis
export const canCreateQuote = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ QUOTA - Utilisateur non connecté pour vérifier');
      return false;
    }

    // Vérifier d'abord si l'utilisateur est premium
    const isPremiumStatus = await isPremiumActive();
    if (isPremiumStatus) {
      console.log('💎 QUOTA - Utilisateur premium, peut créer un devis');
      return true;
    }

    // Appeler la fonction RPC pour vérifier si l'utilisateur peut créer un devis
    const { data, error } = await supabase.rpc('can_create_quote', {
      user_uuid: user.id
    });
    
    if (error) {
      console.error('❌ QUOTA - Erreur lors de la vérification:', error);
      return false;
    }
    
    console.log('🔍 QUOTA - Vérification réussie:', data);
    return data === true;
  } catch (error) {
    console.error('❌ QUOTA - Exception lors de la vérification:', error);
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
        return null;
      }
      
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
        return [];
      }
      
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
        return false;
      }
      
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
        return { success: false, message: 'Utilisateur non connecté' };
      }
      
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
        return false;
      }
      
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