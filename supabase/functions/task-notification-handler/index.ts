
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { task } = await req.json()
    console.log('🔔 Received task notification:', task.id)

    // Call the SendGrid email notification function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-task-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error calling send-task-notifications:', response.status, errorText)
      throw new Error(`SendGrid notification failed: ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Email notifications processed:', result)

    return new Response(JSON.stringify({ 
      message: 'Task notification processed successfully',
      result 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in task-notification-handler:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
