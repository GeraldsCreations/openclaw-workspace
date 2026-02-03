/**
 * Configuration Management
 * Centralized config with validation
 */

const fs = require('fs');
const path = require('path');

// Load .env if exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

class Config {
  constructor() {
    this.data = this._loadConfig();
  }
  
  /**
   * Load configuration from environment
   */
  _loadConfig() {
    return {
      // Wallet settings
      walletProvider: process.env.WALLET_PROVIDER || 'local',
      
      // Privy settings (if using Privy)
      privyAppId: process.env.PRIVY_APP_ID || null,
      privyAppSecret: process.env.PRIVY_APP_SECRET || null,
      
      // Solana settings
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      network: process.env.SOLANA_NETWORK || 'devnet',
      
      // LaunchPad API
      apiUrl: process.env.LAUNCHPAD_API_URL || 'http://localhost:3000/v1',
      
      // Agent/Bot ID
      agentId: process.env.OPENCLAW_AGENT_ID || 'launchpad-trader',
      
      // Wallet password (for local encrypted wallet)
      walletPassword: process.env.WALLET_PASSWORD || null,
    };
  }
  
  /**
   * Get config value
   */
  get(key) {
    return this.data[key];
  }
  
  /**
   * Set config value (runtime only, doesn't persist)
   */
  set(key, value) {
    this.data[key] = value;
  }
  
  /**
   * Get all config
   */
  getAll() {
    return { ...this.data };
  }
  
  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Validate wallet provider
    const validProviders = ['privy', 'local', 'local-encrypted'];
    if (!validProviders.includes(this.data.walletProvider)) {
      errors.push(`Invalid WALLET_PROVIDER: must be one of ${validProviders.join(', ')}`);
    }
    
    // Validate Privy config if using Privy
    if (this.data.walletProvider === 'privy') {
      if (!this.data.privyAppId) {
        errors.push('PRIVY_APP_ID is required when using Privy provider');
      }
      if (!this.data.privyAppSecret) {
        errors.push('PRIVY_APP_SECRET is required when using Privy provider');
      }
    }
    
    // Validate RPC URL
    if (!this.data.rpcUrl.startsWith('http')) {
      errors.push('SOLANA_RPC_URL must start with http:// or https://');
    }
    
    // Validate network
    const validNetworks = ['devnet', 'testnet', 'mainnet-beta'];
    if (!validNetworks.includes(this.data.network)) {
      errors.push(`Invalid SOLANA_NETWORK: must be one of ${validNetworks.join(', ')}`);
    }
    
    // Warnings
    if (this.data.rpcUrl.includes('api.devnet.solana.com') || 
        this.data.rpcUrl.includes('api.mainnet-beta.solana.com')) {
      warnings.push('⚠️  Using public RPC (rate limited). Consider using a private RPC for better performance.');
    }
    
    if (this.data.network === 'mainnet-beta' && !this.data.rpcUrl.includes('mainnet')) {
      warnings.push('⚠️  Network is mainnet-beta but RPC URL doesn\'t contain "mainnet". Verify configuration.');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Display configuration
   */
  display(hideSensitive = true) {
    console.log('\n📋 LaunchPad Trader Configuration:\n');
    console.log('━'.repeat(60));
    
    console.log('🔐 Wallet Settings:');
    console.log('   Provider:', this.data.walletProvider);
    console.log('   Agent ID:', this.data.agentId);
    
    if (this.data.walletProvider === 'privy') {
      console.log('   Privy App ID:', this.data.privyAppId || '(not set)');
      console.log('   Privy Secret:', hideSensitive && this.data.privyAppSecret 
        ? '***' + this.data.privyAppSecret.slice(-4) 
        : this.data.privyAppSecret || '(not set)');
    }
    
    console.log('');
    console.log('🌐 Solana Network:');
    console.log('   Network:', this.data.network);
    console.log('   RPC URL:', this.data.rpcUrl);
    
    console.log('');
    console.log('🚀 LaunchPad API:');
    console.log('   API URL:', this.data.apiUrl);
    
    console.log('━'.repeat(60));
    console.log('');
    
    // Validate and show results
    const validation = this.validate();
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(w => console.log('   ' + w));
      console.log('');
    }
    
    if (validation.valid) {
      console.log('✅ Configuration is valid\n');
    } else {
      console.log('❌ Configuration errors:');
      validation.errors.forEach(e => console.log('   - ' + e));
      console.log('');
    }
    
    return validation;
  }
  
