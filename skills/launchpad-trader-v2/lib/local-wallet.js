/**
 * Local Wallet Manager
 * Encrypted keypair storage with recovery phrase support
 */

const { Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');

class LocalWalletManager {
  constructor(config) {
    this.config = config;
    this.keypair = null;
    this.walletPath = this._getWalletPath();
  }
  
  /**
   * Initialize local wallet
   */
  async initialize() {
    try {
      // Try to load existing wallet
      if (fs.existsSync(this.walletPath)) {
        console.log('📂 Loading existing wallet...');
        await this.load();
      } else {
        throw new Error('No wallet found. Create one first with setup wizard.');
      }
      
      return {
        address: this.keypair.publicKey.toBase58(),
        provider: 'local-encrypted',
      };
    } catch (error) {
      console.error('❌ Failed to initialize local wallet:', error.message);
      throw error;
    }
  }
  
  /**
   * Create new wallet with recovery phrase
   */
  async create(password, wordCount = 24) {
    try {
      console.log('➕ Creating new wallet...');
      
      // 1. Generate mnemonic
      const strength = wordCount === 12 ? 128 : 256;
      const mnemonic = bip39.generateMnemonic(strength);
      
      // 2. Derive keypair from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const derivationPath = "m/44'/501'/0'/0'"; // Solana standard path
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
      this.keypair = Keypair.fromSeed(derivedSeed);
      
      // 3. Encrypt and save
      await this._encrypt(password, mnemonic);
      
      console.log('✅ Wallet created!');
      console.log('📍 Address:', this.keypair.publicKey.toBase58());
      console.log('');
      console.log('🔐 RECOVERY PHRASE (WRITE THIS DOWN!):');
      console.log('━'.repeat(60));
      console.log(mnemonic);
      console.log('━'.repeat(60));
      console.log('');
      console.log('⚠️  THIS IS YOUR ONLY CHANCE TO SEE THIS!');
      console.log('⚠️  Store it somewhere safe. You\'ll need it to recover your wallet.');
      console.log('');
      
      return {
        address: this.keypair.publicKey.toBase58(),
        mnemonic, // Return for verification, then forget
      };
    } catch (error) {
      console.error('❌ Failed to create wallet:', error.message);
      throw error;
    }
  }
  
  /**
   * Import wallet from various formats
   */
  async importWallet(input, type, password) {
    try {
      console.log(`📥 Importing wallet from ${type}...`);
      
      let keypair;
      let mnemonic = null;
      
      switch (type) {
        case 'mnemonic':
          // Validate mnemonic
          if (!bip39.validateMnemonic(input)) {
            throw new Error('Invalid mnemonic phrase');
          }
          
          const seed = await bip39.mnemonicToSeed(input);
          const derivationPath = "m/44'/501'/0'/0'";
          const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
          keypair = Keypair.fromSeed(derivedSeed);
          mnemonic = input; // Save for encryption
          break;
          
        case 'privateKey':
          // Base58 private key
          const decoded = bs58.decode(input);
          keypair = Keypair.fromSecretKey(decoded);
          break;
          
        case 'secretKeyArray':
          // JSON array of numbers
          const secretKey = JSON.parse(input);
          keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
          break;
          
        case 'keypairFile':
          // Read from file
          const fileData = fs.readFileSync(input, 'utf8');
          const secretKeyFromFile = JSON.parse(fileData);
          keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyFromFile));
          break;
          
        default:
          throw new Error(`Unsupported import type: ${type}`);
      }
      
      this.keypair = keypair;
      
      // Encrypt and save
      await this._encrypt(password, mnemonic);
      
      console.log('✅ Wallet imported!');
      console.log('📍 Address:', this.keypair.publicKey.toBase58());
      
      return {
        address: this.keypair.publicKey.toBase58(),
      };
    } catch (error) {
      console.error('❌ Failed to import wallet:', error.message);
      throw error;
    }
  }
  
  /**
   * Load encrypted wallet
   */
  async load(password) {
    try {
      if (!fs.existsSync(this.walletPath)) {
        throw new Error('No wallet file found');
      }
      
      // Read encrypted data
      const encryptedData = JSON.parse(fs.readFileSync(this.walletPath, 'utf8'));
      
      // Get password if not provided
      if (!password) {
        password = await this._getPassword();
      }
      
      // Decrypt
      const decrypted = this._decrypt(encryptedData, password);
      
      // Restore keypair
      this.keypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(decrypted.secretKey))
      );
      
      return {
        address: this.keypair.publicKey.toBase58(),
        provider: 'local-encrypted',
      };
    } catch (error) {
      if (error.message.includes('Unsupported state or unable to authenticate')) {
        throw new Error('Invalid password');
      }
      throw error;
    }
  }
  
  /**
   * Get wallet address
   */
  async getAddress() {
    if (!this.keypair) {
      throw new Error('Wallet not loaded. Call load() first.');
    }
    return this.keypair.publicKey.toBase58();
  }
  
  /**
   * Sign transaction
   */
  async signTransaction(transaction) {
    if (!this.keypair) {
      throw new Error('Wallet not loaded');
    }
    
    transaction.sign(this.keypair);
    return transaction;
  }
  
  /**
   * Sign message
   */
  async signMessage(message) {
    if (!this.keypair) {
      throw new Error('Wallet not loaded');
    }
    
    const messageBytes = typeof message === 'string' 
      ? Buffer.from(message) 
      : message;
    
    return this.keypair.sign(messageBytes);
  }
  
  /**
   * Encrypt wallet data with AES-256-GCM
   */
  async _encrypt(password, mnemonic = null) {
    const algorithm = 'aes-256-gcm';
    
    // Generate salt for key derivation
    const salt = crypto.randomBytes(32);
    
    // Derive encryption key from password using scrypt
    const key = crypto.scryptSync(password, salt, 32);
    
    // Generate IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    // Prepare data to encrypt
    const data = {
      secretKey: JSON.stringify(Array.from(this.keypair.secretKey)),
      mnemonic: mnemonic || null,
      address: this.keypair.publicKey.toBase58(),
      createdAt: new Date().toISOString(),
    };
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final(),
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Save encrypted data
    const encryptedData = {
      version: '2.0',
      algorithm,
      encrypted: encrypted.toString('hex'),
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
    
    // Ensure directory exists
    const dir = path.dirname(this.walletPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    
    // Write with restrictive permissions
    fs.writeFileSync(
      this.walletPath,
      JSON.stringify(encryptedData, null, 2),
      { mode: 0o600 }
    );
    
    console.log('💾 Wallet saved (encrypted):', this.walletPath);
  }
  
  /**
   * Decrypt wallet data
   */
  _decrypt(encryptedData, password) {
    const algorithm = 'aes-256-gcm';
    
    // Convert hex strings back to buffers
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
    
    // Derive key from password
    const key = crypto.scryptSync(password, salt, 32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }
  
  /**
   * Get password from environment or prompt
   */
  async _getPassword() {
    // Check environment variable first
    if (process.env.WALLET_PASSWORD) {
      return process.env.WALLET_PASSWORD;
    }
    
    // In production, this should be securely provided
    throw new Error('Wallet password required. Set WALLET_PASSWORD environment variable.');
  }
  
  /**
   * Get wallet file path
   */
  _getWalletPath() {
    return path.join(
      require('os').homedir(),
      '.openclaw',
      'wallets',
      'launchpad-trader-v2.enc'
    );
  }
  
  /**
   * Export wallet info (for display only)
   */
  async getWalletInfo() {
    if (!this.keypair) {
      throw new Error('Wallet not loaded');
    }
    
    return {
      address: this.keypair.publicKey.toBase58(),
      provider: 'local-encrypted',
      path: this.walletPath,
    };
  }
  
  /**
   * Change wallet password
   */
  async changePassword(oldPassword, newPassword) {
    try {
      // Load with old password
      await this.load(oldPassword);
      
      // Re-encrypt with new password
      await this._encrypt(newPassword);
      
      console.log('✅ Password changed successfully');
    } catch (error) {
      console.error('❌ Failed to change password:', error.message);
      throw error;
    }
  }
}

module.exports = LocalWalletManager;
