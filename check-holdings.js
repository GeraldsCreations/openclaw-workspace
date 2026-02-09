#!/usr/bin/env node
// Check bot's token holdings

const { Connection, PublicKey } = require('@solana/web3.js');

const RPC_URL = "https://api.mainnet-beta.solana.com";
const BOT_WALLET = "At6hSj5N2LwpHCNUDN8t4WiS2iCBr7KCasZUPnwxHJtq";
const CHAD_TOKEN = "APcvFtUV2ckRdLHFZwUs9x4bB2FSpdnBPbaqm5QUbFFy";

async function getTokenBalance(connection, walletAddress, tokenMint) {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(tokenMint);
  
  // Get all token accounts for this wallet
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    mint: mint
  });
  
  if (tokenAccounts.value.length === 0) {
    return 0;
  }
  
  // Sum up all balances (usually just one account)
  let totalBalance = 0;
  for (const account of tokenAccounts.value) {
    const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
    totalBalance += balance;
  }
  
  return totalBalance;
}

async function getSolBalance(connection, walletAddress) {
  const wallet = new PublicKey(walletAddress);
  const balance = await connection.getBalance(wallet);
  return balance / 1e9; // Convert lamports to SOL
}

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  
  console.log('🔍 Checking bot holdings...');
  console.log('📍 Wallet:', BOT_WALLET);
  console.log('');
  
  // Get SOL balance
  const solBalance = await getSolBalance(connection, BOT_WALLET);
  console.log('💰 SOL Balance:', solBalance.toFixed(6), 'SOL');
  
  // Get CHAD token balance
  const chadBalance = await getTokenBalance(connection, BOT_WALLET, CHAD_TOKEN);
  console.log('🎩 CHAD Balance:', chadBalance.toFixed(6), 'CHAD');
  
  console.log('');
  console.log('✅ Holdings retrieved from blockchain');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
