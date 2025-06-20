const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const PORT = 3000;

// Import route pembelian
const buyRoute = require('./routes/buy');

// Middleware: parsing JSON body dari frontend
app.use(express.json());

// Endpoint pembelian token
app.use('/buy', buyRoute);

// Endpoint status penjualan (opsional untuk statistik frontend)
app.get('/status', (req, res) => {
  const buyersPath = path.join(__dirname, 'data/buyers.json');
  const buyers = fs.existsSync(buyersPath)
    ? JSON.parse(fs.readFileSync(buyersPath))
    : [];

  const totalSold = buyers.reduce((sum, b) => sum + b.amount, 0);
  const totalBuyers = new Set(buyers.map(b => b.walletAddress)).size;

  res.json({
    status: '✅ Online',
    totalSold,
    totalBuyers,
    remaining: 15000000 - totalSold
  });
});

// Tes endpoint root
app.get('/', (req, res) => {
  res.send('✅ Backend presale LANCIPS aktif!');
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});
