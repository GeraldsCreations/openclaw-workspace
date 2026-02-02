#!/usr/bin/env node

/**
 * Configuration Management
 * Centralized config for LaunchPad Trader skill
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (err) {
    // dotenv not installed, will use environment variables only
  }
}

/**
 * Configuration object
 */
const config = {
  // Solana RPC endpoint
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  
  // Network (devnet, testnet, mainnet-beta)
  network: process.env.SOLANA_NETWORK || 'devnet',
  
  // LaunchPad backend API
  apiUrl: process.env.LAUNCHPAD_API_URL || 'http://localhost:3000/v1',
  
  // Bot/Agent ID for rewards
  agentId: process.env.OPENCLAW_AGENT_ID || 'agent-main',
  
  // Wallet path
  walletPath: process.env.WALLET_PATH || path.join(
    require('os').homedir(),
    '.openclaw',
    'wallets',
    'launchpad-trader.json'
  ),
};

/**
 * Get configuration
 */
function getConfig() {
  return { ...config };
}

/**
 * Update configuration
 */
function setConfig(updates) {
  Object.assign(config, updates);
}

/**
 * Display current configuration
 */
function showConfig() {
  console.log('📋 LaunchPad Trader Configuration:\n');
  console.log('🌐 Network:', config.network);
  console.log('🔗 RPC URL:', config.rpcUrl);
  console.log('🚀 API URL:', config.apiUrl);
  console.log('🤖 Agent ID:', config.agentId);
  console.log('💼 Wallet Path:', config.walletPath);
  console.log('');
  console.log('💡 To change config, edit .env file or set environment variables:');
  console.log('   export SOLANA_RPC_URL="https://your-rpc-url.com"');
  console.log('   export SOLANA_NETWORK="mainnet-beta"');
  console.log('   export LAUNCHPAD_API_URL="https://your-api.com/v1"');
  console.log('   export OPENCLAW_AGENT_ID="your-agent-id"');
}

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];
  
  // Check RPC URL
  if (!config.rpcUrl.startsWith('http')) {
    errors.push('Invalid RPC_URL: must start with http:// or https://');
  }
  
  // Check network
  const validNetworks = ['devnet', 'testnet', 'mainnet-beta'];
  if (!validNetworks.includes(config.network)) {
    errors.push(`Invalid NETWORK: must be one of ${validNetworks.join(', ')}`);
  }
  
  // Warn about default devnet RPC
  if (config.rpcUrl === 'https://api.devnet.solana.com') {
    console.warn('⚠️  Using public devnet RPC (rate limited). Consider using a private RPC for better performance.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// CLI
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'show':
    case 'config':
    default:
      showConfig();
      
      const validation = validateConfig();
      if (!validation.valid) {
        console.log('\n❌ Configuration Errors:');
        validation.errors.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log('✅ Configuration is valid');
      }
      break;
  }
}

module.exports = {
  config,
  getConfig,
  setConfig,
  showConfig,
  validateConfig,
};
