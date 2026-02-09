#!/usr/bin/env node
// Buy and sell CHAD tokens

const fs = require('fs');
const nacl = require('tweetnacl');
const { Connection, Keypair, Transaction } = require('@solana/web3.js');

const API_BASE = "https://launchpad-backend-production-e95b.up.railway.app/v1";
const WALLET_PATH = process.env.HOME + "/.config/solana/launchpad-bot.json";
const RPC_URL = "https://api.mainnet-beta.solana.com";
const CHAD_TOKEN = "APcvFtUV2ckRdLHFZwUs9x4bB2FSpdnBPbaqm5QUbFFy";

async function authenticate() {
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  const walletAddress = keypair.publicKey.toBase58();
  
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
  
  const { access_token } = await loginRes.json();
  return { jwt: access_token, walletAddress, keypair };
}

async function buyTokens(jwt, walletAddress, amount) {
  console.log(`\n💰 Buying ${amount} SOL worth of CHAD...`);
  
  const res = await fetch(`${API_BASE}/trade/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify({
      tokenAddress: CHAD_TOKEN,
      buyer: walletAddress,
      amountSol: amount,
      minTokensOut: 0
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error('Buy failed: ' + JSON.stringify(error, null, 2));
  }
  
  return await res.json();
}

async function sellTokens(jwt, walletAddress, amount) {
  console.log(`\n💸 Selling ${amount} CHAD tokens...`);
  
  const res = await fetch(`${API_BASE}/trade/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify({
      tokenAddress: CHAD_TOKEN,
      seller: walletAddress,
      amountTokens: amount,
      minSolOut: 0
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error('Sell failed: ' + JSON.stringify(error, null, 2));
  }
  
  return await res.json();
}

async function signAndSubmit(transactionBase64, keypair) {
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Deserialize transaction
  const transactionBuffer = Buffer.from(transactionBase64, 'base64');
  const transaction = Transaction.from(transactionBuffer);
  
  // Sign
  transaction.partialSign(keypair);
  
  console.log('📡 Submitting...');
  
  // Submit
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    { skipPreflight: false, preflightCommitment: 'confirmed' }
  );
  
  // Confirm
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}

// Main
(async () => {
  try {
    console.log('🔐 Authenticating...');
    const { jwt, walletAddress, keypair } = await authenticate();
    console.log('✅ Authenticated:', walletAddress);
    
    // Buy 0.05 SOL worth of CHAD
    const buyResult = await buyTokens(jwt, walletAddress, 0.05);
    console.log('✅ Buy transaction received');
    console.log('   Estimated tokens:', buyResult.estimatedTokens || 'N/A');
    
    const buySig = await signAndSubmit(buyResult.transaction, keypair);
    console.log('✅ Buy complete!');
    console.log('📝 Signature:', buySig);
    console.log('🔍 https://solscan.io/tx/' + buySig);
    
    // Wait a bit
    console.log('\n⏳ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Sell half of what we bought
    const tokensToSell = Math.floor((buyResult.estimatedTokens || 1000) / 2);
    const sellResult = await sellTokens(jwt, walletAddress, tokensToSell);
    console.log('✅ Sell transaction received');
    console.log('   Estimated SOL:', sellResult.estimatedSol || 'N/A');
    
    const sellSig = await signAndSubmit(sellResult.transaction, keypair);
    console.log('✅ Sell complete!');
    console.log('📝 Signature:', sellSig);
    console.log('🔍 https://solscan.io/tx/' + sellSig);
    
    console.log('\n🎉 Trading test complete!');
    console.log('✅ Bought CHAD with SOL');
    console.log('✅ Sold CHAD for SOL');
    console.log('\nBoth buy and sell flows working! 🚀');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
