
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskData {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  location: string
  price_range_min: number
  price_range_max: number
  required_date?: string
  required_time?: string
  payment_method: string
  client_id: string
}

interface EmailRecipient {
  id: string
  email: string
  full_name: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { task } = await req.json()
    console.log('🔔 Processing task notification:', task.id)

    // Get all approved taskers with email notifications enabled
    const { data: eligibleTaskers, error: taskersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'tasker')
      .eq('approved', true)
      .eq('email_notifications_enabled', true)

    if (taskersError) {
      console.error('❌ Error fetching eligible taskers:', taskersError)
      throw taskersError
    }

    if (!eligibleTaskers || eligibleTaskers.length === 0) {
      console.log('📭 No eligible taskers found for email notifications')
      return new Response(JSON.stringify({ message: 'No eligible taskers found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📧 Sending emails to ${eligibleTaskers.length} taskers`)

    // Get client information for the email
    const { data: clientData, error: clientError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', task.client_id)
      .single()

    if (clientError) {
      console.error('❌ Error fetching client data:', clientError)
    }

    const clientName = clientData?.full_name || 'A client'

    // Prepare email content
    const emailSubject = `New Task Available: ${task.title}`
    const emailContent = createEmailContent(task, clientName)

    // Send emails using SendGrid
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured')
    }

    const emailPromises = eligibleTaskers.map(async (tasker: EmailRecipient) => {
      try {
        const emailData = {
          personalizations: [
            {
              to: [{ email: tasker.email, name: tasker.full_name }],
              subject: emailSubject
            }
          ],
          from: {
            email: 'noreply@hubdevnest.com',
            name: 'MGSDEAL Notifications'
          },
          content: [
            {
              type: 'text/plain',
              value: emailContent.replace('{{tasker_name}}', tasker.full_name)
            }
          ]
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendGridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ SendGrid error for ${tasker.email}:`, response.status, errorText)
          return { success: false, email: tasker.email, error: errorText }
        }

        console.log(`✅ Email sent successfully to ${tasker.email}`)
        return { success: true, email: tasker.email }
      } catch (error) {
        console.error(`❌ Error sending email to ${tasker.email}:`, error)
        return { success: false, email: tasker.email, error: error.message }
      }
    })

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises)
    
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    console.log(`📊 Email notification results: ${successCount}/${eligibleTaskers.length} sent successfully`)

    return new Response(JSON.stringify({ 
      message: `Email notifications sent`,
      sent: successCount,
      total: eligibleTaskers.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in send-task-notifications:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function createEmailContent(task: TaskData, clientName: string): string {
  const budgetRange = `£${task.price_range_min} - £${task.price_range_max}`
  const requiredDate = task.required_date ? new Date(task.required_date).toLocaleDateString() : 'Flexible'
  const requiredTime = task.required_time || 'Flexible'

  return `Hi {{tasker_name}},

A new task has been posted on MGSDEAL that might interest you!

TASK DETAILS:
=============
Title: ${task.title}
Category: ${task.category}${task.subcategory ? ` > ${task.subcategory}` : ''}
Location: ${task.location}
Budget: ${budgetRange}
Required Date: ${requiredDate}
Required Time: ${requiredTime}
Payment Method: ${task.payment_method.replace('_', ' ').toUpperCase()}
Posted by: ${clientName}

DESCRIPTION:
============
${task.description}

To view this task and submit an offer, log in to your MGSDEAL dashboard:
https://www.mgsdeal.com/tasker-dashboard

If you no longer want to receive these email notifications, you can disable them in your account settings.

Best regards,
The MGSDEAL Team

---
This is an automated message. Please do not reply to this email.
`
}
