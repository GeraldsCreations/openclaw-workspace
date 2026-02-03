#!/usr/bin/env node

/**
 * LaunchPad Trader Setup Wizard
 * Interactive configuration and wallet setup
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const config = require('../lib/config');
const LocalWalletManager = require('../lib/local-wallet');
const PrivyWalletManager = require('../lib/privy-wallet');
const WalletManager = require('../lib/wallet-manager');

async function main() {
  console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('🚀  LaunchPad Trader Setup Wizard'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));
  
  console.log('This wizard will help you set up your wallet and configuration.');
  console.log('');
  
  try {
    // Step 1: Choose wallet provider
    await setupWalletProvider();
    
    // Step 2: Configure network & RPC
    await setupNetwork();
    
    // Step 3: Configure LaunchPad API
    await setupAPI();
    
    // Step 4: Configure agent ID
    await setupAgentID();
    
    // Step 5: Save configuration
    config.save();
    
    // Step 6: Test configuration
    await testSetup();
    
    console.log(chalk.bold.green('\n' + '='.repeat(60)));
    console.log(chalk.bold.green('✅  Setup Complete!'));
    console.log(chalk.bold.green('='.repeat(60) + '\n'));
    
    console.log('You can now use the LaunchPad trader:');
    console.log('');
    console.log('  Check balance:', chalk.cyan('node scripts/wallet.js balance'));
    console.log('  View tokens:  ', chalk.cyan('node scripts/wallet.js tokens'));
    console.log('  Trade:        ', chalk.cyan('node scripts/launchpad.js'));
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:', error.message));
    process.exit(1);
  }
}

/**
 * Step 1: Choose and setup wallet provider
 */
async function setupWalletProvider() {
  console.log(chalk.bold('\n📋 Step 1: Wallet Setup\n'));
  
  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Choose your wallet provider:',
    choices: [
      {
        name: chalk.green('🔐 Privy') + ' - Secure embedded wallet with MPC (Recommended)',
        value: 'privy',
        short: 'Privy',
      },
      {
        name: chalk.blue('➕ Create Local Wallet') + ' - Generate new encrypted keypair',
        value: 'create-local',
        short: 'Create Local',
      },
      {
        name: chalk.blue('📥 Import Local Wallet') + ' - Import from seed/key',
        value: 'import-local',
        short: 'Import Local',
      },
    ],
  }]);
  
  switch (provider) {
    case 'privy':
      await setupPrivy();
      break;
      
    case 'create-local':
      await createLocalWallet();
      break;
      
    case 'import-local':
      await importLocalWallet();
      break;
  }
}

/**
 * Setup Privy wallet
 */
async function setupPrivy() {
  console.log(chalk.bold('\n🔐 Privy Setup\n'));
  
  console.log('You need a Privy account to use this option.');
  console.log('Get your credentials at: ' + chalk.cyan('https://dashboard.privy.io'));
  console.log('');
  
  const { appId, appSecret } = await inquirer.prompt([
    {
      type: 'input',
      name: 'appId',
      message: 'Enter your Privy App ID:',
      validate: (input) => input.length > 0 || 'App ID is required',
    },
    {
      type: 'password',
      name: 'appSecret',
      message: 'Enter your Privy App Secret:',
      mask: '*',
      validate: (input) => input.length > 0 || 'App Secret is required',
    },
  ]);
  
  // Save to config
  config.set('walletProvider', 'privy');
  config.set('privyAppId', appId);
  config.set('privyAppSecret', appSecret);
  
  console.log(chalk.green('\n✅ Privy configured!'));
}

/**
 * Create new local wallet
 */
