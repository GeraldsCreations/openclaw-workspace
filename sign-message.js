#!/usr/bin/env node
// Sign message with Solana wallet using nacl (compatible with backend verification)

const fs = require('fs');
const nacl = require('tweetnacl');
const { Keypair } = require('@solana/web3.js');

const walletPath = process.argv[2];
const message = process.argv[3];

if (!walletPath || !message) {
  console.error('Usage: node sign-message.js <wallet_path> <message>');
  process.exit(1);
}

try {
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  // Convert message to bytes
  const messageBytes = new TextEncoder().encode(message);
  
  // Sign message (detached signature)
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  
  // Convert to base64
  const signatureBase64 = Buffer.from(signature).toString('base64');
  
  console.log(signatureBase64);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
