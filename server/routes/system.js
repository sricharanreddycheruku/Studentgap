const express = require('express');
const { smsReady } = require('../services/smsService');
const { greenApiReady } = require('../services/whatsappService');

const router = express.Router();

const getBaseUrl = (req) => {
  if (process.env.PUBLIC_WEBHOOK_URL) {
    return process.env.PUBLIC_WEBHOOK_URL.replace(/\/$/, '');
  }

  const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
  if (replitDomain) {
    const domain = replitDomain.split(',')[0].trim();
    return `https://${domain}`;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${host}`;
};

router.get('/status', (req, res) => {
  const greenApiConfigured = greenApiReady();
  const baseUrl = getBaseUrl(req);
  const webhookPath = '/api/webhook/whatsapp';
  const missing = [
    ['GREENAPI_INSTANCE_ID', process.env.GREENAPI_INSTANCE_ID],
    ['GREENAPI_API_TOKEN', process.env.GREENAPI_API_TOKEN],
    ['TWILIO_ACCOUNT_SID', process.env.TWILIO_ACCOUNT_SID],
    ['TWILIO_AUTH_TOKEN', process.env.TWILIO_AUTH_TOKEN],
    ['TWILIO_SMS_FROM', process.env.TWILIO_SMS_FROM]
  ].filter(([, v]) => !v).map(([k]) => k);

  return res.json({
    success: true,
    status: {
      api: 'online',
      database: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      geminiConfigured: Boolean(process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      whatsappMode: 'greenapi',
      greenApiConfigured,
      realWhatsappReady: greenApiConfigured,
      smsConfigured: smsReady(),
      missing,
      webhookPath,
      webhookUrl: `${baseUrl}${webhookPath}`
    }
  });
});

module.exports = router;
