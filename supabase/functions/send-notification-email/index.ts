import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, userId, data } = await req.json()

    console.log(`🔔 Processing notification: ${type} for user: ${userId}`)

    // For now, we'll simulate email sending since we don't have RESEND_API_KEY configured
    // In a real environment, you would configure Resend or another email service
    
    let subject = ''
    let message = ''

    switch (type) {
      case 'new_quote':
        subject = `✅ Nouveau devis créé - ${data.quoteNumber}`
        message = `Nouveau devis ${data.quoteNumber} créé pour ${data.clientName} - Montant: ${data.amount} ${data.currency}`
        break

      case 'quote_accepted':
        subject = `🎉 Félicitations ! Devis accepté - ${data.quoteNumber}`
        message = `Votre devis ${data.quoteNumber} a été accepté par ${data.clientName} - Montant: ${data.amount} ${data.currency}`
        break
        
      case 'quote_status_changed':
        subject = `📊 Statut du devis modifié - ${data.quoteNumber}`
        message = `Le devis ${data.quoteNumber} est passé de "${data.oldStatus}" à "${data.newStatus}"`
        break
        
      default:
        throw new Error(`Type de notification non pris en charge: ${type}`)
    }

    // Log the notification (in production, this would send an actual email)
    console.log(`📧 Email notification: ${subject}`)
    console.log(`📝 Message: ${message}`)

    // Simulate successful email sending
    const response = {
      success: true,
      message: `Notification ${type} traitée avec succès`,
      details: {
        subject,
        type,
        userId,
        timestamp: new Date().toISOString()
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Erreur dans la fonction de notification:', error)
    
    const errorResponse = {
      success: false,
      error: error.message || 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})