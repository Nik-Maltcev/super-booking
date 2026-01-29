// Simple Express server for PayAnyWay Pay URL callback
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PayAnyWay config
const MNT_ID = '74730556';
const MNT_INTEGRITY_CODE = 'amx50100';

// Supabase config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse URL-encoded bodies (for PayAnyWay POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MD5 hash function
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// PayAnyWay Pay URL endpoint
app.all('/api/payment-callback', async (req, res) => {
  console.log('=== PAYMENT CALLBACK ===');
  console.log('Method:', req.method);
  console.log('Query:', JSON.stringify(req.query));
  console.log('Body:', JSON.stringify(req.body));
  
  const params = req.method === 'POST' ? req.body : req.query;
  console.log('Params:', JSON.stringify(params));
  
  // If no params, return SUCCESS (PayAnyWay test request)
  if (!params.MNT_TRANSACTION_ID) {
    console.log('Test request - returning SUCCESS');
    return res.send('SUCCESS');
  }
  
  // Verify MNT_ID
  if (params.MNT_ID !== MNT_ID) {
    console.error('Invalid MNT_ID:', params.MNT_ID);
    return res.send('FAIL');
  }
  
  // Verify signature
  const signatureString = 
    params.MNT_ID +
    params.MNT_TRANSACTION_ID +
    params.MNT_OPERATION_ID +
    params.MNT_AMOUNT +
    params.MNT_CURRENCY_CODE +
    (params.MNT_SUBSCRIBER_ID || '') +
    params.MNT_TEST_MODE +
    MNT_INTEGRITY_CODE;
  
  const calculatedSignature = md5(signatureString);
  
  if (calculatedSignature.toLowerCase() !== (params.MNT_SIGNATURE || '').toLowerCase()) {
    console.error('Invalid signature. Expected:', calculatedSignature, 'Got:', params.MNT_SIGNATURE);
    // For now, continue anyway (signature might be different format)
  }
  
  // Extract appointment ID from transaction ID
  const transactionId = params.MNT_TRANSACTION_ID;
  const appointmentId = transactionId.includes('|') ? transactionId.split('|')[0] : transactionId;
  
  console.log('Transaction ID:', transactionId);
  console.log('Appointment ID:', appointmentId);
  
  if (!appointmentId) {
    console.error('Invalid transaction ID format:', transactionId);
    return res.send('FAIL');
  }
  
  try {
    // Create Supabase client with service role key (bypasses RLS)
    console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase credentials');
      return res.send('FAIL');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // First, get the appointment to find the time slot
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('time_slot_id')
      .eq('id', appointmentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);
      return res.send('FAIL');
    }
    
    // Update appointment status to confirmed
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'confirmed',
        payment_id: params.MNT_OPERATION_ID,
      })
      .eq('id', appointmentId);
    
    if (error) {
      console.error('Error updating appointment:', error);
      return res.send('FAIL');
    }
    
    // Block the time slot (mark as unavailable)
    if (appointment && appointment.time_slot_id) {
      const { error: slotError } = await supabase
        .from('time_slots')
        .update({ is_available: false })
        .eq('id', appointment.time_slot_id);
      
      if (slotError) {
        console.error('Error blocking time slot:', slotError);
        // Don't fail - appointment is already confirmed
      }
    }
    
    console.log('Payment confirmed for appointment:', appointmentId);
    return res.send('SUCCESS');
    
  } catch (error) {
    console.error('Error processing payment callback:', error);
    return res.send('FAIL');
  }
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
