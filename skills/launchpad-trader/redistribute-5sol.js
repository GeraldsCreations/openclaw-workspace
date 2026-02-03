#!/usr/bin/env node

/**
 * Redistribute 5 SOL from main wallet to test wallets
 * Target: 1 SOL per wallet (enough for token creation + trading)
 */

const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { config } = require('./config');
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = '/tmp/launchpad-test/wallets/wallets.json';
const MAIN_WALLET_PATH = path.join(require('os').homedir(), '.openclaw', 'wallets', 'launchpad-trader.json');

async function redistribute() {
  const connection = new Connection(config.rpcUrl, 'confirmed');
  
  console.log('💰 Redistributing 5 SOL to Test Wallets\n');
  
  // Load main wallet
  const mainKeypairData = JSON.parse(fs.readFileSync(MAIN_WALLET_PATH, 'utf8'));
  const mainKeypair = Keypair.fromSecretKey(new Uint8Array(mainKeypairData));
  const mainBalance = await connection.getBalance(mainKeypair.publicKey);
  
  console.log(`📍 Main Wallet: ${mainKeypair.publicKey.toBase58()}`);
  console.log(`💵 Balance: ${(mainBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);
  
  // Load test wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  
  // Transfer 1 SOL to each test wallet (5 SOL total, reserve 0.05 for fees)
  const transferAmount = 0.99; // Leave small buffer for fees
  
  console.log(`💸 Transferring ${transferAmount} SOL to each wallet...\n`);
  
  for (const wallet of wallets) {
    try {
      const recipientPubkey = new PublicKey(wallet.address);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: mainKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(transferAmount * LAMPORTS_PER_SOL),
        })
      );
      
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [mainKeypair],
        { commitment: 'confirmed' }
      );
      
      const balance = await connection.getBalance(recipientPubkey);
      
      console.log(`✅ Wallet ${wallet.id}: ${wallet.address}`);
      console.log(`   Transferred: ${transferAmount} SOL`);
      console.log(`   New Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      console.log(`   Signature: ${signature.substring(0, 16)}...\n`);
      
    } catch (error) {
      console.error(`❌ Failed to fund wallet ${wallet.id}:`, error.message, '\n');
    }
  }
  
  // Check main wallet final balance
  const finalBalance = await connection.getBalance(mainKeypair.publicKey);
  console.log(`💵 Main wallet remaining: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  console.log('✅ Redistribution complete!');
}

redistribute().catch(console.error);
