require('dotenv').config(); // Load environment variables
const crypto = require('crypto');
const axios = require('axios');

const BYBIT_BASE_URL = 'https://api-testnet.bybit.com';
const API_KEY = process.env.BYBIT_API_KEY;
const API_SECRET = process.env.BYBIT_API_SECRET;
const RECV_WINDOW = 5000;

// Create an axios instance with a timeout
const axiosInstance = axios.create({
  timeout: 5000, // 5 seconds timeout
});

// Utility function to generate a signature for Bybit API
function generateSignature(params, secret) {
  const orderedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
}

// Place an order on Bybit
async function placeOrder(symbol, side, quantity, orderType = 'Market', category = 'linear') {
    const timestamp = Date.now().toString();
    const params = {
      api_key: API_KEY,
      symbol: symbol,
      side: side,
      qty: quantity,
      order_type: orderType,
      category: category,
      time_in_force: 'GoodTillCancel',
      recv_window: RECV_WINDOW,
      timestamp: timestamp
    };
  
    params.sign = generateSignature(params, API_SECRET);
  
    for (let retries = 3; retries > 0; retries--) {
      try {
        console.log('Placing order with params:', params);
  
        const response = await axios.post(`${BYBIT_BASE_URL}/v5/order/create`, params, {
          headers: {
            'X-BAPI-API-KEY': API_KEY,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': RECV_WINDOW,
            'X-BAPI-SIGN': params.sign,
            'Content-Type': 'application/json',
          }
        });
  
        console.log('API response:', response.data);
  
        if (response.data.ret_code !== 0) {
          console.error('Bybit API error:', response.data.ret_msg);
          return { success: false, message: response.data.ret_msg }; // Send the error message back
        }
  
        console.log('Order placed successfully:', response.data);
        return response.data.result;
      } catch (error) {
        // Log detailed error information for debugging
        console.error('Error placing order:', error.response ? error.response.data : error.message);
        
        if (error.response && error.response.status === 429 && retries > 0) {
          console.log('Rate limit exceeded, retrying...');
          await new Promise(res => setTimeout(res, 1000));
        } else {
          // Return the error response from Bybit
          return { success: false, message: error.response ? error.response.data : error.message };
        }
      }
    }
    return { success: false, message: 'Max retries exceeded.' };
  }
   

// Handle trade request triggered by a webhook
async function handleTradeRequest(symbol, side, quantity, orderType) {
  console.log(`Received trade signal - Symbol: ${symbol}, Side: ${side}, Quantity: ${quantity}, Order Type: ${orderType}`);

  const result = await placeOrder(symbol, side, quantity, orderType);

  if (result) {
    console.log('Trade executed successfully:', result);
    return { success: true, result };
  } else {
    console.error('Trade execution failed:', { symbol, side, quantity, orderType });
    return { success: false };
  }
}

module.exports = {
  handleTradeRequest
};
