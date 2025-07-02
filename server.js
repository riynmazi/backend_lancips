// app.js (BACKEND SERVER)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Constants
const TOKEN_PRICE = 0.00001;
const MAX_TOKENS_PER_WALLET = 500000;
const TOTAL_SUPPLY = 35000000;
const PAY_TO_ADDRESS = "7VJHv1UNSCoxdNmboxLrjMj1FgyaGdSELK9Eo4iaPVC8";

// Presale config (now ignored, no time limit)
const PRESALE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
const presaleStartTime = new Date();

// This endpoint is unused if you remove countdown from frontend
app.get('/presale-end', (req, res) => {
  const endTime = new Date(presaleStartTime.getTime() + PRESALE_DURATION_MS);
  res.json({ endTime: endTime.toISOString() });
});

// Purchase endpoint (⛔ time check removed)
app.post('/buy', (req, res) => {
  const { walletAddress, amount } = req.body;

  // Validate input
  if (!walletAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const filePath = path.join(__dirname, 'data/buyers.json');

  // Create buyers file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '[]');
  }

  let buyers = JSON.parse(fs.readFileSync(filePath));
  const totalSold = buyers.reduce((sum, b) => sum + b.amount, 0);

  // Check supply limit
  if (totalSold + amount > TOTAL_SUPPLY) {
    return res.status(400).json({ error: '❌ Token sold out or not enough left' });
  }

  // Check wallet limit
  const buyer = buyers.find(b => b.walletAddress === walletAddress);
  const current = buyer ? buyer.amount : 0;
  const updated = current + amount;

  if (updated > MAX_TOKENS_PER_WALLET) {
    return res.status(400).json({ error: '❌ Max 500,000 tokens per wallet' });
  }

  // Save purchase
  if (buyer) {
    buyer.amount = updated;
  } else {
    buyers.push({ walletAddress, amount });
  }

  fs.writeFileSync(filePath, JSON.stringify(buyers, null, 2));

  res.json({
    message: '✅ Purchase recorded',
    wallet: walletAddress,
    amount,
    payAmount: amount * TOKEN_PRICE,
    payTo: PAY_TO_ADDRESS
  });
});

// Total raised endpoint
app.get('/total-raised', (req, res) => {
  const filePath = path.join(__dirname, 'data/buyers.json');

  if (!fs.existsSync(filePath)) {
    return res.json({ totalRaised: 0 });
  }

  const buyers = JSON.parse(fs.readFileSync(filePath));
  const totalRaised = buyers.reduce((sum, b) => sum + parseFloat(b.amount) * TOKEN_PRICE, 0);

  console.log("📊 Total raised:", totalRaised);
  res.json({ totalRaised });
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('✅ LANCIPS backend is running!');
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});