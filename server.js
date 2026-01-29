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
  const params = req.method === 'POST' ? req.body : req.query;
  
  // If no params, return SUCCESS (PayAnyWay test request)
  if (!params.MNT_TRANSACTION_ID) {
    return res.send('SUCCESS');
  }
  
  // Verify MNT_ID
  if (params.MNT_ID !== MNT_ID) {
    return res.send('FAIL');
  }
  
  // Extract appointment ID from transaction ID
  const transactionId = params.MNT_TRANSACTION_ID;
  const appointmentId = transactionId.includes('|') ? transactionId.split('|')[0] : transactionId;
  
  if (!appointmentId) {
    return res.send('FAIL');
  }
  
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
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
      return res.send('FAIL');
    }
    
    // Block the time slot (mark as unavailable)
    if (appointment && appointment.time_slot_id) {
      await supabase
        .from('time_slots')
        .update({ is_available: false })
        .eq('id', appointment.time_slot_id);
    }
    
    return res.send('SUCCESS');
    
  } catch (error) {
    return res.send('FAIL');
  }
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes (except /api)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
