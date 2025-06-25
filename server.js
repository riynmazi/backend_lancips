// app.js (BACKEND SERVER)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Konstanta
const TOKEN_PRICE = 0.000005;
const MAX_TOKENS_PER_WALLET = 35000000;
const TOTAL_SUPPLY = 35000000;
const PAY_TO_ADDRESS = "7VJHv1UNSCoxdNmboxLrjMj1FgyaGdSELK9Eo4iaPVC8";

// presale: 3 day
const PRESALE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

// presale time
// update: new Date("2025-06-26T00:00:00Z")
const presaleStartTime = new Date();

// Endpoint presale end
app.get('/presale-end', (req, res) => {
  const endTime = new Date(presaleStartTime.getTime() + PRESALE_DURATION_MS);
  res.json({ endTime: endTime.toISOString() });
});

// Endpoint buy
app.post('/buy', (req, res) => {
  const { walletAddress, amount } = req.body;

  if (!walletAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const now = new Date();
  const endTime = new Date(presaleStartTime.getTime() + PRESALE_DURATION_MS);
  if (now > endTime) {
    return res.status(400).json({ error: '⛔ Presale has ended' });
  }

  const filePath = path.join(__dirname, 'data/buyers.json');

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '[]');
  }

  let buyers = JSON.parse(fs.readFileSync(filePath));
  const totalSold = buyers.reduce((sum, b) => sum + b.amount, 0);

  if (totalSold + amount > TOTAL_SUPPLY) {
    return res.status(400).json({ error: '❌ Token sold out or not enough left' });
  }

  const buyer = buyers.find(b => b.walletAddress === walletAddress);
  const current = buyer ? buyer.amount : 0;
  const updated = current + amount;

  if (updated > MAX_TOKENS_PER_WALLET) {
    return res.status(400).json({ error: '❌ Max 15,000,000 tokens per wallet' });
  }

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

// Endpoint total raised
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

// Server run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});