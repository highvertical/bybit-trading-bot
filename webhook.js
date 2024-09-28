require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const { handleTradeRequest } = require('./tradingBot'); // Import the tradingBot.js functions

const app = express();
app.use(bodyParser.json()); // Parse incoming JSON data

// Webhook endpoint to receive trading signals from TradingView
app.post('/api/webhook', async (req, res) => {
  const { symbol, side, order_type, quantity } = req.body;  // Now includes order_type
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Validate the incoming webhook secret
  if (req.headers['x-webhook-secret'] !== webhookSecret) {
    return res.status(403).send({ error: 'Unauthorized request' });
  }

  // Input validation for required parameters
  if (!symbol || !side || !quantity || !order_type) {
    return res.status(400).send({ error: 'Missing required parameters (symbol, side, order_type, quantity).' });
  }

  if (typeof symbol !== 'string' || typeof side !== 'string' || typeof order_type !== 'string' || typeof quantity !== 'number') {
    return res.status(400).send({ error: 'Invalid parameter types.' });
  }

  console.log(`Webhook received - Symbol: ${symbol}, Side: ${side}, Order Type: ${order_type}, Quantity: ${quantity}`);

  try {
    const tradeResult = await handleTradeRequest(symbol, side, quantity, order_type);  // Pass order_type to trade handler

    if (tradeResult.success) {
      return res.status(200).send({ success: true, message: 'Trade executed successfully.', result: tradeResult.result });
    } else {
      console.error('Trade execution failed:', tradeResult);
      return res.status(500).send({ success: false, message: 'Trade execution failed.', error: tradeResult });
    }
  } catch (error) {
    console.error('Error handling webhook request:', error.message);
    return res.status(500).send({ success: false, message: 'Internal server error.', error: error.message });
  }
});

// Start the server on the port specified in .env, default to 3001
const PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
