const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');

// M-Pesa utility functions
async function getAccessToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(`${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return response.data.access_token;
}

function getTimestamp() {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHmmss
}

function getPassword(timestamp) {
  return Buffer.from(`${process.env.MPESA_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
}

// Initiate STK Push
router.post('/stk-push', async (req, res) => {
  const { userId, amount, bookingId, description } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !user.phoneNumber) {
      return res.status(400).json({ error: 'User not found or no phone number' });
    }

    const payment = await Payment.create({
      userId,
      bookingId,
      amount,
      phoneNumber: user.phoneNumber,
      status: 'pending',
    });

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: user.phoneNumber,
      PartyB: process.env.MPESA_SHORT_CODE,
      PhoneNumber: user.phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: payment._id.toString(),
      TransactionDesc: description || 'Service payment',
    };

    const response = await axios.post(`${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    await Payment.updateOne(
      { _id: payment._id },
      {
        merchantRequestID: response.data.MerchantRequestID,
        checkoutRequestID: response.data.CheckoutRequestID,
      }
    );

    res.json({
      message: 'STK Push initiated',
      paymentId: payment._id,
      mpesaResponse: response.data,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initiate STK Push',
      details: error.response?.data || error.message,
    });
  }
});

// Handle M-Pesa callback
router.post('/callback', async (req, res) => {
  const { Body: { stkCallback } } = req.body;
  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

  try {
    const payment = await Payment.findOne({ merchantRequestID: MerchantRequestID, checkoutRequestID: CheckoutRequestID });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (ResultCode === 0) {
      const metadata = stkCallback.CallbackMetadata.Item;
      payment.status = 'completed';
      payment.mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      payment.transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      payment.phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
    } else {
      payment.status = 'failed';
      payment.errorMessage = ResultDesc;
    }

    await payment.save();
    res.status(200).json({ message: 'Callback processed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process callback', details: error.message });
  }
});

module.exports = router;