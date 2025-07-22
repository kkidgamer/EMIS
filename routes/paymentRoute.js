const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Initiate STK Push
router.post('/stk-push', paymentController.initiateSTKPush);

// Handle M-Pesa callback
router.post('/callback', paymentController.handleCallback);

module.exports = router;