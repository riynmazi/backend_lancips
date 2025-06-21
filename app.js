// ✅ Buffer Polyfill (hex, base64, utf8)
if (typeof Buffer === "undefined") {
  window.Buffer = {
    from: function (input, encoding) {
      if (encoding === "base64") {
        const binary = atob(input);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
      if (encoding === "utf8" || encoding === "utf-8") {
        return new TextEncoder().encode(input);
      }
      if (encoding === "hex") {
        const bytes = new Uint8Array(input.length / 2);
        for (let i = 0; i < input.length; i += 2) {
          bytes[i / 2] = parseInt(input.substr(i, 2), 16);
        }
        return bytes;
      }
      throw new Error("Unsupported encoding: " + encoding);
    }
  };
}

// 🧠 DOM Elements
const connectBtn = document.getElementById("connect");
const buyBtn = document.getElementById("buy");
const solAmountInput = document.getElementById("solAmount");
const tokenAmountSpan = document.getElementById("tokenAmount");
const walletAddressText = document.getElementById("wallet-address");
const statusMsg = document.getElementById("status-message");
const totalBought = document.getElementById("total-bought");

let wallet = null;
const PRICE_PER_TOKEN = 0.000005;

// ⏱️ Init
window.addEventListener("load", () => {
  buyBtn.disabled = true;
  statusMsg.textContent = "Connect your wallet to get started";
  tokenAmountSpan.textContent = "0";
});

// 🧮 Load previous purchase
function loadPurchaseData() {
  if (wallet) {
    const key = `lancips-${wallet}`;
    const bought = localStorage.getItem(key);
    totalBought.textContent = bought ? parseFloat(bought).toLocaleString() : "0";
  }
}

function updatePurchaseRecord(amount) {
  const key = `lancips-${wallet}`;
  const current = parseFloat(localStorage.getItem(key)) || 0;
  const updated = current + amount;
  localStorage.setItem(key, updated);
  totalBought.textContent = updated.toLocaleString();
}

// ✅ Connect Wallet
connectBtn.onclick = async () => {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert("⚠️ Phantom Wallet not found. Please install it from https://phantom.app");
      return;
    }

    const resp = await window.solana.connect();
    wallet = resp.publicKey.toString();
    walletAddressText.textContent = "✅ Connected: " + wallet;
    statusMsg.textContent = "Wallet connected.";
    buyBtn.disabled = false;
    loadPurchaseData();
  } catch (err) {
    alert("❌ Wallet connection failed.\n\nTry using Phantom browser or app.");
    statusMsg.textContent = "❌ Wallet connection failed.";
    buyBtn.disabled = true;
  }
};

// 🧮 Realtime token preview
solAmountInput.oninput = () => {
  const sol = parseFloat(solAmountInput.value) || 0;
  const tokens = sol / PRICE_PER_TOKEN;
  tokenAmountSpan.textContent = tokens.toLocaleString();
};

// ✅ Buy Button
buyBtn.onclick = async () => {
  const sol = parseFloat(solAmountInput.value);
  const tokens = sol / PRICE_PER_TOKEN;
  const currentBought = parseFloat(localStorage.getItem(`lancips-${wallet}`)) || 0;
  const newTotal = currentBought + tokens;

  if (!sol || sol <= 0 || tokens <= 0) {
    alert("⚠️ Please enter a valid amount of SOL.");
    return;
  }

  if (newTotal > 15000000) {
    alert("❌ Limit exceeded: Max 15,000,000 LANCIPS per wallet.");
    return;
  }

  buyBtn.disabled = true;
  buyBtn.textContent = "Processing...";
  statusMsg.textContent = "⏳ Sending transaction...";

  try {
    // ✅ Hit backend
    const backendURL = "https://backendlancips-production.up.railway.app/buy";
    const backendRes = await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: wallet,
        amount: tokens
      })
    });

    const result = await backendRes.json();
    if (!backendRes.ok) {
      throw new Error(result.error || "Backend error");
    }

    // ✅ Kirim SOL ke backend wallet
    const toPubkey = new solanaWeb3.PublicKey(result.payTo);
    const fromPubkey = new solanaWeb3.PublicKey(wallet);
    const connection = new solanaWeb3.Connection("https://rpc.ankr.com/solana", "confirmed"); // ✅ BUKAN api.mainnet-beta.solana.com

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.floor(sol * solanaWeb3.LAMPORTS_PER_SOL),
      })
    );

    transaction.feePayer = fromPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signed = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature, "confirmed");

    alert("✅ Transaction successful!\nTX Hash:\n" + signature);
    statusMsg.textContent = "✅ Purchase complete!";
    updatePurchaseRecord(tokens);
    solAmountInput.value = "";
    tokenAmountSpan.textContent = "0";
  } catch (e) {
    console.error(e);
    alert("❌ Error:\n" + e.message);
    statusMsg.textContent = "❌ Transaction failed.";
  } finally {
    buyBtn.disabled = false;
    buyBtn.textContent = "Buy LANCIPS";
  }
};