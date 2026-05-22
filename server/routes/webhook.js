const express = require('express');
const { verifyWebhook, receiveWhatsappResponse } = require('../controllers/whatsappController');

const router = express.Router();

// Meta requires a GET endpoint for webhook verification
router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', receiveWhatsappResponse);

module.exports = router;
