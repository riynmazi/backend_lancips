const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const TOKEN_PRICE = 0.000005;
const TOTAL_TOKENS = 15000000;
const filePath = path.join(__dirname, '../data/buyers.json');

router.post('/', (req, res) => {
  const { walletAddress, amount } = req.body;
  if (!walletAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  let buyers = [];
  if (fs.existsSync(filePath)) {
    buyers = JSON.parse(fs.readFileSync(filePath));
  }

  const totalSold = buyers.reduce((sum, b) => sum + b.amount, 0);
  if (totalSold + amount > TOTAL_TOKENS) {
    return res.status(400).json({ error: 'Token sold out' });
  }

  const existing = buyers.find(b => b.walletAddress === walletAddress);
  const updated = existing ? (existing.amount + amount) : amount;
  if (updated > TOTAL_TOKENS) {
    return res.status(400).json({ error: 'Wallet limit exceeded' });
  }

  if (existing) {
    existing.amount += amount;
  } else {
    buyers.push({ walletAddress, amount });
  }

  fs.writeFileSync(filePath, JSON.stringify(buyers, null, 2));
  res.json({
    message: 'Purchase accepted',
    wallet: walletAddress,
    amount,
    payAmount: amount * TOKEN_PRICE,
  });
});

module.exports = router;
