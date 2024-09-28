require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const { handleTradeRequest } = require('./tradingBot'); // Import the tradingBot.js functions

const app = express();
app.use(bodyParser.json()); // Parse incoming JSON data

// Webhook endpoint to receive trading signals from TradingView
app.post('/api/webhook', async (req, res) => {
    const { symbol, side, quantity } = req.body;
  
    if (!symbol || !side || !quantity) {
      return res.status(400).send({ error: 'Missing required parameters (symbol, side, quantity).' });
    }
  
    console.log(`Webhook received - Symbol: ${symbol}, Side: ${side}, Quantity: ${quantity}`);
  
    try {
      const tradeResult = await handleTradeRequest(symbol, side, quantity);
  
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