async function createLocalWallet() {
  console.log(chalk.bold('\n➕ Create New Wallet\n'));
  
  console.log(chalk.yellow('⚠️  You will receive a recovery phrase.'));
  console.log(chalk.yellow('⚠️  Write it down in a safe place!'));
  console.log('');
  
  const { wordCount } = await inquirer.prompt([{
    type: 'list',
    name: 'wordCount',
    message: 'Recovery phrase length:',
    choices: [
      { name: '24 words (More secure)', value: 24 },
      { name: '12 words (Standard)', value: 12 },
    ],
    default: 24,
  }]);
  
  const { password } = await inquirer.prompt([{
    type: 'password',
    name: 'password',
    message: 'Create a wallet password:',
    mask: '*',
    validate: (input) => {
      if (input.length < 8) {
        return 'Password must be at least 8 characters';
      }
      return true;
    },
  }]);
  
  const { confirmPassword } = await inquirer.prompt([{
    type: 'password',
    name: 'confirmPassword',
    message: 'Confirm password:',
    mask: '*',
    validate: (input) => input === password || 'Passwords do not match',
  }]);
  
  console.log('');
  console.log(chalk.yellow('━'.repeat(60)));
  
  // Create wallet
  const localWallet = new LocalWalletManager(config.getAll());
  const { mnemonic, address } = await localWallet.create(password, wordCount);
  
  console.log(chalk.yellow('━'.repeat(60)));
  console.log('');
  
  // Verify user wrote it down
  const { verified } = await inquirer.prompt([{
    type: 'confirm',
    name: 'verified',
    message: chalk.bold('Did you write down your recovery phrase?'),
    default: false,
  }]);
  
  if (!verified) {
    console.log(chalk.red('\n❌ Please write down your recovery phrase before continuing.'));
    console.log(chalk.yellow('Here it is again:\n'));
    console.log(chalk.yellow(mnemonic));
    console.log('');
    
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'I have written down my recovery phrase',
      default: false,
    }]);
    
    if (!confirmed) {
      throw new Error('Recovery phrase not confirmed');
    }
  }
  
  // Save to config
  config.set('walletProvider', 'local');
  config.set('walletPassword', password);
  
  console.log(chalk.green('\n✅ Wallet created successfully!'));
  console.log('📍 Address:', chalk.cyan(address));
}

/**
 * Import local wallet
 */
async function importLocalWallet() {
  console.log(chalk.bold('\n📥 Import Wallet\n'));
  
  const { importType } = await inquirer.prompt([{
    type: 'list',
    name: 'importType',
    message: 'What are you importing?',
    choices: [
      { name: '🔑 Recovery Phrase (12 or 24 words)', value: 'mnemonic' },
      { name: '🔐 Private Key (base58)', value: 'privateKey' },
      { name: '📄 Keypair File (.json)', value: 'keypairFile' },
    ],
  }]);
  
  let input;
  
  switch (importType) {
    case 'mnemonic':
      const { mnemonic } = await inquirer.prompt([{
        type: 'input',
        name: 'mnemonic',
        message: 'Enter your recovery phrase:',
        validate: (input) => {
          const words = input.trim().split(/\s+/);
          if (words.length !== 12 && words.length !== 24) {
            return 'Recovery phrase must be 12 or 24 words';
          }
          return true;
        },
      }]);
      input = mnemonic;
      break;
      
    case 'privateKey':
      const { privateKey } = await inquirer.prompt([{
        type: 'password',
        name: 'privateKey',
        message: 'Enter your private key (base58):',
        mask: '*',
        validate: (input) => input.length > 0 || 'Private key is required',
      }]);
      input = privateKey;
      break;
      
    case 'keypairFile':
      const { filePath } = await inquirer.prompt([{
        type: 'input',
        name: 'filePath',
        message: 'Enter path to keypair file:',
        validate: (input) => {
          const fs = require('fs');
          if (!fs.existsSync(input)) {
            return 'File not found';
          }
          return true;
        },
      }]);
      input = filePath;
      break;
  }
  
  // Get password for encryption
  const { password } = await inquirer.prompt([{
    type: 'password',
    name: 'password',
    message: 'Create a wallet password:',
    mask: '*',
    validate: (input) => input.length >= 8 || 'Password must be at least 8 characters',
  }]);
  
  // Import wallet
  console.log('');
  const localWallet = new LocalWalletManager(config.getAll());
  const { address } = await localWallet.importWallet(input, importType, password);
  
  // Save to config
  config.set('walletProvider', 'local');
  config.set('walletPassword', password);
  
  console.log(chalk.green('\n✅ Wallet imported successfully!'));
  console.log('📍 Address:', chalk.cyan(address));
}

/**
 * Step 2: Configure network & RPC
 */
