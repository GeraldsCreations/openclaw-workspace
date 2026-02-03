#!/usr/bin/env node

/**
 * Create multiple test wallets for integration testing
 */

const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const WALLET_COUNT = 5;
const OUTPUT_DIR = '/tmp/launchpad-test/wallets';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`🔑 Creating ${WALLET_COUNT} test wallets...\n`);

const wallets = [];

for (let i = 1; i <= WALLET_COUNT; i++) {
  const keypair = Keypair.generate();
  const walletPath = path.join(OUTPUT_DIR, `wallet${i}.json`);
  
  // Save keypair
  fs.writeFileSync(
    walletPath,
    JSON.stringify(Array.from(keypair.secretKey))
  );
  
  const address = keypair.publicKey.toBase58();
  
  console.log(`✅ Wallet ${i}:`);
  console.log(`   Address: ${address}`);
  console.log(`   Path: ${walletPath}`);
  console.log('');
  
  wallets.push({
    id: i,
    address,
    path: walletPath,
  });
}

// Save wallet info
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'wallets.json'),
  JSON.stringify(wallets, null, 2)
);

console.log('📝 Wallet info saved to wallets.json');
console.log('✅ All test wallets created successfully!');
