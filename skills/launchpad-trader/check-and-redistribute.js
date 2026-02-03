#!/usr/bin/env node

/**
 * Check wallet balances and redistribute SOL evenly
 */

const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { config } = require('./config');
const fs = require('fs');

const WALLETS_FILE = '/tmp/launchpad-test/wallets/wallets.json';
const TARGET_BALANCE = 4; // SOL per wallet

async function checkAndRedistribute() {
  const connection = new Connection(config.rpcUrl, 'confirmed');
  
  console.log('💰 Checking wallet balances...\n');
  
  // Load wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  
  // Check all balances
  let totalSol = 0;
  const balances = [];
  
  for (const wallet of wallets) {
    const publicKey = new PublicKey(wallet.address);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    console.log(`Wallet ${wallet.id}: ${wallet.address}`);
    console.log(`   Balance: ${solBalance.toFixed(4)} SOL`);
    
    totalSol += solBalance;
    balances.push({
      ...wallet,
      publicKey,
      balance: solBalance,
      lamports: balance,
    });
  }
  
  console.log(`\n📊 Total SOL available: ${totalSol.toFixed(4)} SOL`);
  
  if (totalSol < 0.1) {
    console.log('❌ Insufficient total SOL to redistribute. Need at least 0.1 SOL.');
    return;
  }
  
  // Calculate target per wallet (reserve 0.05 SOL for fees)
  const targetPerWallet = (totalSol - 0.05) / wallets.length;
  console.log(`🎯 Target per wallet: ${targetPerWallet.toFixed(4)} SOL\n`);
  
  // Find wallets with excess funds
  const funders = balances.filter(w => w.balance > targetPerWallet + 0.01);
  const recipients = balances.filter(w => w.balance < targetPerWallet - 0.01);
  
  if (funders.length === 0) {
    console.log('✅ Balances are already distributed evenly!');
    return;
  }
  
  console.log(`💸 Redistributing from ${funders.length} wallets to ${recipients.length} wallets...\n`);
  
  // Transfer from wallets with excess to wallets with deficit
  for (const funder of funders) {
    const excess = funder.balance - targetPerWallet;
    if (excess < 0.01) continue;
    
    // Load funder keypair
    const keypairData = JSON.parse(fs.readFileSync(funder.path, 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log(`📤 From Wallet ${funder.id} (${excess.toFixed(4)} SOL excess):`);
    
    for (const recipient of recipients) {
      const deficit = targetPerWallet - recipient.balance;
      if (deficit < 0.01) continue;
      
      const transferAmount = Math.min(excess, deficit);
      if (transferAmount < 0.01) break;
      
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: recipient.publicKey,
            lamports: Math.floor(transferAmount * LAMPORTS_PER_SOL),
          })
        );
        
        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [keypair],
          { commitment: 'confirmed' }
        );
        
        // Update local balance tracking
        funder.balance -= transferAmount;
        recipient.balance += transferAmount;
        
        console.log(`   ✅ → Wallet ${recipient.id}: ${transferAmount.toFixed(4)} SOL`);
        console.log(`      Signature: ${signature.substring(0, 16)}...`);
        
      } catch (error) {
        console.error(`   ❌ Transfer failed:`, error.message);
      }
    }
    console.log('');
  }
  
  // Final balance check
  console.log('📊 Final Balances:\n');
  let finalTotal = 0;
  
  for (const wallet of wallets) {
    const publicKey = new PublicKey(wallet.address);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    finalTotal += solBalance;
    
    console.log(`Wallet ${wallet.id}: ${solBalance.toFixed(4)} SOL`);
  }
  
  console.log(`\n💰 Total: ${finalTotal.toFixed(4)} SOL`);
  console.log('✅ Redistribution complete!');
}

checkAndRedistribute().catch(console.error);
