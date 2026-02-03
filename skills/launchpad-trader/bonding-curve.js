#!/usr/bin/env node

/**
 * Simple Bonding Curve for LaunchPad Trading
 * Linear bonding curve: price increases with supply
 */

const { 
  Connection, 
  Keypair, 
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { 
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const fs = require('fs');

const RPC_URL = 'https://api.devnet.solana.com';

/**
 * Simple linear bonding curve
 * Price = base_price + (circulating_supply * price_increment)
 */
class BondingCurve {
  constructor(params = {}) {
    this.basePrice = params.basePrice || 0.0001; // 0.0001 SOL per token
    this.priceIncrement = params.priceIncrement || 0.00000001; // Price increases per token sold
    this.totalSupply = params.totalSupply || 1_000_000_000;
    this.circulatingSupply = params.circulatingSupply || 0; // Tokens sold so far
  }

  /**
   * Calculate current price per token
   */
  getCurrentPrice() {
    return this.basePrice + (this.circulatingSupply * this.priceIncrement);
  }

  /**
   * Calculate how many tokens can be bought with X SOL
   */
  calculateBuyAmount(solAmount) {
    const currentPrice = this.getCurrentPrice();
    const tokensAmount = Math.floor(solAmount / currentPrice);
    
    // Can't buy more than available
    const availableTokens = this.totalSupply - this.circulatingSupply;
    const actualTokens = Math.min(tokensAmount, availableTokens);
    
    const actualCost = actualTokens * currentPrice;
    
    return {
      tokensAmount: actualTokens,
      actualCost,
      pricePerToken: currentPrice,
      newCirculatingSupply: this.circulatingSupply + actualTokens
    };
  }

  /**
   * Calculate how much SOL you get for selling X tokens
   */
  calculateSellAmount(tokensAmount) {
    const currentPrice = this.getCurrentPrice();
    
    // Can't sell more than you own (checked elsewhere)
    const solAmount = tokensAmount * currentPrice * 0.95; // 5% fee
    
    return {
      solAmount,
      pricePerToken: currentPrice,
      fee: tokensAmount * currentPrice * 0.05,
      newCirculatingSupply: this.circulatingSupply - tokensAmount
    };
  }

  /**
   * Get quote for buying
   */
  getQuote(type, amount) {
    if (type === 'buy') {
      return this.calculateBuyAmount(amount);
    } else {
      return this.calculateSellAmount(amount);
    }
  }
}

/**
 * Execute a BUY trade
 */
async function buyTokens(params) {
  const {
    tokenMint,
    buyer, // Keypair
    solAmount,
    creatorWallet, // PublicKey of token creator (receives SOL)
  } = params;

  console.log('🛒 Executing BUY...');
  console.log(`   Token: ${tokenMint}`);
  console.log(`   Amount: ${solAmount} SOL`);
  console.log('');

  const connection = new Connection(RPC_URL, 'confirmed');

  try {
    // 1. Calculate how many tokens to give
    const curve = new BondingCurve(); // Load from DB in production
    const quote = curve.calculateBuyAmount(solAmount);
    
    console.log('📊 Quote:');
    console.log(`   Tokens to receive: ${quote.tokensAmount.toLocaleString()}`);
    console.log(`   Price per token: ${quote.pricePerToken.toFixed(10)} SOL`);
    console.log(`   Actual cost: ${quote.actualCost.toFixed(6)} SOL`);
    console.log('');

    // 2. Transfer SOL from buyer to creator (bonding curve vault in production)
    console.log('💸 Transferring SOL...');
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: buyer.publicKey,
        toPubkey: creatorWallet,
        lamports: Math.floor(quote.actualCost * LAMPORTS_PER_SOL),
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [buyer],
      { commitment: 'confirmed' }
    );

    console.log('✅ SOL transferred!');
    console.log(`   Signature: ${signature}`);
    console.log('');

    // 3. Transfer tokens from creator to buyer
    console.log('🪙 Transferring tokens...');
    
    const mint = new PublicKey(tokenMint);
    
    // Get creator's token account
    const creatorTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      buyer, // Payer (could be platform in production)
      mint,
      creatorWallet,
      true // Allow owner off curve
    );

    // Get buyer's token account
    const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      buyer,
      mint,
      buyer.publicKey
    );

    // NOTE: In production, creator wallet would need to sign this
    // For now, we can only transfer if buyer IS creator (testing)
    if (buyer.publicKey.equals(creatorWallet)) {
      const transferSig = await transfer(
        connection,
        buyer, // Creator is buyer (testing scenario)
        creatorTokenAccount.address,
        buyerTokenAccount.address,
        creatorWallet,
        quote.tokensAmount * Math.pow(10, 9), // With decimals
        [],
        { commitment: 'confirmed' }
      );

      console.log('✅ Tokens transferred!');
      console.log(`   Signature: ${transferSig}`);
      console.log('');
    } else {
      console.log('⚠️  Token transfer requires creator signature (production needs vault)');
      console.log('');
    }

    console.log('🎉 BUY Complete!');
    console.log(`   Bought: ${quote.tokensAmount.toLocaleString()} OPUMP`);
    console.log(`   Cost: ${quote.actualCost.toFixed(6)} SOL`);
    console.log('');

    return {
      success: true,
      tokensAmount: quote.tokensAmount,
      solCost: quote.actualCost,
      signature
    };

  } catch (error) {
    console.error('❌ Buy failed:', error.message);
    throw error;
  }
}

