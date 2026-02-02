#!/usr/bin/env node

/**
 * LaunchPad API Integration
 * Create, buy, sell tokens on the platform
 */

const axios = require('axios');
const { loadWallet } = require('./wallet');

// Configuration
const API_URL = process.env.LAUNCHPAD_API_URL || 'http://localhost:3000/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create a new token
 */
async function createToken(name, symbol, description, imageUrl, initialBuySol = 0) {
  const wallet = loadWallet();
  
  console.log('🚀 Creating token on LaunchPad...');
  console.log('   Name:', name);
  console.log('   Symbol:', symbol);
  console.log('   Description:', description);
  console.log('   Creator:', wallet.publicKey.toBase58());
  
  try {
    const response = await api.post('/tokens/create', {
      name,
      symbol,
      description,
      imageUrl,
      creator: wallet.publicKey.toBase58(),
      creatorType: 'clawdbot',
      initialBuySol,
    });
    
    const token = response.data;
    
    console.log('✅ Token created successfully!');
    console.log('📍 Address:', token.address);
    console.log('🔗 Bonding Curve:', token.bondingCurve);
    console.log('💰 Initial Price:', token.currentPrice, 'SOL');
    console.log('📊 Market Cap:', token.marketCap, 'SOL');
    console.log('');
    console.log(`🔍 View on platform: http://localhost:4200/token/${token.address}`);
    
    return token;
  } catch (error) {
    console.error('❌ Failed to create token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get buy quote
 */
async function getBuyQuote(tokenAddress, amountSol) {
  console.log('💭 Getting buy quote...');
  console.log('   Token:', tokenAddress);
  console.log('   Amount:', amountSol, 'SOL');
  
  try {
    const response = await api.get('/trade/quote/buy', {
      params: {
        token: tokenAddress,
        amount: amountSol,
      },
    });
    
    const quote = response.data;
    
    console.log('✅ Quote:');
    console.log('   Input:', amountSol, 'SOL');
    console.log('   Output:', quote.outputAmount, 'tokens');
    console.log('   Price:', quote.price, 'SOL per token');
    console.log('   Fee:', quote.fee, 'SOL');
    console.log('   Price Impact:', (quote.priceImpact * 100).toFixed(2), '%');
    
    return quote;
  } catch (error) {
    console.error('❌ Failed to get quote:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get sell quote
 */
async function getSellQuote(tokenAddress, amountTokens) {
  console.log('💭 Getting sell quote...');
  console.log('   Token:', tokenAddress);
  console.log('   Amount:', amountTokens, 'tokens');
  
  try {
    const response = await api.get('/trade/quote/sell', {
      params: {
        token: tokenAddress,
        amount: amountTokens,
      },
    });
    
    const quote = response.data;
    
    console.log('✅ Quote:');
    console.log('   Input:', amountTokens, 'tokens');
    console.log('   Output:', quote.outputAmount, 'SOL');
    console.log('   Price:', quote.price, 'SOL per token');
    console.log('   Fee:', quote.fee, 'SOL');
    console.log('   Price Impact:', (quote.priceImpact * 100).toFixed(2), '%');
    
    return quote;
  } catch (error) {
    console.error('❌ Failed to get quote:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Buy tokens
 */
async function buyToken(tokenAddress, amountSol, slippage = 0.01) {
  const wallet = loadWallet();
  
  console.log('💸 Buying tokens...');
  console.log('   Token:', tokenAddress);
  console.log('   Amount:', amountSol, 'SOL');
  console.log('   Buyer:', wallet.publicKey.toBase58());
  console.log('   Slippage:', (slippage * 100).toFixed(1), '%');
  
  try {
    // Get quote first
    const quote = await getBuyQuote(tokenAddress, amountSol);
    const minTokensOut = quote.outputAmount * (1 - slippage);
    
    console.log('   Min tokens out:', minTokensOut.toFixed(2));
    console.log('');
    
    const response = await api.post('/trade/buy', {
      tokenAddress,
      buyer: wallet.publicKey.toBase58(),
      amountSol,
      minTokensOut,
    });
    
    const result = response.data;
    
    console.log('✅ Purchase successful!');
    console.log('🔗 Signature:', result.signature);
    console.log('📊 Tokens received:', result.trade.amountTokens);
    console.log('💰 Price:', result.trade.price, 'SOL');
    console.log('💸 Fee:', result.trade.fee, 'SOL');
    console.log(`🔍 Explorer: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to buy tokens:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sell tokens
 */
async function sellToken(tokenAddress, amountTokens, slippage = 0.01) {
  const wallet = loadWallet();
  
  console.log('💸 Selling tokens...');
  console.log('   Token:', tokenAddress);
  console.log('   Amount:', amountTokens, 'tokens');
  console.log('   Seller:', wallet.publicKey.toBase58());
  console.log('   Slippage:', (slippage * 100).toFixed(1), '%');
  
  try {
    // Get quote first
    const quote = await getSellQuote(tokenAddress, amountTokens);
    const minSolOut = quote.outputAmount * (1 - slippage);
    
    console.log('   Min SOL out:', minSolOut.toFixed(4));
    console.log('');
    
    const response = await api.post('/trade/sell', {
      tokenAddress,
      seller: wallet.publicKey.toBase58(),
      amountTokens,
      minSolOut,
    });
    
    const result = response.data;
    
    console.log('✅ Sale successful!');
    console.log('🔗 Signature:', result.signature);
    console.log('💰 SOL received:', result.trade.amountSol);
    console.log('📊 Price:', result.trade.price, 'SOL');
    console.log('💸 Fee:', result.trade.fee, 'SOL');
    console.log(`🔍 Explorer: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to sell tokens:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get token details
 */
async function getToken(tokenAddress) {
  try {
    const response = await api.get(`/tokens/${tokenAddress}`);
    const token = response.data;
    
    console.log('🪙 Token:', token.name, `(${token.symbol})`);
    console.log('📍 Address:', token.address);
    console.log('👤 Creator:', token.creator);
    console.log('💰 Price:', token.currentPrice, 'SOL');
    console.log('📊 Market Cap:', token.marketCap, 'SOL');
    console.log('📈 Volume (24h):', token.volume24h, 'SOL');
    console.log('👥 Holders:', token.holderCount);
    console.log('🎓 Graduated:', token.graduated ? 'Yes' : 'No');
    console.log('📅 Created:', new Date(token.createdAt).toLocaleString());
    
    if (token.description) {
      console.log('📝 Description:', token.description);
    }
    
    return token;
  } catch (error) {
    console.error('❌ Failed to get token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get trending tokens
 */
async function getTrending(limit = 10) {
  try {
    const response = await api.get('/tokens/trending', {
      params: { limit },
    });
    
    const tokens = response.data;
    
    console.log(`🔥 Top ${tokens.length} Trending Tokens:\n`);
    
    tokens.forEach((token, i) => {
      console.log(`${i + 1}. ${token.name} (${token.symbol})`);
      console.log(`   Price: ${token.currentPrice} SOL | MCap: ${token.marketCap} SOL`);
      console.log(`   Volume: ${token.volume24h} SOL | Holders: ${token.holderCount}`);
      console.log(`   Address: ${token.address}`);
      console.log('');
    });
    
    return tokens;
  } catch (error) {
    console.error('❌ Failed to get trending:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'create':
        if (!args[1] || !args[2]) {
          console.error('Usage: launchpad.js create <name> <symbol> [description] [imageUrl] [initialBuy]');
          process.exit(1);
        }
        await createToken(args[1], args[2], args[3], args[4], parseFloat(args[5]) || 0);
        break;
        
      case 'buy':
        if (!args[1] || !args[2]) {
          console.error('Usage: launchpad.js buy <token-address> <amount-sol> [slippage]');
          process.exit(1);
        }
        await buyToken(args[1], parseFloat(args[2]), parseFloat(args[3]) || 0.01);
        break;
        
      case 'sell':
        if (!args[1] || !args[2]) {
          console.error('Usage: launchpad.js sell <token-address> <amount-tokens> [slippage]');
          process.exit(1);
        }
        await sellToken(args[1], parseFloat(args[2]), parseFloat(args[3]) || 0.01);
        break;
        
      case 'quote-buy':
        if (!args[1] || !args[2]) {
          console.error('Usage: launchpad.js quote-buy <token-address> <amount-sol>');
          process.exit(1);
        }
        await getBuyQuote(args[1], parseFloat(args[2]));
        break;
        
      case 'quote-sell':
        if (!args[1] || !args[2]) {
          console.error('Usage: launchpad.js quote-sell <token-address> <amount-tokens>');
          process.exit(1);
        }
        await getSellQuote(args[1], parseFloat(args[2]));
        break;
        
      case 'token':
        if (!args[1]) {
          console.error('Usage: launchpad.js token <token-address>');
          process.exit(1);
        }
        await getToken(args[1]);
        break;
        
      case 'trending':
        await getTrending(parseInt(args[1]) || 10);
        break;
        
      default:
        console.log('Usage:');
        console.log('  launchpad.js create <name> <symbol> [desc] [img] [buy]');
        console.log('  launchpad.js buy <token> <amount-sol> [slippage]');
        console.log('  launchpad.js sell <token> <amount-tokens> [slippage]');
        console.log('  launchpad.js quote-buy <token> <amount-sol>');
        console.log('  launchpad.js quote-sell <token> <amount-tokens>');
        console.log('  launchpad.js token <token-address>');
        console.log('  launchpad.js trending [limit]');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  createToken,
  buyToken,
  sellToken,
  getBuyQuote,
  getSellQuote,
  getToken,
  getTrending,
};

// Run if called directly
if (require.main === module) {
  main();
}
