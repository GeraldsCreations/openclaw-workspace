/**
 * Privy Wallet Manager
 * Secure agentic wallet integration with Privy
 */

const { PrivyClient, generateP256KeyPair } = require('@privy-io/node');
const { PublicKey, Transaction } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

class PrivyWalletManager {
  constructor(config) {
    if (!config.privyAppId || !config.privyAppSecret) {
      throw new Error('Privy App ID and Secret are required');
    }
    
    this.config = config;
    this.privy = new PrivyClient({
      appId: config.privyAppId,
      appSecret: config.privyAppSecret,
    });
    
    this.wallet = null;
    this.authKey = null;
  }
  
  /**
   * Initialize Privy wallet for agent
   * Creates wallet with authorization key for autonomous signing
   */
  async initialize(agentId) {
    try {
      console.log('🔐 Initializing Privy wallet...');
      
      // 1. Load or generate authorization key
      this.authKey = await this._loadOrCreateAuthKey(agentId);
      
      // 2. Create or load wallet
      this.wallet = await this._createOrLoadWallet(agentId);
      
      console.log('✅ Privy wallet initialized');
      console.log('📍 Address:', this.wallet.address);
      console.log('🔑 Wallet ID:', this.wallet.id);
      
      return {
        address: this.wallet.address,
        walletId: this.wallet.id,
        provider: 'privy',
      };
    } catch (error) {
      console.error('❌ Failed to initialize Privy wallet:', error.message);
      throw error;
    }
  }
  
  /**
   * Load or create authorization key for agent
   * Authorization keys allow autonomous signing
   */
  async _loadOrCreateAuthKey(agentId) {
    const keyPath = this._getAuthKeyPath(agentId);
    
    try {
      // Try to load existing key
      if (fs.existsSync(keyPath)) {
        console.log('📂 Loading existing authorization key...');
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        return keyData;
      }
      
      // Generate new authorization key
      console.log('🔑 Generating new authorization key...');
      const { privateKey, publicKey } = await generateP256KeyPair();
      
      const keyData = {
        privateKey,
        publicKey,
        createdAt: new Date().toISOString(),
        agentId,
      };
      
      // Save key securely (only private key is sensitive)
      this._saveAuthKey(agentId, keyData);
      
      console.log('✅ Authorization key generated and saved');
      
      return keyData;
    } catch (error) {
      throw new Error(`Failed to load/create auth key: ${error.message}`);
    }
  }
  
  /**
   * Create or load wallet for agent
   */
  async _createOrLoadWallet(agentId) {
    try {
      // Check if wallet already exists for this agent
      const existingWallet = await this._findExistingWallet(agentId);
      
      if (existingWallet) {
        console.log('📂 Loading existing wallet...');
        return existingWallet;
      }
      
      // Create new wallet with authorization key as owner
      console.log('➕ Creating new Privy wallet...');
      
      const wallet = await this.privy.wallets().create({
        chain_type: 'solana',
        owner: {
          public_key: this.authKey.publicKey,
        },
        // Optional: Add metadata for tracking
        metadata: {
          agent_id: agentId,
          created_by: 'launchpad-trader',
          created_at: new Date().toISOString(),
        },
      });
      
      // Save wallet metadata
      this._saveWalletMetadata(agentId, wallet);
      
      return wallet;
    } catch (error) {
      throw new Error(`Failed to create/load wallet: ${error.message}`);
    }
  }
  
  /**
   * Find existing wallet for agent
   */
  async _findExistingWallet(agentId) {
    const metadataPath = this._getWalletMetadataPath(agentId);
    
    if (!fs.existsSync(metadataPath)) {
      return null;
    }
    
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Verify wallet still exists in Privy
      const wallet = await this.privy.wallets().get(metadata.walletId);
      
      return wallet;
    } catch (error) {
      // Wallet not found or error - return null to create new
      console.warn('⚠️  Saved wallet not found, will create new one');
      return null;
    }
  }
  
  /**
   * Get wallet address
   */
  async getAddress() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
    return this.wallet.address;
  }
  
  /**
   * Sign transaction with Privy wallet
   */
  async signTransaction(transaction) {
    if (!this.wallet || !this.authKey) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      console.log('✍️  Signing transaction with Privy...');
      
      // Serialize transaction for signing
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      
      // Sign with Privy using authorization key
      const result = await this.privy.wallets().solana().signTransaction(
        this.wallet.id,
        {
          transaction: serializedTx.toString('base64'),
          authorization_context: {
            authorization_private_keys: [this.authKey.privateKey],
          },
        }
      );
      
      console.log('✅ Transaction signed');
      
      return Buffer.from(result.signature, 'base64');
    } catch (error) {
      console.error('❌ Failed to sign transaction:', error.message);
      throw error;
    }
  }
  
  /**
   * Sign message with Privy wallet
   */
  async signMessage(message) {
    if (!this.wallet || !this.authKey) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const result = await this.privy.wallets().solana().signMessage(
        this.wallet.id,
        {
          message: Buffer.from(message).toString('base64'),
          authorization_context: {
            authorization_private_keys: [this.authKey.privateKey],
          },
        }
      );
      
      return Buffer.from(result.signature, 'base64');
    } catch (error) {
      console.error('❌ Failed to sign message:', error.message);
      throw error;
    }
  }
  
  /**
   * Get authorization key path
   */
  _getAuthKeyPath(agentId) {
    const dir = path.join(
      require('os').homedir(),
      '.openclaw',
      'wallets',
      'privy'
    );
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    
    return path.join(dir, `${agentId}-auth-key.json`);
  }
  
  /**
   * Get wallet metadata path
   */
  _getWalletMetadataPath(agentId) {
    const dir = path.join(
      require('os').homedir(),
      '.openclaw',
      'wallets',
      'privy'
    );
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    
    return path.join(dir, `${agentId}-wallet.json`);
  }
  
  /**
   * Save authorization key securely
   */
  _saveAuthKey(agentId, keyData) {
    const keyPath = this._getAuthKeyPath(agentId);
    fs.writeFileSync(
      keyPath,
      JSON.stringify(keyData, null, 2),
      { mode: 0o600 }
    );
    console.log('💾 Authorization key saved:', keyPath);
  }
  
  /**
   * Save wallet metadata
   */
  _saveWalletMetadata(agentId, wallet) {
    const metadata = {
      walletId: wallet.id,
      address: wallet.address,
      chainType: wallet.chain_type,
      createdAt: new Date().toISOString(),
      agentId,
    };
    
    const metadataPath = this._getWalletMetadataPath(agentId);
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      { mode: 0o600 }
    );
    console.log('💾 Wallet metadata saved');
  }
  
  /**
   * Get wallet info
   */
  async getWalletInfo() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    return {
      address: this.wallet.address,
      walletId: this.wallet.id,
      chainType: this.wallet.chain_type,
      provider: 'privy',
    };
  }
}

module.exports = PrivyWalletManager;
