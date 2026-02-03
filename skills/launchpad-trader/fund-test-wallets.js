#!/usr/bin/env node

/**
 * Fund test wallets using main wallet + transfers
 * Avoids faucet rate limits
 */

const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { config } = require('./config');
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = '/tmp/launchpad-test/wallets/wallets.json';
const MAIN_WALLET_PATH = path.join(require('os').homedir(), '.openclaw', 'wallets', 'launchpad-trader.json');
const FUND_AMOUNT = 5; // SOL per test wallet

async function fundTestWallets() {
  const connection = new Connection(config.rpcUrl, 'confirmed');
  
  console.log('💰 Funding Test Wallets via Transfer\n');
  
  // Load main wallet (funder)
  if (!fs.existsSync(MAIN_WALLET_PATH)) {
    console.error('❌ Main wallet not found. Create it first with: node wallet.js create');
    process.exit(1);
  }
  
  const mainKeypairData = JSON.parse(fs.readFileSync(MAIN_WALLET_PATH, 'utf8'));
  const mainKeypair = Keypair.fromSecretKey(new Uint8Array(mainKeypairData));
  const mainBalance = await connection.getBalance(mainKeypair.publicKey);
  
  console.log(`📍 Main Wallet: ${mainKeypair.publicKey.toBase58()}`);
  console.log(`💵 Balance: ${(mainBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);
  
  // Check if we need to airdrop to main wallet first
  const totalNeeded = FUND_AMOUNT * 5 + 0.5; // 5 wallets + buffer for fees
  if (mainBalance / LAMPORTS_PER_SOL < totalNeeded) {
    console.log(`⚠️  Insufficient funds. Requesting airdrop to main wallet...`);
    try {
      const airdropAmount = Math.ceil(totalNeeded - (mainBalance / LAMPORTS_PER_SOL));
      console.log(`   Requesting ${airdropAmount} SOL airdrop...`);
      
      const signature = await connection.requestAirdrop(
        mainKeypair.publicKey,
        airdropAmount * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);
      
      const newBalance = await connection.getBalance(mainKeypair.publicKey);
      console.log(`✅ Airdrop successful! New balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);
    } catch (error) {
      console.error('❌ Airdrop failed:', error.message);
      console.log('💡 Try using: solana airdrop 5 ' + mainKeypair.publicKey.toBase58() + ' --url devnet');
      console.log('   Or visit: https://faucet.solana.com\n');
      process.exit(1);
    }
  }
  
  // Load test wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  
  console.log(`💸 Transferring ${FUND_AMOUNT} SOL to each test wallet...\n`);
  
  for (const wallet of wallets) {
    try {
      const recipientPubkey = new PublicKey(wallet.address);
      
      // Create transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: mainKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: FUND_AMOUNT * LAMPORTS_PER_SOL,
        })
      );
      
      // Send transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [mainKeypair]
      );
      
      // Check new balance
      const balance = await connection.getBalance(recipientPubkey);
      
      console.log(`✅ Wallet ${wallet.id}: ${wallet.address}`);
      console.log(`   Transferred: ${FUND_AMOUNT} SOL`);
      console.log(`   Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      console.log(`   Signature: ${signature}\n`);
      
    } catch (error) {
      console.error(`❌ Failed to fund wallet ${wallet.id}:`, error.message, '\n');
    }
  }
  
  // Check main wallet balance after
  const finalBalance = await connection.getBalance(mainKeypair.publicKey);
  console.log(`💵 Main wallet remaining balance: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  console.log('✅ Funding phase complete!');
}

fundTestWallets().catch(console.error);
