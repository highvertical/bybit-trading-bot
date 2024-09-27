require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const { handleTradeRequest } = require('./tradingBot'); // Import the tradingBot.js functions

const app = express();
app.use(bodyParser.json()); // Parse incoming JSON data

// Webhook endpoint to receive trading signals from TradingView
app.post('/api/webhook', async (req, res) => {
  const { symbol, side, quantity, price } = req.body;

  // Validate that all required fields are present
  if (!symbol || !side || !quantity || !price) {
    return res.status(400).send({ error: 'Missing required parameters (symbol, side, quantity, price).' });
  }

  console.log(`Webhook received - Symbol: ${symbol}, Side: ${side}, Quantity: ${quantity}, Price: ${price}`);

  // Send the trade request to the trading bot
  try {
    const tradeResult = await handleTradeRequest(symbol, side, quantity, price);

    if (tradeResult.success) {
      return res.status(200).send({ success: true, message: 'Trade executed successfully.', result: tradeResult.result });
    } else {
      return res.status(500).send({ success: false, message: 'Trade execution failed.' });
    }
  } catch (error) {
    console.error('Error handling webhook request:', error.message);
    return res.status(500).send({ success: false, message: 'Internal server error.' });
  }
});

// Start the server on the port specified in .env, default to 3001
const PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
