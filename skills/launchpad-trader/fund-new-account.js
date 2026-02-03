const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');

const WALLET_PATH = '/tmp/launchpad-test/wallets/wallet1.json';

async function fundAccount() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load test wallet
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  const fromWallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  // Load new wallet
  const newWalletData = JSON.parse(fs.readFileSync('/tmp/open-pump-wallet.json', 'utf8'));
  const toPublicKey = new PublicKey(newWalletData.publicKey);
  
  console.log('💸 Funding new account...');
  console.log('From:', fromWallet.publicKey.toString());
  console.log('To:', toPublicKey.toString());
  console.log('Amount: 0.5 SOL\n');
  
  // Check balance before
  const balanceBefore = await connection.getBalance(fromWallet.publicKey);
  console.log('Test wallet balance:', (balanceBefore / LAMPORTS_PER_SOL).toFixed(4), 'SOL\n');
  
  // Create transfer transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toPublicKey,
      lamports: 0.5 * LAMPORTS_PER_SOL,
    })
  );
  
  // Send transaction
  console.log('📤 Sending transaction...');
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
    { commitment: 'confirmed' }
  );
  
  console.log('✅ Transfer complete!');
  console.log('Signature:', signature);
  console.log(`Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet\n`);
  
  // Check new balance
  const newBalance = await connection.getBalance(toPublicKey);
  console.log('New account balance:', (newBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL\n');
  console.log('🎉 Account funded and ready to deploy token!');
}

fundAccount().catch(console.error);
