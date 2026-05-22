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
  const metaConfigured = Boolean(
    process.env.WHATSAPP_TOKEN
    && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
  const mockWhatsapp = String(process.env.USE_MOCK_WHATSAPP).toLowerCase() === 'true';
  const baseUrl = getBaseUrl(req);
  const webhookPath = '/api/webhook/whatsapp';
  const missingMeta = [
    ['WHATSAPP_TOKEN', process.env.WHATSAPP_TOKEN],
    ['WHATSAPP_PHONE_NUMBER_ID', process.env.WHATSAPP_PHONE_NUMBER_ID],
    ['WHATSAPP_VERIFY_TOKEN', process.env.WHATSAPP_VERIFY_TOKEN]
  ].filter(([, value]) => !value).map(([key]) => key);

  return res.json({
    success: true,
    status: {
      api: 'online',
      database: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      geminiConfigured: Boolean(process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      whatsappMode: mockWhatsapp ? 'mock' : 'meta',
      metaConfigured,
      realWhatsappReady: !mockWhatsapp && metaConfigured,
      missingMeta,
      webhookPath,
      webhookUrl: `${baseUrl}${webhookPath}`
    }
  });
});

module.exports = router;
