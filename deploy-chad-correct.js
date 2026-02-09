#!/usr/bin/env node
// Deploy CHAD token using the CORRECT flow:
// 1. JWT auth → 2. /tokens/create (unsigned tx) → 3. Sign → 4. Submit

const fs = require('fs');
const nacl = require('tweetnacl');
const { Connection, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');

const API_BASE = "https://launchpad-backend-production-e95b.up.railway.app/v1";
const WALLET_PATH = process.env.HOME + "/.config/solana/launchpad-bot.json";
const RPC_URL = "https://api.mainnet-beta.solana.com";

async function authenticate() {
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  const walletAddress = keypair.publicKey.toBase58();
  
  console.log('🔐 Authenticating wallet:', walletAddress);
  
  // Get nonce
  const nonceRes = await fetch(`${API_BASE}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  const { nonce, message } = await nonceRes.json();
  
  // Sign message
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  const signatureBase64 = Buffer.from(signature).toString('base64');
  
  // Login
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
  
  if (!loginRes.ok) {
    const error = await loginRes.json();
    throw new Error('Login failed: ' + JSON.stringify(error));
  }
  
  const { access_token } = await loginRes.json();
  
  return { jwt: access_token, walletAddress, keypair };
}

async function createTokenUnsigned(jwt, walletAddress) {
  console.log('\n🚀 Creating CHAD token (unsigned transaction)...');
  
  const tokenData = {
    name: "Chad",
    symbol: "CHAD",
    description: "The ultimate chad token - for absolute legends 😎",
    imageUrl: "https://via.placeholder.com/800x800/FFD700/000000?text=CHAD",
    creator: walletAddress,
    initialBuy: 0.01
  };
  
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
    throw new Error('Create failed: ' + JSON.stringify(error));
  }
  
  return await res.json();
}

async function signAndSubmit(transactionBase64, keypair) {
  console.log('\n✏️  Signing transaction with your wallet...');
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Deserialize transaction
  const transactionBuffer = Buffer.from(transactionBase64, 'base64');
  const transaction = Transaction.from(transactionBuffer);
  
  // Sign with your wallet
  transaction.partialSign(keypair);
  
  console.log('📡 Submitting to Solana network...');
  
  // Submit
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    }
  );
  
  console.log('⏳ Confirming transaction...');
  
  // Confirm
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}

// Main
(async () => {
  try {
    const { jwt, walletAddress, keypair } = await authenticate();
    console.log('✅ Authenticated\n');
    
    const result = await createTokenUnsigned(jwt, walletAddress);
    console.log('✅ Unsigned transaction received');
    console.log('   Token Mint:', result.tokenMint);
    console.log('   Pool Address:', result.poolAddress);
    
    const signature = await signAndSubmit(result.transaction, keypair);
    
    console.log('\n🎉 CHAD TOKEN DEPLOYED!');
    console.log('📝 Signature:', signature);
    console.log('🔍 Explorer: https://solscan.io/tx/' + signature);
    console.log('🪙 Token: https://solscan.io/token/' + result.tokenMint);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
