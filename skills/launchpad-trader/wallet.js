#!/usr/bin/env node

/**
 * Solana Wallet Management
 * Create wallet, check balances, send SOL/tokens
 */

const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferInstruction, getAccount, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { config } = require('./config');

// Configuration
const RPC_URL = config.rpcUrl;
const WALLET_DIR = path.dirname(config.walletPath);
const WALLET_PATH = config.walletPath;

const connection = new Connection(RPC_URL, 'confirmed');

console.log(`🔗 Connected to Solana ${config.network} (${RPC_URL.substring(0, 40)}...)`);

/**
 * Create wallet directory if it doesn't exist
 */
function ensureWalletDir() {
  if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { recursive: true });
  }
}

/**
 * Create new wallet
 */
async function createWallet() {
  ensureWalletDir();
  
  if (fs.existsSync(WALLET_PATH)) {
    console.log('⚠️ Wallet already exists at:', WALLET_PATH);
    const keypair = loadWallet();
    console.log('📍 Address:', keypair.publicKey.toBase58());
    return keypair;
  }

  const keypair = Keypair.generate();
  const secretKey = Array.from(keypair.secretKey);
  
  fs.writeFileSync(WALLET_PATH, JSON.stringify(secretKey), { mode: 0o600 });
  
  console.log('✅ New wallet created!');
  console.log('📍 Address:', keypair.publicKey.toBase58());
  console.log('💾 Saved to:', WALLET_PATH);
  console.log('');
  console.log('⚠️ IMPORTANT: Back up this keypair file securely!');
  console.log('⚠️ Never share it with anyone!');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('💰 SOL Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  
  if (balance === 0) {
    console.log('');
    console.log('💸 Fund your wallet with devnet SOL:');
    console.log(`   solana airdrop 1 ${keypair.publicKey.toBase58()} --url devnet`);
  }
  
  return keypair;
}

/**
 * Load existing wallet
 */
function loadWallet() {
  if (!fs.existsSync(WALLET_PATH)) {
    throw new Error(`Wallet not found at ${WALLET_PATH}. Create one first with --create`);
  }
  
  const secretKey = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

/**
 * Get SOL balance
 */
async function getBalance(address) {
  const publicKey = address ? new PublicKey(address) : loadWallet().publicKey;
  const balance = await connection.getBalance(publicKey);
  
  console.log('💰 SOL Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  console.log('📍 Address:', publicKey.toBase58());
  
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Get token balance
 */
async function getTokenBalance(mintAddress, ownerAddress) {
  const mint = new PublicKey(mintAddress);
  const owner = ownerAddress ? new PublicKey(ownerAddress) : loadWallet().publicKey;
  
  try {
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);
    const accountInfo = await getAccount(connection, tokenAccount);
    
    const balance = Number(accountInfo.amount) / Math.pow(10, 9); // Assuming 9 decimals
    
    console.log('🪙 Token Balance:', balance);
    console.log('🏷️ Mint:', mintAddress);
    console.log('📍 Owner:', owner.toBase58());
    console.log('📦 Token Account:', tokenAccount.toBase58());
    
    return balance;
  } catch (error) {
    if (error.message.includes('could not find account')) {
      console.log('🪙 Token Balance: 0 (no token account)');
      return 0;
    }
    throw error;
  }
}

/**
 * Send SOL
 */
async function sendSol(toAddress, amount) {
  const keypair = loadWallet();
  const to = new PublicKey(toAddress);
  const lamports = amount * LAMPORTS_PER_SOL;
  
  console.log('📤 Sending', amount, 'SOL to', toAddress);
  console.log('From:', keypair.publicKey.toBase58());
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: to,
      lamports,
    })
  );
  
  const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
  
  console.log('✅ Transaction confirmed!');
  console.log('🔗 Signature:', signature);
  console.log(`🔍 Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  
  return signature;
}

/**
 * Send tokens
 */
async function sendTokens(mintAddress, toAddress, amount) {
  const keypair = loadWallet();
  const mint = new PublicKey(mintAddress);
  const to = new PublicKey(toAddress);
  
  console.log('📤 Sending', amount, 'tokens to', toAddress);
  console.log('🏷️ Mint:', mintAddress);
  console.log('From:', keypair.publicKey.toBase58());
  
  // Get source and destination token accounts
  const sourceAccount = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const destinationAccount = await getAssociatedTokenAddress(mint, to);
  
  const transferAmount = amount * Math.pow(10, 9); // Assuming 9 decimals
  
  const transaction = new Transaction().add(
    createTransferInstruction(
      sourceAccount,
      destinationAccount,
      keypair.publicKey,
      transferAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  
  const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
  
  console.log('✅ Transaction confirmed!');
  console.log('🔗 Signature:', signature);
  console.log(`🔍 Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  
  return signature;
}

/**
 * Get all token balances
 */
async function getAllTokenBalances(ownerAddress) {
  const owner = ownerAddress ? new PublicKey(ownerAddress) : loadWallet().publicKey;
  
  console.log('🔍 Fetching all token accounts for:', owner.toBase58());
  
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
  
  if (accounts.value.length === 0) {
    console.log('📭 No token accounts found');
    return [];
  }
  
  console.log(`\n📦 Found ${accounts.value.length} token account(s):\n`);
  
  const balances = [];
  
  for (const { account, pubkey } of accounts.value) {
    const parsed = account.data.parsed.info;
    const balance = Number(parsed.tokenAmount.uiAmount);
    const mint = parsed.mint;
    
    if (balance > 0) {
      console.log('🪙 Token:', mint);
      console.log('   Balance:', balance);
      console.log('   Account:', pubkey.toBase58());
      console.log('');
      
      balances.push({
        mint,
        balance,
        account: pubkey.toBase58(),
      });
    }
  }
  
  return balances;
}

/**
 * CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case '--create':
      case 'create':
        await createWallet();
        break;
        
      case '--address':
      case 'address':
        const keypair = loadWallet();
        console.log(keypair.publicKey.toBase58());
        break;
        
      case '--balance':
      case 'balance':
        await getBalance(args[1]);
        break;
        
      case '--token-balance':
      case 'token-balance':
        if (!args[1]) {
          console.error('Usage: wallet.js token-balance <mint-address> [owner-address]');
          process.exit(1);
        }
        await getTokenBalance(args[1], args[2]);
        break;
        
      case '--all-tokens':
      case 'all-tokens':
        await getAllTokenBalances(args[1]);
        break;
        
      case '--send-sol':
      case 'send-sol':
        if (!args[1] || !args[2]) {
          console.error('Usage: wallet.js send-sol <to-address> <amount>');
          process.exit(1);
        }
        await sendSol(args[1], parseFloat(args[2]));
        break;
        
      case '--send-tokens':
      case 'send-tokens':
        if (!args[1] || !args[2] || !args[3]) {
          console.error('Usage: wallet.js send-tokens <mint-address> <to-address> <amount>');
          process.exit(1);
        }
        await sendTokens(args[1], args[2], parseFloat(args[3]));
        break;
        
      default:
        console.log('Usage:');
        console.log('  wallet.js create              - Create new wallet');
        console.log('  wallet.js address             - Show wallet address');
        console.log('  wallet.js balance [address]   - Get SOL balance');
        console.log('  wallet.js token-balance <mint> [owner] - Get token balance');
        console.log('  wallet.js all-tokens [owner]  - Get all token balances');
        console.log('  wallet.js send-sol <to> <amount> - Send SOL');
        console.log('  wallet.js send-tokens <mint> <to> <amount> - Send tokens');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  createWallet,
  loadWallet,
  getBalance,
  getTokenBalance,
  getAllTokenBalances,
  sendSol,
  sendTokens,
};

// Run if called directly
if (require.main === module) {
  main();
}