  /**
   * Save configuration to .env file
   */
  save(updates = {}) {
    const envPath = path.join(__dirname, '..', '.env');
    
    // Merge updates
    Object.assign(this.data, updates);
    
    // Build .env content
    const lines = [
      '# LaunchPad Trader Configuration',
      '# Generated by setup wizard',
      '',
      '# Wallet Provider (privy or local)',
      `WALLET_PROVIDER=${this.data.walletProvider}`,
      '',
    ];
    
    if (this.data.walletProvider === 'privy') {
      lines.push(
        '# Privy Settings',
        `PRIVY_APP_ID=${this.data.privyAppId || ''}`,
        `PRIVY_APP_SECRET=${this.data.privyAppSecret || ''}`,
        ''
      );
    }
    
    lines.push(
      '# Solana Network',
      `SOLANA_NETWORK=${this.data.network}`,
      `SOLANA_RPC_URL=${this.data.rpcUrl}`,
      '',
      '# LaunchPad API',
      `LAUNCHPAD_API_URL=${this.data.apiUrl}`,
      '',
      '# Agent/Bot ID',
      `OPENCLAW_AGENT_ID=${this.data.agentId}`,
      ''
    );
    
    if (this.data.walletProvider === 'local' && this.data.walletPassword) {
      lines.push(
        '# Wallet Password (for local encrypted wallet)',
        `WALLET_PASSWORD=${this.data.walletPassword}`,
        ''
      );
    }
    
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('💾 Configuration saved to .env');
  }
  
  /**
   * Create example .env file
   */
  static createExample() {
    const examplePath = path.join(__dirname, '..', '.env.example');
    
    const content = `# LaunchPad Trader Configuration Example

# Wallet Provider
# Options: privy, local
# - privy: Secure embedded wallet with MPC (recommended for production)
# - local: Encrypted keypair stored locally
WALLET_PROVIDER=privy

# Privy Settings (required if WALLET_PROVIDER=privy)
# Get these from https://dashboard.privy.io
PRIVY_APP_ID=your-app-id-here
PRIVY_APP_SECRET=your-app-secret-here

# Solana Network
# Options: devnet, testnet, mainnet-beta
SOLANA_NETWORK=devnet

# Solana RPC Endpoint
# Default: https://api.devnet.solana.com (free, rate limited)
# Recommended: Use a private RPC for better performance
# Examples:
#   - Helius: https://devnet.helius-rpc.com/?api-key=YOUR_KEY
#   - QuickNode: https://YOUR_ENDPOINT.quiknode.pro/YOUR_KEY/
#   - Alchemy: https://solana-devnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://api.devnet.solana.com

# LaunchPad Backend API
# Default: http://localhost:3000/v1
# Change if backend is hosted elsewhere
LAUNCHPAD_API_URL=http://localhost:3000/v1

# OpenClaw Agent ID
# Used for bot rewards tracking and wallet identification
# Set this to your unique agent identifier
OPENCLAW_AGENT_ID=launchpad-trader

# Wallet Password (for local encrypted wallet only)
# Leave empty to be prompted when needed
# WALLET_PASSWORD=your-secure-password
`;
    
    fs.writeFileSync(examplePath, content);
    console.log('✅ Created .env.example');
  }
}

// Export singleton instance
module.exports = new Config();
