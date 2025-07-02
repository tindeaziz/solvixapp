import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, userId, data } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer les préférences de notification
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefsError && prefsError.code !== 'PGRST116') {
      throw new Error(`Erreur récupération préférences: ${prefsError.message}`)
    }

    // Si pas de préférences, créer avec valeurs par défaut
    if (!userPrefs) {
      await supabase
        .from('user_notification_preferences')
        .insert({
          user_id: userId,
          email_notifications: true,
          new_quotes_notifications: true,
          accepted_quotes_notifications: true
        })
    }

    // Vérifier si les notifications sont activées
    if (userPrefs && !userPrefs.email_notifications) {
      return new Response(JSON.stringify({ message: 'Notifications email désactivées' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Vérifier le type spécifique
    if (userPrefs && type === 'new_quote' && !userPrefs.new_quotes_notifications) {
      return new Response(JSON.stringify({ message: 'Notifications nouveaux devis désactivées' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (userPrefs && type === 'quote_accepted' && !userPrefs.accepted_quotes_notifications) {
      return new Response(JSON.stringify({ message: 'Notifications devis acceptés désactivées' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Récupérer l'email de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError) {
      throw new Error(`Erreur récupération utilisateur: ${userError.message}`)
    }

    if (!user?.email) {
      throw new Error('Email utilisateur non trouvé')
    }

    // Préparer le contenu selon le type
    let subject = ''
    let htmlContent = ''

    switch (type) {
      case 'new_quote':
        subject = `✅ Nouveau devis créé - ${data.quoteNumber}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: #1B4B8C; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🌟 Solvix</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Génération de devis professionnels</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #1B4B8C; margin-top: 0;">✅ Nouveau devis créé avec succès</h2>
              <p>Bonjour,</p>
              <p>Un nouveau devis vient d'être créé dans votre application Solvix :</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Numéro :</td>
                    <td style="padding: 8px 0;">${data.quoteNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Client :</td>
                    <td style="padding: 8px 0;">${data.clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Montant :</td>
                    <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #FF6B35;">${data.amount} ${data.currency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Date :</td>
                    <td style="padding: 8px 0;">${new Date().toLocaleDateString('fr-FR')}</td>
                  </tr>
                </table>
              </div>
              
              <p>Vous pouvez consulter et gérer ce devis directement dans votre application Solvix.</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>Solvix - Votre solution de devis professionnels</p>
              <p>Pour modifier vos préférences de notification, connectez-vous à votre compte Solvix</p>
            </div>
          </div>
        `
        break

      case 'quote_accepted':
        subject = `🎉 Félicitations ! Devis accepté - ${data.quoteNumber}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: #28A745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Félicitations !</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Votre devis a été accepté</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #28A745; margin-top: 0;">🎉 Excellente nouvelle !</h2>
              <p>Votre devis <strong>${data.quoteNumber}</strong> a été accepté par <strong>${data.clientName}</strong>.</p>
              
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28A745;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #155724;">
                  Montant accepté : ${data.amount} ${data.currency}
                </p>
              </div>
              
              <p>Vous pouvez maintenant :</p>
              <ul style="color: #333; line-height: 1.6;">
                <li>Procéder à la facturation</li>
                <li>Planifier les travaux</li>
                <li>Contacter votre client pour finaliser les détails</li>
              </ul>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>Solvix - Votre solution de devis professionnels</p>
            </div>
          </div>
        `
        break
        
      case 'quote_status_changed':
        subject = `📊 Statut du devis modifié - ${data.quoteNumber}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: #1B4B8C; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">📊 Mise à jour de statut</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Changement de statut d'un devis</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #1B4B8C; margin-top: 0;">Le statut de votre devis a changé</h2>
              <p>Le devis <strong>${data.quoteNumber}</strong> est maintenant : <strong>${data.newStatus}</strong></p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Client :</td>
                    <td style="padding: 8px 0;">${data.clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Montant :</td>
                    <td style="padding: 8px 0;">${data.amount} ${data.currency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Ancien statut :</td>
                    <td style="padding: 8px 0;">${data.oldStatus}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #1B4B8C;">Nouveau statut :</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #FF6B35;">${data.newStatus}</td>
                  </tr>
                </table>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>Solvix - Votre solution de devis professionnels</p>
            </div>
          </div>
        `
        break;
        
      default:
        throw new Error(`Type de notification non pris en charge: ${type}`)
    }

    // Utiliser l'API Supabase pour envoyer l'email
    const { error: emailError } = await supabase.auth.admin.sendEmail(
      user.email,
      {
        subject: subject,
        template_name: 'custom_email',
        template_values: {
          content: htmlContent
        }
      }
    )

    if (emailError) {
      throw emailError
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notification ${type} envoyée à ${user.email}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erreur notification:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})