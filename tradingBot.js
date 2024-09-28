require('dotenv').config(); // Load environment variables
const axios = require('axios');
const crypto = require('crypto');

// Bybit API base URL
const BYBIT_BASE_URL = process.env.BYBIT_BASE_URL || 'https://api.bybit.com';

// Function to generate Bybit API signature
function generateSignature(params) {
  const apiSecret = process.env.BYBIT_API_SECRET;

  // Sort the parameters and create a query string
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Create an HMAC SHA256 signature using the API secret
  return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}

// Function to place a private order (e.g., to execute trades on Bybit)
async function placeOrder(symbol, side, quantity, orderType) {
  const timestamp = Date.now();
  const params = {
    api_key: process.env.BYBIT_API_KEY,
    symbol: symbol,
    side: side,
    qty: quantity,
    timestamp: timestamp,
    time_in_force: 'GoodTillCancel', // Default order expiration setting
    order_type: orderType            // 'Market' or 'Limit'
  };

  // Include price only for limit orders
  if (orderType === 'Limit') {
    throw new Error('Limit orders require a price'); // Handle limit order price requirement here if needed
  }

  // Generate signature for the API call
  params.sign = generateSignature(params);

  try {
    const response = await axios.post(`${BYBIT_BASE_URL}/v2/private/order/create`, null, {
      params,
      headers: {
        'User-Agent': 'TradingBot/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    console.log('Order placed successfully:', response.data);
    return response.data.result;
  } catch (error) {
    if (error.response) {
      console.error('Error placing order:', error.response.data);
    } else {
      console.error('Error placing order:', error.message);
    }
    return false;
  }
  
}

// Function to receive and handle trade requests from webhook.js
async function handleTradeRequest(symbol, side, quantity, orderType) {
  console.log(`Received trade signal - Symbol: ${symbol}, Side: ${side}, Quantity: ${quantity}, Order Type: ${orderType}`);

  // Place the trade on Bybit
  const result = await placeOrder(symbol, side, quantity, orderType);

  if (result) {
    console.log('Trade executed successfully:', result);
    return { success: true, result };
  } else {
    console.log('Trade execution failed.');
    return { success: false };
  }
}

module.exports = {
  handleTradeRequest
};
