const express = require('express');
const { receiveWhatsappResponse } = require('../controllers/whatsappController');

const router = express.Router();

router.post('/whatsapp', receiveWhatsappResponse);

module.exports = router;