async function setupNetwork() {
  console.log(chalk.bold('\n📋 Step 2: Network Configuration\n'));
  
  const { network } = await inquirer.prompt([{
    type: 'list',
    name: 'network',
    message: 'Choose Solana network:',
    choices: [
      { name: 'Devnet (Testing)', value: 'devnet' },
      { name: 'Mainnet Beta (Production)', value: 'mainnet-beta' },
      { name: 'Testnet', value: 'testnet' },
    ],
    default: 'devnet',
  }]);
  
  const { rpcChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'rpcChoice',
    message: 'Choose RPC provider:',
    choices: [
      { name: 'Public RPC (Free, rate limited)', value: 'public' },
      { name: 'Helius (Recommended)', value: 'helius' },
      { name: 'QuickNode', value: 'quicknode' },
      { name: 'Alchemy', value: 'alchemy' },
      { name: 'Custom URL', value: 'custom' },
    ],
  }]);
  
  let rpcUrl;
  
  if (rpcChoice === 'public') {
    rpcUrl = network === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : network === 'testnet'
      ? 'https://api.testnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    
    console.log(chalk.yellow('\n⚠️  Public RPC is rate limited. Consider using a private RPC for production.'));
  } else if (rpcChoice === 'custom') {
    const { customUrl } = await inquirer.prompt([{
      type: 'input',
      name: 'customUrl',
      message: 'Enter your RPC URL:',
      validate: (input) => input.startsWith('http') || 'Must be a valid HTTP(S) URL',
    }]);
    rpcUrl = customUrl;
  } else {
    const { apiKey } = await inquirer.prompt([{
      type: 'input',
      name: 'apiKey',
      message: `Enter your ${rpcChoice} API key:`,
      validate: (input) => input.length > 0 || 'API key is required',
    }]);
    
    const networkName = network === 'mainnet-beta' ? 'mainnet' : network;
    
    switch (rpcChoice) {
      case 'helius':
        rpcUrl = `https://${networkName}.helius-rpc.com/?api-key=${apiKey}`;
        break;
      case 'quicknode':
        rpcUrl = apiKey; // QuickNode provides full URL
        break;
      case 'alchemy':
        rpcUrl = `https://solana-${networkName}.g.alchemy.com/v2/${apiKey}`;
        break;
    }
  }
  
  config.set('network', network);
  config.set('rpcUrl', rpcUrl);
  
  console.log(chalk.green('\n✅ Network configured!'));
}

/**
 * Step 3: Configure LaunchPad API
 */
async function setupAPI() {
  console.log(chalk.bold('\n📋 Step 3: LaunchPad API\n'));
  
  const { apiUrl } = await inquirer.prompt([{
    type: 'input',
    name: 'apiUrl',
    message: 'LaunchPad API URL:',
    default: 'http://localhost:3000/v1',
    validate: (input) => input.startsWith('http') || 'Must be a valid HTTP(S) URL',
  }]);
  
  config.set('apiUrl', apiUrl);
  
  console.log(chalk.green('\n✅ API configured!'));
}

/**
 * Step 4: Configure agent ID
 */
async function setupAgentID() {
  console.log(chalk.bold('\n📋 Step 4: Agent Identification\n'));
  
  const { agentId } = await inquirer.prompt([{
    type: 'input',
    name: 'agentId',
    message: 'Enter your agent/bot ID:',
    default: 'launchpad-trader',
    validate: (input) => input.length > 0 || 'Agent ID is required',
  }]);
  
  config.set('agentId', agentId);
  
  console.log(chalk.green('\n✅ Agent ID configured!'));
}

/**
 * Test setup
 */
async function testSetup() {
  console.log(chalk.bold('\n🧪 Testing Configuration...\n'));
  
  try {
    // Validate config
    const validation = config.validate();
    
    if (!validation.valid) {
      console.log(chalk.red('❌ Configuration validation failed:'));
      validation.errors.forEach(err => console.log('   -', err));
      throw new Error('Invalid configuration');
    }
    
    console.log(chalk.green('✅ Configuration valid'));
    
    // Test wallet connection
    console.log('');
    console.log('Testing wallet...');
    
    const walletManager = new WalletManager(config.getAll());
    await walletManager.initialize();
    
    const address = await walletManager.getAddress();
    console.log(chalk.green('✅ Wallet connected:', address));
    
    // Test RPC connection
    console.log('');
    console.log('Testing RPC connection...');
    
    const balance = await walletManager.getBalance();
    console.log(chalk.green('✅ RPC connected'));
    console.log('   Balance:', balance, 'SOL');
    
    if (balance === 0 && config.get('network') === 'devnet') {
      console.log('');
      console.log(chalk.yellow('💡 Tip: Fund your devnet wallet with:'));
      console.log(chalk.cyan(`   solana airdrop 1 ${address} --url devnet`));
    }
    
    // Test LaunchPad API (optional)
    console.log('');
    console.log('Testing LaunchPad API...');
    
    try {
      const axios = require('axios');
      const response = await axios.get(config.get('apiUrl').replace('/v1', '/health'));
      console.log(chalk.green('✅ LaunchPad API connected'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  LaunchPad API unreachable (this is okay if backend isn\'t running)'));
    }
    
    console.log('');
    console.log(chalk.green('✅ All tests passed!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup test failed:', error.message));
    throw error;
  }
}

// Run wizard if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('\n❌ Fatal error:', error.message));
    process.exit(1);
  });
}

module.exports = { main };
