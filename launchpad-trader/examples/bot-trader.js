#!/usr/bin/env node

/**
 * Example Bot Trader
 * Demonstrates autonomous trading bot using LaunchPad skill
 * 
 * This bot:
 * 1. Monitors new tokens
 * 2. Analyzes opportunities based on criteria
 * 3. Executes buy orders
 * 4. Monitors price movement
 * 5. Sells at profit target or stop loss
 */

import LaunchPadAPIClient from '../lib/api-client.js';
import WalletManager from '../lib/wallet-manager.js';
import {
  formatUsd,
  formatPercentage,
  calculateProfitLoss,
  sleep,
  printError,
} from '../lib/utils.js';

// Bot configuration
const CONFIG = {
  walletName: process.env.WALLET_NAME || 'trading-bot',
  
  // Trading parameters
  buyAmountSol: parseFloat(process.env.BUY_AMOUNT) || 0.1,
  slippage: parseFloat(process.env.SLIPPAGE) || 1.0,
  
  // Entry criteria
  minMarketCap: parseFloat(process.env.MIN_MCAP) || 10000,
  maxMarketCap: parseFloat(process.env.MAX_MCAP) || 100000,
  minVolume24h: parseFloat(process.env.MIN_VOLUME) || 1000,
  
  // Exit strategy
  profitTarget: parseFloat(process.env.PROFIT_TARGET) || 20, // 20% profit
  stopLoss: parseFloat(process.env.STOP_LOSS) || -10, // 10% loss
  
  // Monitoring
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 60000, // 1 minute
  maxPositions: parseInt(process.env.MAX_POSITIONS) || 3,
  
  // Safety
  dryRun: process.env.DRY_RUN === 'true',
};

class TradingBot {
  constructor() {
    this.walletManager = new WalletManager();
    this.apiClient = new LaunchPadAPIClient();
    this.positions = new Map(); // tokenMint => position data
    this.isRunning = false;
  }

  async initialize() {
    console.log('🤖 LaunchPad Trading Bot Starting...\n');
    console.log('Configuration:');
    console.log('='.repeat(60));
    console.log(`Wallet:           ${CONFIG.walletName}`);
    console.log(`Buy Amount:       ${CONFIG.buyAmountSol} SOL`);
    console.log(`Slippage:         ${CONFIG.slippage}%`);
    console.log(`Market Cap:       $${CONFIG.minMarketCap} - $${CONFIG.maxMarketCap}`);
    console.log(`Min Volume:       $${CONFIG.minVolume24h}`);
    console.log(`Profit Target:    ${CONFIG.profitTarget}%`);
    console.log(`Stop Loss:        ${CONFIG.stopLoss}%`);
    console.log(`Max Positions:    ${CONFIG.maxPositions}`);
    console.log(`Check Interval:   ${CONFIG.checkInterval / 1000}s`);
    console.log(`Dry Run:          ${CONFIG.dryRun ? 'YES' : 'NO'}`);
    console.log('='.repeat(60) + '\n');

    // Load wallet
    try {
      await this.walletManager.loadWallet(CONFIG.walletName);
      console.log(`✅ Wallet loaded: ${this.walletManager.getPublicKey()}\n`);
    } catch (error) {
      throw new Error(`Failed to load wallet "${CONFIG.walletName}": ${error.message}`);
    }

    // Check balance
    const balance = await this.walletManager.getSolBalance();
    console.log(`💰 Current balance: ${balance.toFixed(4)} SOL\n`);
    
    if (balance < CONFIG.buyAmountSol) {
      throw new Error(`Insufficient balance. Need ${CONFIG.buyAmountSol} SOL, have ${balance.toFixed(4)} SOL`);
    }

    // Authenticate
    if (!CONFIG.dryRun) {
      console.log('🔐 Authenticating with LaunchPad...');
      const authMessage = this.walletManager.generateAuthMessage();
      const signed = this.walletManager.signMessage(authMessage);
      
      await this.apiClient.authenticateWallet(
        signed.publicKey,
        signed.signature,
        signed.message
      );
      console.log('✅ Authenticated\n');
    }

    console.log('🚀 Bot initialized and ready to trade!\n');
  }

  async start() {
    this.isRunning = true;
    
    console.log('🔄 Starting trading loop...\n');
    
    while (this.isRunning) {
      try {
        await this.tradingCycle();
        await sleep(CONFIG.checkInterval);
      } catch (error) {
        console.error('❌ Error in trading cycle:', error.message);
        await sleep(CONFIG.checkInterval);
      }
    }
  }

  async tradingCycle() {
    console.log(`[${new Date().toISOString()}] Running trading cycle...`);
    
    // Monitor existing positions
    await this.monitorPositions();
    
    // Look for new opportunities if we have capacity
    if (this.positions.size < CONFIG.maxPositions) {
      await this.scanForOpportunities();
    } else {
      console.log(`📊 Max positions (${CONFIG.maxPositions}) reached. Monitoring only.\n`);
    }
  }

