#!/usr/bin/env node

/**
 * Airdrop SOL to test wallets
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { config } = require('./config');
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = '/tmp/launchpad-test/wallets/wallets.json';
const AIRDROP_AMOUNT = 2; // SOL per wallet

async function airdropToWallets() {
  const connection = new Connection(config.rpcUrl, 'confirmed');
  
  console.log(`💸 Airdropping ${AIRDROP_AMOUNT} SOL to each test wallet...\n`);
  
  // Load wallet addresses
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  
  for (const wallet of wallets) {
    try {
      console.log(`Wallet ${wallet.id}: ${wallet.address}`);
      
      const publicKey = new PublicKey(wallet.address);
      
      // Request airdrop
      const signature = await connection.requestAirdrop(
        publicKey,
        AIRDROP_AMOUNT * LAMPORTS_PER_SOL
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      // Check balance
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      console.log(`✅ Airdropped ${AIRDROP_AMOUNT} SOL | Balance: ${solBalance.toFixed(4)} SOL`);
      console.log(`   Signature: ${signature}\n`);
      
      // Wait 1 second between airdrops to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to airdrop to wallet ${wallet.id}:`, error.message);
      console.log('   Retrying in 5 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Retry once
      try {
        const publicKey = new PublicKey(wallet.address);
        const signature = await connection.requestAirdrop(
          publicKey,
          AIRDROP_AMOUNT * LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(signature);
        console.log(`✅ Retry successful for wallet ${wallet.id}\n`);
      } catch (retryError) {
        console.error(`❌ Retry failed for wallet ${wallet.id}:`, retryError.message, '\n');
      }
    }
  }
  
  console.log('✅ Airdrop phase complete!');
}

airdropToWallets().catch(console.error);
