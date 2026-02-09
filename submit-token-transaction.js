#!/usr/bin/env node
// Sign and submit token creation transaction

const fs = require('fs');
const { Connection, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');

const WALLET_PATH = process.env.HOME + "/.config/solana/launchpad-bot.json";
const RPC_URL = "https://api.mainnet-beta.solana.com";

const transactionBase64 = process.argv[2];

if (!transactionBase64) {
  console.error('Usage: node submit-token-transaction.js <transaction_base64>');
  process.exit(1);
}

(async () => {
  try {
    // Load wallet
    const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    
    console.log('👛 Wallet:', keypair.publicKey.toBase58());
    
    // Connect to Solana
    const connection = new Connection(RPC_URL, 'confirmed');
    console.log('🌐 Connected to Solana mainnet');
    
    // Deserialize transaction
    const transactionBuffer = Buffer.from(transactionBase64, 'base64');
    const transaction = Transaction.from(transactionBuffer);
    
    console.log('📝 Transaction deserialized');
    console.log('   Instructions:', transaction.instructions.length);
    
    // Sign and send transaction
    console.log('\n🚀 Signing and submitting transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    );
    
    console.log('\n✅ Transaction confirmed!');
    console.log('📝 Signature:', signature);
    console.log('🔍 Explorer: https://solscan.io/tx/' + signature);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
