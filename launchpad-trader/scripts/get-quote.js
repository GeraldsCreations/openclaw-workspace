#!/usr/bin/env node

/**
 * Get Quote Script
 * Get price quotes for buying or selling tokens
 */

import LaunchPadAPIClient from '../lib/api-client.js';
import { formatUsd, printError } from '../lib/utils.js';

async function main() {
  const args = parseArgs();
  
  try {
    const apiClient = new LaunchPadAPIClient();
    
    console.log('📊 Fetching price quote...\n');
    
    const quote = await apiClient.getQuote(args.token, {
      amountSol: args.sol,
      amountTokens: args.tokens,
      slippage: args.slippage,
    });
    
    const isBuy = args.sol !== null;
    
    console.log('='.repeat(60));
    console.log(`${isBuy ? 'BUY' : 'SELL'} Quote`);
    console.log('='.repeat(60));
    console.log(`Token:             ${args.token}`);
    console.log('');
    
    if (isBuy) {
      console.log(`Input (SOL):       ${args.sol.toFixed(4)}`);
      console.log(`Output (Tokens):   ${quote.quote.outputAmount.toLocaleString()}`);
    } else {
      console.log(`Input (Tokens):    ${args.tokens.toLocaleString()}`);
      console.log(`Output (SOL):      ${quote.quote.outputAmount.toFixed(4)}`);
    }
    
    console.log('');
    console.log(`Price per Token:   ${formatUsd(quote.quote.pricePerToken)}`);
    console.log(`Price Impact:      ${quote.quote.priceImpact.toFixed(2)}%`);
    console.log(`Fee:               ${formatUsd(quote.quote.fee)}`);
    console.log(`Slippage:          ${args.slippage}%`);
    
    if (isBuy) {
      console.log(`Min Tokens:        ${quote.quote.minOutputAmount.toLocaleString()}`);
    } else {
      console.log(`Min SOL:           ${quote.quote.minOutputAmount.toFixed(4)}`);
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Price impact warnings
    if (quote.quote.priceImpact > 10) {
      console.log('🚨 VERY HIGH PRICE IMPACT! Consider reducing trade size.');
    } else if (quote.quote.priceImpact > 5) {
      console.log('⚠️  HIGH PRICE IMPACT! Trade will significantly move the price.');
    } else if (quote.quote.priceImpact > 2) {
      console.log('⚠️  Moderate price impact.');
    } else {
      console.log('✅ Low price impact - good trade size.');
    }
    
    console.log('');
    
    // Trading tips
    if (isBuy) {
      console.log('💡 To execute this trade:');
      console.log(`   node buy-token.js --wallet YOUR_WALLET --token ${args.token} --amount ${args.sol}`);
    } else {
      console.log('💡 To execute this trade:');
      console.log(`   node sell-token.js --wallet YOUR_WALLET --token ${args.token} --amount ${args.tokens}`);
    }
    
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    token: null,
    sol: null,
    tokens: null,
    slippage: 0.5,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '--token':
      case '-t':
        parsed.token = next;
        i++;
        break;
      case '--sol':
        parsed.sol = parseFloat(next);
        i++;
        break;
      case '--tokens':
        parsed.tokens = parseFloat(next);
        i++;
        break;
      case '--slippage':
      case '-s':
        parsed.slippage = parseFloat(next);
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  // Validate required args
  if (!parsed.token) {
    console.error('❌ Error: Token address required\n');
    printHelp();
    process.exit(1);
  }
  
  // Must specify either --sol or --tokens
  if (!parsed.sol && !parsed.tokens) {
    console.error('❌ Error: Must specify either --sol or --tokens\n');
    printHelp();
    process.exit(1);
  }
  
  if (parsed.sol && parsed.tokens) {
    console.error('❌ Error: Cannot specify both --sol and --tokens\n');
    printHelp();
    process.exit(1);
  }
  
  return parsed;
}

function printHelp() {
  console.log(`
LaunchPad Price Quote Tool

USAGE:
  node get-quote.js [options]

REQUIRED OPTIONS:
  -t, --token <mint-address>       Token mint address

AMOUNT OPTIONS (choose one):
  --sol <amount>                   Amount of SOL (for buy quote)
  --tokens <amount>                Amount of tokens (for sell quote)

OPTIONAL:
  -s, --slippage <percent>         Slippage tolerance (default: 0.5)

EXAMPLES:
  # Get buy quote (how many tokens for X SOL)
  node get-quote.js \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --sol 1.0
  
  # Get sell quote (how much SOL for X tokens)
  node get-quote.js \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --tokens 10000
  
  # Quote with custom slippage
  node get-quote.js -t MINT --sol 0.5 --slippage 1.0

NOTES:
  - Quotes are estimates and may vary at execution time
  - Higher slippage = wider acceptable price range
  - Price impact shows how much your trade moves the market
  - No wallet or authentication required for quotes
  `);
}

main();
