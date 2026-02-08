#!/usr/bin/env node

/**
 * Wallet Management Script
 * Manage Solana wallets: create, import, list, balance checks
 */

import WalletManager from '../lib/wallet-manager.js';
import { formatSol, formatTokenAmount, printError } from '../lib/utils.js';

const walletManager = new WalletManager();

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'create':
        await createWallet();
        break;
      
      case 'import':
        await importWallet();
        break;
      
      case 'list':
        await listWallets();
        break;
      
      case 'balance':
        await getBalance();
        break;
      
      case 'tokens':
        await getTokenBalances();
        break;
      
      case 'history':
        await getHistory();
        break;
      
      case 'sign':
        await signMessage();
        break;
      
      default:
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

async function createWallet() {
  const name = args[0] || `wallet_${Date.now()}`;
  
  console.log('🔑 Generating new wallet...\n');
  
  const wallet = walletManager.generateWallet();
  await walletManager.saveWallet(name, wallet.secretKey);
  
  console.log('✅ Wallet created successfully!\n');
  console.log('Public Key:', wallet.publicKey);
  console.log('Name:', name);
  console.log('\n⚠️  IMPORTANT: Save your secret key securely!');
  console.log('Secret Key:', wallet.secretKey);
  console.log('\n💡 Tip: Fund this wallet with SOL before trading.');
}

async function importWallet() {
  if (args.length < 1) {
    console.error('❌ Error: Secret key required');
    console.log('Usage: node wallet.js import <secret-key> [name]');
    process.exit(1);
  }
  
  const secretKey = args[0];
  const name = args[1] || `imported_${Date.now()}`;
  
  console.log('🔐 Importing wallet...\n');
  
  const wallet = walletManager.importWallet(secretKey);
  await walletManager.saveWallet(name, secretKey);
  
  console.log('✅ Wallet imported successfully!\n');
  console.log('Public Key:', wallet.publicKey);
  console.log('Name:', name);
}

async function listWallets() {
  console.log('📋 Saved Wallets:\n');
  
  const wallets = await walletManager.listWallets();
  
  if (wallets.length === 0) {
    console.log('No wallets found. Create one with: node wallet.js create');
    return;
  }
  
  for (const wallet of wallets) {
    console.log(`• ${wallet.name}`);
    console.log(`  Address: ${wallet.publicKey}`);
    console.log(`  Created: ${new Date(wallet.createdAt).toLocaleString()}`);
    console.log('');
  }
}

async function getBalance() {
  const nameOrAddress = args[0];
  
  if (!nameOrAddress) {
    console.error('❌ Error: Wallet name or address required');
    console.log('Usage: node wallet.js balance <name-or-address>');
    process.exit(1);
  }
  
  let address = nameOrAddress;
  
  // If it looks like a name, try to load wallet
  if (!nameOrAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    const wallet = await walletManager.loadWallet(nameOrAddress);
    address = wallet.publicKey;
  }
  
  console.log(`💰 Checking balance for ${address}...\n`);
  
  const balance = await walletManager.getSolBalance(address);
  
  console.log('SOL Balance:', balance.toFixed(4), 'SOL');
  
  if (balance === 0) {
    console.log('\n💡 Tip: Fund this wallet with SOL to start trading.');
    console.log('   Minimum recommended: 0.1 SOL');
  }
}

async function getTokenBalances() {
  const nameOrAddress = args[0];
  
  if (!nameOrAddress) {
    console.error('❌ Error: Wallet name or address required');
    console.log('Usage: node wallet.js tokens <name-or-address>');
    process.exit(1);
  }
  
  let address = nameOrAddress;
  
  // If it looks like a name, try to load wallet
  if (!nameOrAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    const wallet = await walletManager.loadWallet(nameOrAddress);
    address = wallet.publicKey;
  }
  
  console.log(`🪙  Fetching token balances for ${address}...\n`);
  
  const tokens = await walletManager.getAllTokenBalances(address);
  
  if (tokens.length === 0) {
    console.log('No tokens found.');
    return;
  }
  
  console.log(`Found ${tokens.length} token(s):\n`);
  
  for (const token of tokens) {
    console.log(`• Mint: ${token.mint}`);
    console.log(`  Balance: ${formatTokenAmount(token.balance, token.decimals)}`);
    console.log('');
  }
}

async function getHistory() {
  const nameOrAddress = args[0];
  const limit = parseInt(args[1]) || 10;
  
  if (!nameOrAddress) {
    console.error('❌ Error: Wallet name or address required');
    console.log('Usage: node wallet.js history <name-or-address> [limit]');
    process.exit(1);
  }
  
  let address = nameOrAddress;
  
  // If it looks like a name, try to load wallet
  if (!nameOrAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    const wallet = await walletManager.loadWallet(nameOrAddress);
    address = wallet.publicKey;
  }
  
  console.log(`📜 Fetching recent transactions for ${address}...\n`);
  
  const txs = await walletManager.getRecentTransactions(address, limit);
  
  if (txs.length === 0) {
    console.log('No transactions found.');
    return;
  }
  
  console.log(`Recent ${txs.length} transaction(s):\n`);
  
  for (const tx of txs) {
    const statusIcon = tx.status === 'success' ? '✅' : '❌';
    console.log(`${statusIcon} ${tx.signature}`);
    console.log(`   Time: ${tx.timestamp || 'Unknown'}`);
    console.log(`   Slot: ${tx.slot}`);
    if (tx.error) {
      console.log(`   Error: ${JSON.stringify(tx.error)}`);
    }
    console.log('');
  }
}

async function signMessage() {
  const name = args[0];
  const message = args[1] || walletManager.generateAuthMessage();
  
  if (!name) {
    console.error('❌ Error: Wallet name required');
    console.log('Usage: node wallet.js sign <wallet-name> [message]');
    process.exit(1);
  }
  
  await walletManager.loadWallet(name);
  
  console.log('✍️  Signing message...\n');
  console.log('Message:', message);
  console.log('');
  
  const signed = walletManager.signMessage(message);
  
  console.log('✅ Signature created:\n');
  console.log('Public Key:', signed.publicKey);
  console.log('Signature:', signed.signature);
  console.log('\n💡 Use this signature for LaunchPad authentication.');
}

function printHelp() {
  console.log(`
LaunchPad Wallet Manager

USAGE:
  node wallet.js <command> [options]

COMMANDS:
  create [name]                    Create new wallet
  import <secret-key> [name]       Import wallet from secret key
  list                             List all saved wallets
  balance <name-or-address>        Check SOL balance
  tokens <name-or-address>         List token balances
  history <name-or-address> [num]  Show recent transactions
  sign <name> [message]            Sign message for authentication

EXAMPLES:
  node wallet.js create my-wallet
  node wallet.js balance my-wallet
  node wallet.js tokens my-wallet
  node wallet.js sign my-wallet

NOTES:
  - Wallets are saved in ~/.openclaw/wallets/
  - Keep your secret keys secure!
  - Fund wallets with SOL before trading
  `);
}

main();
