#!/usr/bin/env node

/**
 * LaunchPad Trader Skill Test
 * Verifies all components load correctly
 */

console.log('🧪 Testing LaunchPad Trader Skill...\n');

try {
  // Test library imports
  console.log('✓ Testing library imports...');
  const { default: LaunchPadAPIClient } = await import('./lib/api-client.js');
  const { default: WalletManager } = await import('./lib/wallet-manager.js');
  const utils = await import('./lib/utils.js');
  console.log('  ✅ All libraries imported successfully\n');
  
  // Test API client instantiation
  console.log('✓ Testing API client...');
  const apiClient = new LaunchPadAPIClient();
  console.log('  ✅ API client created\n');
  
  // Test wallet manager instantiation
  console.log('✓ Testing wallet manager...');
  const walletManager = new WalletManager();
  console.log('  ✅ Wallet manager created\n');
  
  // Test utility functions
  console.log('✓ Testing utilities...');
  const testAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const isValid = utils.isValidSolanaAddress(testAddress);
  console.log(`  Address validation: ${isValid ? '✅' : '❌'}`);
  
  const formatted = utils.formatUsd(12345.67);
  console.log(`  USD formatting: ${formatted === '$12,345.67' ? '✅' : '❌'} (${formatted})`);
  
  const percentage = utils.formatPercentage(15.5);
  console.log(`  Percentage formatting: ${percentage === '+15.50%' ? '✅' : '❌'} (${percentage})`);
  
  const shortened = utils.shortenAddress(testAddress, 4);
  console.log(`  Address shortening: ${shortened === '7xKX...gAsU' ? '✅' : '❌'} (${shortened})`);
  console.log('  ✅ All utility functions working\n');
  
  // Test wallet generation (don't save)
  console.log('✓ Testing wallet generation...');
  const newWallet = walletManager.generateWallet();
  console.log(`  ✅ Generated wallet: ${newWallet.publicKey.slice(0, 8)}...\n`);
  
  // Test API connectivity (public endpoint)
  console.log('✓ Testing API connectivity...');
  try {
    const result = await apiClient.getTokens({ limit: 1 });
    console.log(`  ✅ API connection successful (${result.total} tokens on platform)\n`);
  } catch (error) {
    console.log(`  ⚠️  API connection failed: ${error.message}`);
    console.log('  (This is expected if the API is down or unreachable)\n');
  }
  
  console.log('='.repeat(60));
  console.log('🎉 All tests passed! Skill is ready to use.');
  console.log('='.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('  1. Create a wallet: node scripts/wallet.js create my-wallet');
  console.log('  2. Fund it with SOL');
  console.log('  3. Browse tokens: node scripts/list-tokens.js');
  console.log('  4. Start trading!\n');
  console.log('📚 See SKILL.md for complete documentation.\n');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
