const express = require('express'); 
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Konfigurasi dasar
const TOKEN_PRICE = 0.000005; // Harga per token (dalam SOL)
const TOTAL_TOKENS = 15000000; // Total token yang bisa dibeli di web
const MIN_PURCHASE_SOL = 0.02; // Minimum pembelian dalam SOL

// Endpoint /buy
router.post('/', (req, res) => {
  const { walletAddress, amount } = req.body;

  // Validasi input
  if (!walletAddress || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '❌ Invalid request data' });
  }

  // Hitung total SOL yang harus dibayar
  const totalSol = amount * TOKEN_PRICE;
  if (totalSol < MIN_PURCHASE_SOL) {
    return res.status(400).json({
      error: `⚠️ Minimum purchase is ${MIN_PURCHASE_SOL} SOL (≈ ${(MIN_PURCHASE_SOL / TOKEN_PRICE).toLocaleString()} LANCIPS)`
    });
  }

  // Path data pembeli
  const filePath = path.join(__dirname, '../data/buyers.json');
  let buyers = [];

  // Baca data jika ada
  if (fs.existsSync(filePath)) {
    buyers = JSON.parse(fs.readFileSync(filePath));
  }

  // Hitung total token yang sudah dijual
  const totalSold = buyers.reduce((sum, b) => sum + b.amount, 0);
  if (totalSold + amount > TOTAL_TOKENS) {
    return res.status(400).json({ error: '❌ Token sold out or not enough left' });
  }

  // Hitung total pembelian wallet ini
  const existing = buyers.find(b => b.walletAddress === walletAddress);
  const walletTotal = buyers
    .filter(b => b.walletAddress === walletAddress)
    .reduce((sum, b) => sum + b.amount, 0);

  const newTotal = walletTotal + amount;
  if (newTotal > TOTAL_TOKENS) {
    return res.status(400).json({
      error: '❌ Limit exceeded: Max 15,000,000 tokens per wallet.'
    });
  }

  // Simpan transaksi
  buyers.push({ walletAddress, amount, timestamp: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(buyers, null, 2));

  // Kirim respons
  res.json({
    message: '✅ Purchase request accepted',
    wallet: walletAddress,
    amount,
    payAmount: totalSol
  });
});

module.exports = router;
