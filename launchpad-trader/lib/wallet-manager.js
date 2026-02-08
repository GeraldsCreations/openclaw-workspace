/**
 * Wallet Manager
 * Handles Solana wallet operations: creation, import, signing, balances
 */

import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_DIR = path.join(process.env.HOME || '/root', '.openclaw', 'wallets');

class WalletManager {
  constructor(options = {}) {
    this.rpcUrl = options.rpcUrl || DEFAULT_RPC_URL;
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    this.keypair = null;
    this.walletDir = options.walletDir || WALLET_DIR;
  }

  // ==================== WALLET CREATION & IMPORT ====================

  /**
   * Generate new wallet
   * @returns {object} - { publicKey, secretKey }
   */
  generateWallet() {
    const keypair = Keypair.generate();
    this.keypair = keypair;
    
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: bs58.encode(keypair.secretKey),
    };
  }

  /**
   * Import wallet from secret key
   * @param {string} secretKey - Base58 encoded secret key
   */
  importWallet(secretKey) {
    try {
      const decoded = bs58.decode(secretKey);
      this.keypair = Keypair.fromSecretKey(decoded);
      
      return {
        publicKey: this.keypair.publicKey.toBase58(),
        imported: true,
      };
    } catch (error) {
      throw new Error(`Failed to import wallet: ${error.message}`);
    }
  }

  /**
   * Save wallet to file (encrypted would be better in production)
   * @param {string} name - Wallet name/identifier
   * @param {string} secretKey - Base58 encoded secret key
   */
  async saveWallet(name, secretKey) {
    try {
      // Create wallet directory if it doesn't exist
      await fs.mkdir(this.walletDir, { recursive: true });
      
      const walletPath = path.join(this.walletDir, `${name}.json`);
      const walletData = {
        name,
        publicKey: this.keypair.publicKey.toBase58(),
        secretKey,
        createdAt: new Date().toISOString(),
      };
      
      await fs.writeFile(walletPath, JSON.stringify(walletData, null, 2));
      console.log(`✅ Wallet saved: ${walletPath}`);
      
      return walletPath;
    } catch (error) {
      throw new Error(`Failed to save wallet: ${error.message}`);
    }
  }

  /**
   * Load wallet from file
   * @param {string} name - Wallet name/identifier
   */
  async loadWallet(name) {
    try {
      const walletPath = path.join(this.walletDir, `${name}.json`);
      const data = await fs.readFile(walletPath, 'utf-8');
      const walletData = JSON.parse(data);
      
      this.importWallet(walletData.secretKey);
      console.log(`✅ Wallet loaded: ${walletData.publicKey}`);
      
      return walletData;
    } catch (error) {
      throw new Error(`Failed to load wallet: ${error.message}`);
    }
  }

  /**
   * List all saved wallets
   */
  async listWallets() {
    try {
      await fs.mkdir(this.walletDir, { recursive: true });
      const files = await fs.readdir(this.walletDir);
      
      const wallets = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.walletDir, file), 'utf-8');
          const wallet = JSON.parse(data);
          wallets.push({
            name: wallet.name,
            publicKey: wallet.publicKey,
            createdAt: wallet.createdAt,
          });
        }
      }
      
      return wallets;
    } catch (error) {
      throw new Error(`Failed to list wallets: ${error.message}`);
    }
  }

  // ==================== SIGNING ====================

  /**
   * Sign message for authentication
   * @param {string} message - Message to sign
   * @returns {object} - { signature, message, publicKey }
   */
  signMessage(message) {
    if (!this.keypair) {
      throw new Error('No wallet loaded. Import or generate wallet first.');
    }

    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.keypair.secretKey);
    
    return {
      signature: bs58.encode(signature),
      message,
      publicKey: this.keypair.publicKey.toBase58(),
    };
  }

  /**
   * Verify message signature
   * @param {string} message - Original message
   * @param {string} signature - Base58 signature
   * @param {string} publicKey - Base58 public key
   */
  verifySignature(message, signature, publicKey) {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(publicKey);
      
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      return false;
    }
  }

  // ==================== BALANCES ====================

  /**
   * Get SOL balance
   * @param {string} publicKey - Optional wallet address (defaults to current)
   * @returns {Promise<number>} - Balance in SOL
   */
  async getSolBalance(publicKey = null) {
    try {
      const address = publicKey || this.keypair?.publicKey.toBase58();
      if (!address) {
        throw new Error('No wallet address provided');
      }

      const pubKey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubKey);
      
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      throw new Error(`Failed to get SOL balance: ${error.message}`);
    }
  }

  /**
   * Get token balance
   * @param {string} mintAddress - Token mint address
   * @param {string} publicKey - Optional wallet address (defaults to current)
   * @returns {Promise<number>} - Token balance
   */
  async getTokenBalance(mintAddress, publicKey = null) {
    try {
      const address = publicKey || this.keypair?.publicKey.toBase58();
      if (!address) {
        throw new Error('No wallet address provided');
      }

      const pubKey = new PublicKey(address);
      const mint = new PublicKey(mintAddress);
      
      // Get token accounts
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        pubKey,
        { mint }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      // Sum all token account balances (usually just one)
      const totalBalance = tokenAccounts.value.reduce((sum, account) => {
        return sum + account.account.data.parsed.info.tokenAmount.uiAmount;
      }, 0);

      return totalBalance;
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Get all token balances for wallet
   * @param {string} publicKey - Optional wallet address (defaults to current)
   * @returns {Promise<array>} - Array of token balances
   */
  async getAllTokenBalances(publicKey = null) {
    try {
      const address = publicKey || this.keypair?.publicKey.toBase58();
      if (!address) {
        throw new Error('No wallet address provided');
      }

      const pubKey = new PublicKey(address);
      
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        pubKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      return tokenAccounts.value.map((account) => {
        const info = account.account.data.parsed.info;
        return {
          mint: info.mint,
          balance: info.tokenAmount.uiAmount,
          decimals: info.tokenAmount.decimals,
        };
      }).filter(token => token.balance > 0);
    } catch (error) {
      throw new Error(`Failed to get token balances: ${error.message}`);
    }
  }

  // ==================== TRANSACTION HISTORY ====================

  /**
   * Get recent transactions
   * @param {string} publicKey - Optional wallet address (defaults to current)
   * @param {number} limit - Max transactions to fetch
   * @returns {Promise<array>} - Transaction signatures
   */
  async getRecentTransactions(publicKey = null, limit = 10) {
    try {
      const address = publicKey || this.keypair?.publicKey.toBase58();
      if (!address) {
        throw new Error('No wallet address provided');
      }

      const pubKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(
        pubKey,
        { limit }
      );

      return signatures.map(sig => ({
        signature: sig.signature,
        slot: sig.slot,
        timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
        status: sig.err ? 'failed' : 'success',
        error: sig.err,
      }));
    } catch (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  // ==================== HELPERS ====================

  /**
   * Get current wallet public key
   */
  getPublicKey() {
    if (!this.keypair) {
      throw new Error('No wallet loaded');
    }
    return this.keypair.publicKey.toBase58();
  }

  /**
   * Check if wallet is loaded
   */
  isLoaded() {
    return this.keypair !== null;
  }

  /**
   * Generate authentication message
   * Standard message format for wallet authentication
   */
  generateAuthMessage() {
    const timestamp = Date.now();
    return `LaunchPad Authentication\nTimestamp: ${timestamp}\nSign this message to authenticate with LaunchPad.`;
  }
}

export default WalletManager;
