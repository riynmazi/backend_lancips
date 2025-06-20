const express = require('express'); 
const router = express.Router();
const fs = require('fs');
const path = require('path');

const TOKEN_PRICE = 0.000005;
const TOTAL_TOKENS = 15000000;
const MAX_PER_WALLET = 15000000;

router.post('/', (req, res) => {
  const { walletAddress, amount } = req.body;

  if (!walletAddress || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const filePath = path.join(__dirname, '../data/buyers.json');
  let buyers = [];

  if (fs.existsSync(filePath)) {
    buyers = JSON.parse(fs.readFileSync(filePath));
  }

  const user = buyers.find(b => b.walletAddress === walletAddress);
  const totalBought = buyers.reduce((sum, b) => sum + b.amount, 0);

  if (totalBought + amount > TOTAL_TOKENS) {
    return res.status(400).json({ error: 'Token sold out or not enough left' });
  }

  const walletTotal = user ? user.amount + amount : amount;
  if (walletTotal > MAX_PER_WALLET) {
    return res.status(400).json({ error: 'Exceeds max per wallet (15,000,000 LANCIPS)' });
  }

  if (user) {
    user.amount += amount;
  } else {
    buyers.push({ walletAddress, amount });
  }

  fs.writeFileSync(filePath, JSON.stringify(buyers, null, 2));

  const payAmount = amount * TOKEN_PRICE;

  res.json({
    message: 'Purchase request accepted',
    wallet: walletAddress,
    amount,
    payAmount
  });
});

module.exports = router;
