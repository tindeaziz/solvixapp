import { supabase } from '../lib/supabase';

/**
 * Envoie une notification par email
 * @param type Type de notification ('new_quote', 'quote_accepted', 'quote_status_changed')
 * @param data Données spécifiques à la notification
 */
export const sendNotification = async (type: string, data: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ NOTIFICATIONS - Utilisateur non connecté');
      return { success: false, message: 'Utilisateur non connecté' };
    }

    console.log(`🔔 NOTIFICATIONS - Envoi notification ${type} pour User ID:`, user.id);
    
    const { data: response, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: type,
        userId: user.id,
        data: data
      }
    });

    if (error) {
      console.error('❌ NOTIFICATIONS - Erreur envoi notification:', error);
      // Don't throw error, just log it and return success: false
      return { success: false, error: error.message || 'Erreur lors de l\'envoi de la notification' };
    } else {
      console.log('✅ NOTIFICATIONS - Notification envoyée:', response);
      return { success: true, data: response };
    }
  } catch (error) {
    console.error('❌ NOTIFICATIONS - Exception envoi notification:', error);
    // Don't throw error, just return failure status
    return { success: false, error: error.message || 'Exception lors de l\'envoi de la notification' };
  }
};

/**
 * Envoie une notification pour un nouveau devis
 * @param quoteData Données du devis
 */
export const notifyNewQuote = async (quoteData: any) => {
  const result = await sendNotification('new_quote', {
    quoteNumber: quoteData.quote_number,
    clientName: quoteData.client?.name || 'Client',
    amount: quoteData.total_ttc || 0,
    currency: quoteData.currency || 'FCFA'
  });
  
  // Log result but don't throw errors
  if (!result.success) {
    console.warn('⚠️ Notification nouveau devis échouée:', result.error);
  }
  
  return result;
};

/**
 * Envoie une notification pour un devis accepté
 * @param quoteData Données du devis
 */
export const notifyQuoteAccepted = async (quoteData: any) => {
  const result = await sendNotification('quote_accepted', {
    quoteNumber: quoteData.quote_number,
    clientName: quoteData.client?.name || 'Client',
    amount: quoteData.total_ttc || 0,
    currency: quoteData.currency || 'FCFA'
  });
  
  // Log result but don't throw errors
  if (!result.success) {
    console.warn('⚠️ Notification devis accepté échouée:', result.error);
  }
  
  return result;
};

/**
 * Envoie une notification pour un changement de statut de devis
 * @param quoteData Données du devis
 * @param oldStatus Ancien statut
 * @param newStatus Nouveau statut
 */
export const notifyQuoteStatusChanged = async (quoteData: any, oldStatus: string, newStatus: string) => {
  const result = await sendNotification('quote_status_changed', {
    quoteNumber: quoteData.quote_number,
    clientName: quoteData.client?.name || 'Client',
    amount: quoteData.total_ttc || 0,
    currency: quoteData.currency || 'FCFA',
    oldStatus,
    newStatus
  });
  
  // Log result but don't throw errors
  if (!result.success) {
    console.warn('⚠️ Notification changement statut échouée:', result.error);
  }
  
  return result;
};