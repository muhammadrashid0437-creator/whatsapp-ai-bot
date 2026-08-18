const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(express.json());

// Your Supabase Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ctkxcgzjommxnebqcziy.supabase.co";
// PASTE YOUR ANON KEY BELOW IN PLACE OF YOUR_SUPABASE_ANON_KEY
const SUPABASE_KEY = process.env.SUPABASE_KEY || "YOUR_SUPABASE_ANON_KEY";

// Secret verification token you choose for Meta (WhatsApp)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_secure_whatsapp_token_123";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🚀 WhatsApp AI Server is Live and Running!');
});

// 1. Meta Webhook Verification (GET Request from Meta)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED BY META');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Incoming WhatsApp Messages Handler (POST Request from Meta)
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message && message.type === 'text') {
        const from = message.from; // Customer's WhatsApp Number
        const userText = message.text.body; // What customer typed
        const phone_number_id = value.metadata.phone_number_id;

        console.log(`Incoming message from ${from}: ${userText}`);

        // Fetch Live Products & Store Branches from Supabase
        const { data: products } = await supabase.from('products').select('*');
        const { data: branches } = await supabase.from('store_branches').select('*');

        const catalog = products 
          ? products.map(p => `• ${p.title}: $${p.price} (Stock: ${p.stock_quantity})`).join('\n')
          : "No products available.";

        const stores = branches
          ? branches.map(b => `📍 ${b.branch_name}: ${b.address} (Ph: ${b.phone})`).join('\n')
          : "No store locations available.";

        // Smart Response Logic
        let responseMessage = "";
        if (userText.toLowerCase().includes('hi') || userText.toLowerCase().includes('hello')) {
          responseMessage = `Hello! 👋 Welcome to our Assistant.\n\n📍 Our Stores:\n${stores}\n\nAsk me about any products or stock!`;
        } else {
          responseMessage = `📦 Current Catalog:\n\n${catalog}\n\n📍 Locations:\n${stores}\n\nWould you like to place an order?`;
        }

        // Send Reply Back to WhatsApp
        await sendWhatsAppMessage(phone_number_id, process.env.WHATSAPP_TOKEN, from, responseMessage);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing message:", error);
    res.sendStatus(500);
  }
});

async function sendWhatsAppMessage(phone_number_id, token, to, text) {
  if (!token) {
    console.log("Simulated Reply (Meta Token not configured yet):", text);
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error("Failed to send WhatsApp reply:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
