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
      return { success: false, error };
    } else {
      console.log('✅ NOTIFICATIONS - Notification envoyée:', response);
      return { success: true, data: response };
    }
  } catch (error) {
    console.error('❌ NOTIFICATIONS - Exception envoi notification:', error);
    return { success: false, error };
  }
};

/**
 * Envoie une notification pour un nouveau devis
 * @param quoteData Données du devis
 */
export const notifyNewQuote = async (quoteData: any) => {
  return await sendNotification('new_quote', {
    quoteNumber: quoteData.quote_number,
    clientName: quoteData.client?.name || 'Client',
    amount: quoteData.total_ttc || 0,
    currency: quoteData.currency || 'FCFA'
  });
};

/**
 * Envoie une notification pour un devis accepté
 * @param quoteData Données du devis
 */
export const notifyQuoteAccepted = async (quoteData: any) => {
  return await sendNotification('quote_accepted', {
    quoteNumber: quoteData.quote_number,
    clientName: quoteData.client?.name || 'Client',
    amount: quoteData.total_ttc || 0,
    currency: quoteData.currency || 'FCFA'
  });
};

/**
 * Envoie une notification pour un changement de statut de devis
 * @param quoteData Données du devis
 * @param oldStatus Ancien statut
 * @param newStatus Nouveau statut
 */
export const notifyQuoteStatusChanged = async (quoteData: any, oldStatus: string, newStatus: string) => {
  return await sendNotification('quote_status_changed', {
    quoteNumber: quoteData.quote_number,
    clientName: quoteData.client?.name || 'Client',
    amount: quoteData.total_ttc || 0,
    currency: quoteData.currency || 'FCFA',
    oldStatus,
    newStatus
  });
};