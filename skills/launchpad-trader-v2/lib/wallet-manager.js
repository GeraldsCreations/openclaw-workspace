/**
 * Unified Wallet Manager
 * Abstracts over Privy and local encrypted wallets
 */

const { Connection } = require('@solana/web3.js');
const PrivyWalletManager = require('./privy-wallet');
const LocalWalletManager = require('./local-wallet');

class WalletManager {
  constructor(config) {
    this.config = config;
    this.provider = config.walletProvider || 'local'; // 'privy' or 'local'
    this.wallet = null;
    this.connection = new Connection(
      config.rpcUrl || 'https://api.devnet.solana.com',
      'confirmed'
    );
  }
  
  /**
   * Initialize wallet based on provider
   */
  async initialize() {
    try {
      console.log(`🔧 Initializing ${this.provider} wallet...`);
      
      switch (this.provider) {
        case 'privy':
          this.wallet = new PrivyWalletManager(this.config);
          await this.wallet.initialize(this.config.agentId || 'default');
          break;
          
        case 'local':
        case 'local-encrypted':
          this.wallet = new LocalWalletManager(this.config);
          await this.wallet.initialize();
          break;
          
        default:
          throw new Error(`Unknown wallet provider: ${this.provider}`);
      }
      
      const address = await this.getAddress();
      console.log('✅ Wallet initialized');
      console.log('📍 Address:', address);
      console.log('🔗 Provider:', this.provider);
      
      return {
        address,
        provider: this.provider,
      };
    } catch (error) {
      console.error('❌ Wallet initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Get wallet address
   */
  async getAddress() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
    return await this.wallet.getAddress();
  }
  
  /**
   * Get SOL balance
   */
  async getBalance(address = null) {
    try {
      const addr = address || await this.getAddress();
      const balance = await this.connection.getBalance(
        new (require('@solana/web3.js').PublicKey)(addr)
      );
      
      const sol = balance / 1e9;
      console.log('💰 Balance:', sol, 'SOL');
      return sol;
    } catch (error) {
      console.error('❌ Failed to get balance:', error.message);
      throw error;
    }
  }
  
  /**
   * Get token balance
   */
  async getTokenBalance(mintAddress) {
    try {
      const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
      const { PublicKey } = require('@solana/web3.js');
      
      const mint = new PublicKey(mintAddress);
      const owner = new PublicKey(await this.getAddress());
      
      const tokenAccount = await getAssociatedTokenAddress(mint, owner);
      
      try {
        const accountInfo = await getAccount(this.connection, tokenAccount);
        const balance = Number(accountInfo.amount) / 1e9; // Assuming 9 decimals
        
        console.log('🪙 Token Balance:', balance);
        return balance;
      } catch (error) {
        if (error.message.includes('could not find account')) {
          console.log('🪙 Token Balance: 0 (no token account)');
          return 0;
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Failed to get token balance:', error.message);
      throw error;
    }
  }
  
  /**
   * Get all token balances
   */
  async getAllTokenBalances() {
    try {
      const { PublicKey } = require('@solana/web3.js');
      const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
      
      const owner = new PublicKey(await this.getAddress());
      
      console.log('🔍 Fetching all token accounts...');
      
      const accounts = await this.connection.getParsedTokenAccountsByOwner(
        owner,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      if (accounts.value.length === 0) {
        console.log('📭 No token accounts found');
        return [];
      }
      
      console.log(`📦 Found ${accounts.value.length} token account(s)\n`);
      
      const balances = [];
      
      for (const { account, pubkey } of accounts.value) {
        const parsed = account.data.parsed.info;
        const balance = Number(parsed.tokenAmount.uiAmount);
        const mint = parsed.mint;
        
        if (balance > 0) {
          console.log('🪙 Token:', mint);
          console.log('   Balance:', balance);
          console.log('   Account:', pubkey.toBase58());
          console.log('');
          
          balances.push({
            mint,
            balance,
            account: pubkey.toBase58(),
          });
        }
      }
      
      return balances;
    } catch (error) {
      console.error('❌ Failed to get token balances:', error.message);
      throw error;
    }
  }
  
  /**
   * Sign transaction
   */
  async signTransaction(transaction) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    return await this.wallet.signTransaction(transaction);
  }
  
  /**
   * Sign and send transaction
   */
  async signAndSendTransaction(transaction) {
    try {
      console.log('✍️  Signing transaction...');
      
      // Add recent blockhash if not present
      if (!transaction.recentBlockhash) {
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new (require('@solana/web3.js').PublicKey)(
          await this.getAddress()
        );
      }
      
      // Sign
      const signed = await this.signTransaction(transaction);
      
      console.log('📤 Sending transaction...');
      
      // Send
      const signature = await this.connection.sendRawTransaction(
        signed.serialize()
      );
      
      console.log('⏳ Confirming...');
      
      // Confirm
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Transaction confirmed!');
      console.log('🔗 Signature:', signature);
      console.log(`🔍 Explorer: https://explorer.solana.com/tx/${signature}?cluster=${this.config.network || 'devnet'}`);
      
      return signature;
    } catch (error) {
      console.error('❌ Transaction failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Sign message
   */
  async signMessage(message) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    return await this.wallet.signMessage(message);
  }
  
  /**
   * Send SOL
   */
  async sendSol(toAddress, amount) {
    try {
      const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js');
      
      console.log('📤 Sending', amount, 'SOL to', toAddress);
      
      const from = new PublicKey(await this.getAddress());
      const to = new PublicKey(toAddress);
      const lamports = Math.floor(amount * 1e9);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports,
        })
      );
      
      const signature = await this.signAndSendTransaction(transaction);
      
      return signature;
    } catch (error) {
      console.error('❌ Failed to send SOL:', error.message);
      throw error;
    }
  }
  
  /**
   * Send tokens
   */
  async sendTokens(mintAddress, toAddress, amount) {
    try {
      const { PublicKey, Transaction } = require('@solana/web3.js');
      const { 
        getAssociatedTokenAddress, 
        createTransferInstruction,
        TOKEN_PROGRAM_ID 
      } = require('@solana/spl-token');
      
      console.log('📤 Sending', amount, 'tokens to', toAddress);
      
      const mint = new PublicKey(mintAddress);
      const from = new PublicKey(await this.getAddress());
      const to = new PublicKey(toAddress);
      
      // Get token accounts
      const sourceAccount = await getAssociatedTokenAddress(mint, from);
      const destinationAccount = await getAssociatedTokenAddress(mint, to);
      
      const transferAmount = Math.floor(amount * 1e9); // Assuming 9 decimals
      
      const transaction = new Transaction().add(
        createTransferInstruction(
          sourceAccount,
          destinationAccount,
          from,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );
      
      const signature = await this.signAndSendTransaction(transaction);
      
      return signature;
    } catch (error) {
      console.error('❌ Failed to send tokens:', error.message);
      throw error;
    }
  }
  
  /**
   * Get wallet info
   */
  async getWalletInfo() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    const info = await this.wallet.getWalletInfo();
    const balance = await this.getBalance();
    
    return {
      ...info,
      balance,
      network: this.config.network || 'devnet',
      rpcUrl: this.config.rpcUrl,
    };
  }
  
  /**
   * Get Solana connection
   */
  getConnection() {
    return this.connection;
  }
}

module.exports = WalletManager;
