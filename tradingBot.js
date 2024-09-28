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
// Function to place a private order (e.g., to execute trades on Bybit)
async function placeOrder(symbol, side, quantity, orderType = 'Market') {
    const timestamp = Date.now().toString();
    const params = {
      api_key: process.env.BYBIT_API_KEY,
      symbol: symbol,
      side: side,
      order_type: orderType,        // 'Market' or 'Limit'
      qty: quantity,
      time_in_force: 'GoodTillCancel',
      timestamp: timestamp
    };
  
    // Generate signature for the API call
    params.sign = generateSignature(params);
  
    try {
      // Send the request to Bybit API to place an order
      const response = await axios.post(`${BYBIT_BASE_URL}/v5/order/create`, params);
      console.log('Order placed successfully:', response.data);
      return response.data.result;
    } catch (error) {
      console.error('Error placing order:', error.response ? error.response.data : error.message);
      return false; // Return false if there’s an error
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
