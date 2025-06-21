# 🐸 LANCIPS - Backend

This is the backend server for the LANCIPS presale, a Solana meme token project that takes honesty seriously (even if the project isn’t).

It handles:
- Presale token allocation
- Per-wallet limits
- Buyer record tracking
- Communication with the frontend via API

---

## 🌐 Live API Endpoint

> POST `https://backendlancips-production.up.railway.app/buy`

---

## 📦 Features

- Records token purchase requests
- Validates per-wallet max limit (15,000,000 LANCIPS)
- Tracks total tokens sold (max 15,000,000 for web presale)
- Returns wallet address to send SOL to
- Simple JSON file-based storage (`buyers.json`)
- CORS enabled for frontend communication

---

## 🛡️ How It Works

1. Frontend sends a request like:
```json
{
  "walletAddress": "7VJHv1UNSCoxdNmboxLrjMj1FgyaGdSELK9Eo4iaPVC8",
  "amount": 2000000
}