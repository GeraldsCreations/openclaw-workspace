const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

// Generate new wallet (simulating setup wizard)
const newWallet = Keypair.generate();

console.log('🎉 New LaunchPad Account Created!');
console.log('=====================================');
console.log('Wallet Address:', newWallet.publicKey.toString());
console.log('');

// Save wallet
const walletData = {
  publicKey: newWallet.publicKey.toString(),
  secretKey: Array.from(newWallet.secretKey)
};

fs.writeFileSync('/tmp/open-pump-wallet.json', JSON.stringify(walletData, null, 2));
console.log('✅ Wallet saved to: /tmp/open-pump-wallet.json');
console.log('');
console.log('📝 Next Steps:');
console.log('1. Fund this wallet with SOL from test wallet');
console.log('2. Create "Open Pump" token');
console.log('3. Verify in database');
console.log('4. Test trading');
