// Supabase Edge Function для обработки Pay URL от PayAnyWay
// Deno runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MNT_INTEGRITY_CODE = 'amx50100'
const MNT_ID = '74730556'

// MD5 hash function for Deno
async function md5(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify PayAnyWay signature
async function verifySignature(params: Record<string, string>): Promise<boolean> {
  const signatureString = 
    params.MNT_ID +
    params.MNT_TRANSACTION_ID +
    params.MNT_OPERATION_ID +
    params.MNT_AMOUNT +
    params.MNT_CURRENCY_CODE +
    (params.MNT_SUBSCRIBER_ID || '') +
    params.MNT_TEST_MODE +
    MNT_INTEGRITY_CODE

  const calculatedSignature = await md5(signatureString)
  return calculatedSignature.toLowerCase() === (params.MNT_SIGNATURE || '').toLowerCase()
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    // Parse parameters from POST or GET
    let params: Record<string, string> = {}
    
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData()
        formData.forEach((value, key) => {
          params[key] = value.toString()
        })
      } else {
        const text = await req.text()
        const urlParams = new URLSearchParams(text)
        urlParams.forEach((value, key) => {
          params[key] = value
        })
      }
    } else {
      const url = new URL(req.url)
      url.searchParams.forEach((value, key) => {
        params[key] = value
      })
    }

    console.log('Received payment callback:', JSON.stringify(params))

    // If no params, return SUCCESS (PayAnyWay test request)
    if (!params.MNT_TRANSACTION_ID) {
      return new Response('SUCCESS', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Verify MNT_ID
    if (params.MNT_ID !== MNT_ID) {
      console.error('Invalid MNT_ID:', params.MNT_ID)
      return new Response('FAIL', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Verify signature
    const isValid = await verifySignature(params)
    if (!isValid) {
      console.error('Invalid signature')
      return new Response('FAIL', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Extract appointment ID from transaction ID (format: appointmentId|timestamp)
    const transactionId = params.MNT_TRANSACTION_ID
    const appointmentId = transactionId.split('|')[0]

    if (!appointmentId) {
      console.error('Invalid transaction ID format:', transactionId)
      return new Response('FAIL', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Update appointment status to confirmed
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'confirmed',
        payment_id: params.MNT_OPERATION_ID,
      })
      .eq('id', appointmentId)

    if (error) {
      console.error('Error updating appointment:', error)
      return new Response('FAIL', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    console.log('Payment confirmed for appointment:', appointmentId)
    return new Response('SUCCESS', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })

  } catch (error) {
    console.error('Error processing payment callback:', error)
    return new Response('FAIL', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
})