  async scanForOpportunities() {
    console.log('🔍 Scanning for trading opportunities...');
    
    // Get all tokens
    const result = await this.apiClient.getTokens({ limit: 100 });
    
    // Filter by criteria
    const candidates = result.tokens.filter(token => 
      token.marketCap >= CONFIG.minMarketCap &&
      token.marketCap <= CONFIG.maxMarketCap &&
      token.volume24h >= CONFIG.minVolume24h &&
      !this.positions.has(token.mintAddress)
    );
    
    console.log(`   Found ${candidates.length} potential candidates`);
    
    if (candidates.length === 0) {
      console.log('   No opportunities found.\n');
      return;
    }
    
    // Analyze top candidate
    const topCandidate = candidates[0]; // You could add more sophisticated scoring here
    console.log(`\n🎯 Top candidate: ${topCandidate.name} (${topCandidate.symbol})`);
    console.log(`   Market Cap: ${formatUsd(topCandidate.marketCap)}`);
    console.log(`   Volume 24h: ${formatUsd(topCandidate.volume24h)}`);
    console.log(`   Price: ${formatUsd(topCandidate.price)}`);
    
    // Get quote
    const quote = await this.apiClient.getQuote(topCandidate.mintAddress, {
      amountSol: CONFIG.buyAmountSol,
      slippage: CONFIG.slippage,
    });
    
    console.log(`   Price Impact: ${quote.quote.priceImpact.toFixed(2)}%`);
    
    // Check if price impact is acceptable (< 5%)
    if (quote.quote.priceImpact > 5) {
      console.log('   ⚠️  Price impact too high. Skipping.\n');
      return;
    }
    
    // Execute buy
    await this.buyToken(topCandidate, quote.quote);
  }

  async buyToken(token, quote) {
    console.log(`\n🛒 Buying ${token.symbol}...`);
    
    if (CONFIG.dryRun) {
      console.log('   [DRY RUN] Simulating purchase...');
    } else {
      const result = await this.apiClient.buyToken(
        token.mintAddress,
        CONFIG.buyAmountSol,
        CONFIG.slippage
      );
      console.log(`   ✅ Purchase successful!`);
      console.log(`   Signature: ${result.transaction.signature}`);
      console.log(`   Tokens: ${result.transaction.tokensReceived.toLocaleString()}`);
    }
    
    // Add to positions
    this.positions.set(token.mintAddress, {
      symbol: token.symbol,
      name: token.name,
      entryPrice: quote.pricePerToken,
      entryTime: Date.now(),
      amount: quote.outputAmount,
      amountSol: CONFIG.buyAmountSol,
    });
    
    console.log(`   📊 Position opened. Monitoring for exit...\n`);
  }

  async monitorPositions() {
    if (this.positions.size === 0) {
      return;
    }
    
    console.log(`📊 Monitoring ${this.positions.size} position(s)...`);
    
    for (const [mintAddress, position] of this.positions) {
      try {
        // Get current price
        const quote = await this.apiClient.getQuote(mintAddress, {
          amountTokens: position.amount,
          slippage: CONFIG.slippage,
        });
        
        const currentPrice = quote.quote.pricePerToken;
        const pl = calculateProfitLoss(position.entryPrice, currentPrice, position.amount);
        
        console.log(`   ${position.symbol}: ${formatPercentage(pl.percentage)} (${formatUsd(pl.profit)})`);
        
        // Check exit conditions
        if (pl.percentage >= CONFIG.profitTarget) {
          console.log(`   🎯 Profit target reached! Selling...`);
          await this.sellToken(mintAddress, position, 'PROFIT TARGET');
        } else if (pl.percentage <= CONFIG.stopLoss) {
          console.log(`   🛑 Stop loss triggered! Selling...`);
          await this.sellToken(mintAddress, position, 'STOP LOSS');
        }
        
      } catch (error) {
        console.error(`   ❌ Error monitoring ${position.symbol}:`, error.message);
      }
    }
    
    console.log('');
  }

  async sellToken(mintAddress, position, reason) {
    console.log(`\n💸 Selling ${position.symbol} (${reason})...`);
    
    if (CONFIG.dryRun) {
      console.log('   [DRY RUN] Simulating sale...');
    } else {
      const result = await this.apiClient.sellToken(
        mintAddress,
        position.amount,
        CONFIG.slippage
      );
      console.log(`   ✅ Sale successful!`);
      console.log(`   Signature: ${result.transaction.signature}`);
      console.log(`   SOL: ${result.transaction.solReceived.toFixed(4)}`);
      
      const finalPL = calculateProfitLoss(
        position.entryPrice,
        result.transaction.pricePerToken,
        position.amount
      );
      console.log(`   ${finalPL.isProfit ? '🎉' : '😢'} P&L: ${formatPercentage(finalPL.percentage)} (${formatUsd(finalPL.profit)})`);
    }
    
    // Remove from positions
    this.positions.delete(mintAddress);
    console.log(`   📊 Position closed.\n`);
  }

  stop() {
    console.log('\n🛑 Stopping bot...');
    this.isRunning = false;
  }
}

// Main
async function main() {
  const bot = new TradingBot();
  
  try {
    await bot.initialize();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      bot.stop();
      process.exit(0);
    });
    
    await bot.start();
    
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TradingBot;
