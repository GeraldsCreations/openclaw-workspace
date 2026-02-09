#!/usr/bin/env node
// Create token using JWT authentication (bypassing API key step)

const API_BASE = "https://launchpad-backend-production-e95b.up.railway.app/v1";
const WALLET_PATH = process.env.HOME + "/.config/solana/launchpad-bot.json";

const fs = require('fs');
const nacl = require('tweetnacl');
const { Keypair } = require('@solana/web3.js');

async function authenticate() {
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  const walletAddress = keypair.publicKey.toBase58();
  
  console.log('🔐 Authenticating wallet:', walletAddress);
  
  // Step 1: Get nonce
  const nonceRes = await fetch(`${API_BASE}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  const { nonce, message } = await nonceRes.json();
  
  // Step 2: Sign message
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  const signatureBase64 = Buffer.from(signature).toString('base64');
  
  // Step 3: Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      signature: signatureBase64,
      message,
      role: 'agent'
    })
  });
  const { access_token } = await loginRes.json();
  
  return { jwt: access_token, walletAddress };
}

async function createToken(jwt, tokenData) {
  const res = await fetch(`${API_BASE}/tokens/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify(tokenData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error, null, 2));
  }
  
  return await res.json();
}

// Main
(async () => {
  try {
    const { jwt, walletAddress } = await authenticate();
    console.log('✅ Authenticated successfully\n');
    
    const tokenData = {
      name: "Chad",
      symbol: "CHAD",
      description: "The ultimate chad token - for absolute legends 😎",
      imageUrl: "https://via.placeholder.com/800x800/FFD700/000000?text=CHAD",
      creator: walletAddress,
      initialBuy: 0.01
    };
    
    console.log('🚀 Creating CHAD token...');
    const result = await createToken(jwt, tokenData);
    
    console.log('\n✅ Token created successfully!');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
