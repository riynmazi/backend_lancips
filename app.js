const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Konstanta
const TOKEN_PRICE = 0.000005;
const MAX_TOKENS_PER_WALLET = 15000000;
const TOTAL_SUPPLY = 15000000;
const PAY_TO_ADDRESS = "7VJHv1UNSCoxdNmboxLrjMj1FgyaGdSELK9Eo4iaPVC8";

// Route utama /buy
app.post('/buy', (req, res) => {
  const { walletAddress, amount } = req.body;

  if (!walletAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const filePath = path.join(__dirname, 'data/buyers.json');
  if (!fs.existsSync(filePath)) {
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

// Default fallback
app.get('/', (req, res) => {
  res.send('✅ LANCIPS backend is running');
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});