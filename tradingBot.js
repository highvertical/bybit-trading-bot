require('dotenv').config(); // Load environment variables
const crypto = require('crypto');
const axios = require('axios');

const BYBIT_BASE_URL = 'https://api-testnet.bybit.com';  // Use the appropriate endpoint
const API_KEY = process.env.BYBIT_API_KEY;
const API_SECRET = process.env.BYBIT_API_SECRET;
const RECV_WINDOW = 5000;  // Optional, in milliseconds

// Function to generate the HMAC_SHA256 signature
function generateSignature(params, secret) {
  const orderedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
}

// Function to place a private order (e.g., to execute trades on Bybit)
async function placeOrder(symbol, side, quantity, orderType = 'Market', category = 'linear') {
  const timestamp = Date.now().toString();
  
  const params = {
    api_key: API_KEY,
    symbol: symbol,
    side: side,
    qty: quantity,
    order_type: orderType,  // 'Market' or 'Limit'
    category: category,     // 'spot', 'linear', 'inverse', or 'option'
    time_in_force: 'GoodTillCancel',
    recv_window: RECV_WINDOW,
    timestamp: timestamp
  };

  // Generate signature for the API call
  params.sign = generateSignature(params, API_SECRET);

  try {
    // Send the request to Bybit API to place an order
    const response = await axios.post(`${BYBIT_BASE_URL}/v5/order/create`, params, {
      headers: {
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': RECV_WINDOW,
        'X-BAPI-SIGN': params.sign,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Order placed successfully:', response.data);
    return response.data.result;
  } catch (error) {
    console.error('Error placing order:', error.response ? error.response.data : error.message);
    return false;  // Return false if there’s an error
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
    //console.log('Trade execution failed.');
    console.log(`Received trade signal - Symbol: ${symbol}, Side: ${side}, Quantity: ${quantity}, Order Type: ${orderType}`);
    return { success: false };
  }
}

module.exports = {
  handleTradeRequest
};