/**
 * Execute a SELL trade
 */
async function sellTokens(params) {
  const {
    tokenMint,
    seller, // Keypair
    tokensAmount,
    creatorWallet, // PublicKey of token creator (vault in production)
  } = params;

  console.log('💰 Executing SELL...');
  console.log(`   Token: ${tokenMint}`);
  console.log(`   Amount: ${tokensAmount.toLocaleString()} tokens`);
  console.log('');

  const connection = new Connection(RPC_URL, 'confirmed');

  try {
    // 1. Calculate how much SOL to give
    const curve = new BondingCurve();
    const quote = curve.calculateSellAmount(tokensAmount);
    
    console.log('📊 Quote:');
    console.log(`   SOL to receive: ${quote.solAmount.toFixed(6)}`);
    console.log(`   Price per token: ${quote.pricePerToken.toFixed(10)} SOL`);
    console.log(`   Fee (5%): ${quote.fee.toFixed(6)} SOL`);
    console.log('');

    // 2. Transfer tokens from seller to creator/vault
    console.log('🪙 Transferring tokens...');
    
    const mint = new PublicKey(tokenMint);
    
    const sellerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      seller,
      mint,
      seller.publicKey
    );

    const vaultTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      seller, // Payer
      mint,
      creatorWallet,
      true
    );

    const transferSig = await transfer(
      connection,
      seller,
      sellerTokenAccount.address,
      vaultTokenAccount.address,
      seller.publicKey,
      tokensAmount * Math.pow(10, 9),
      [],
      { commitment: 'confirmed' }
    );

    console.log('✅ Tokens transferred!');
    console.log(`   Signature: ${transferSig}`);
    console.log('');

    // 3. Transfer SOL from vault to seller (needs vault keypair in production)
    console.log('💸 Transferring SOL...');
    console.log('⚠️  SOL transfer requires vault keypair (production needs proper vault)');
    console.log('');

    console.log('🎉 SELL Complete!');
    console.log(`   Sold: ${tokensAmount.toLocaleString()} OPUMP`);
    console.log(`   Received: ${quote.solAmount.toFixed(6)} SOL (minus fees)`);
    console.log('');

    return {
      success: true,
      tokensAmount,
      solReceived: quote.solAmount,
      signature: transferSig
    };

  } catch (error) {
    console.error('❌ Sell failed:', error.message);
    throw error;
  }
}

/**
 * Main test
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('          🍆 BONDING CURVE TRADING 🍆');
  console.log('═══════════════════════════════════════════════════\n');

  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync('/tmp/opump-deployment.json', 'utf8'));
  const walletData = JSON.parse(fs.readFileSync('/tmp/open-pump-wallet.json', 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));

  console.log('Token:', deployment.mint);
  console.log('Wallet:', wallet.publicKey.toString());
  console.log('');

  try {
    // Test BUY
    console.log('═══ TEST 1: BUY TOKENS ═══\n');
    await buyTokens({
      tokenMint: deployment.mint,
      buyer: wallet,
      solAmount: 0.01, // Buy with 0.01 SOL
      creatorWallet: wallet.publicKey
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test SELL
    console.log('═══ TEST 2: SELL TOKENS ═══\n');
    await sellTokens({
      tokenMint: deployment.mint,
      seller: wallet,
      tokensAmount: 50_000, // Sell 50k tokens
      creatorWallet: wallet.publicKey
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('            ✅ TRADING TEST COMPLETE!');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Trading test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { BondingCurve, buyTokens, sellTokens };
