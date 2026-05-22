const express = require('express');

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
  const twilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID
    && process.env.TWILIO_AUTH_TOKEN
    && process.env.TWILIO_WHATSAPP_NUMBER
  );
  const mockWhatsapp = String(process.env.USE_MOCK_WHATSAPP).toLowerCase() === 'true';
  const baseUrl = getBaseUrl(req);
  const webhookPath = '/api/webhook/whatsapp';
  const missingTwilio = [
    ['TWILIO_ACCOUNT_SID', process.env.TWILIO_ACCOUNT_SID],
    ['TWILIO_AUTH_TOKEN', process.env.TWILIO_AUTH_TOKEN],
    ['TWILIO_WHATSAPP_NUMBER', process.env.TWILIO_WHATSAPP_NUMBER]
  ].filter(([, value]) => !value).map(([key]) => key);

  return res.json({
    success: true,
    status: {
      api: 'online',
      database: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      whatsappMode: mockWhatsapp ? 'mock' : 'twilio',
      twilioConfigured,
      realWhatsappReady: !mockWhatsapp && twilioConfigured,
      missingTwilio,
      sender: process.env.TWILIO_WHATSAPP_NUMBER || '',
      webhookPath,
      webhookUrl: `${baseUrl}${webhookPath}`
    }
  });
});

module.exports = router;
