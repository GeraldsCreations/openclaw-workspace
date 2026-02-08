#!/usr/bin/env node

/**
 * Sell Token Script
 * Sell tokens on LaunchPad platform
 */

import LaunchPadAPIClient from '../lib/api-client.js';
import WalletManager from '../lib/wallet-manager.js';
import { validateTradeParams, printTransaction, printError, formatUsd } from '../lib/utils.js';

async function main() {
  const args = parseArgs();
  
  try {
    // Load wallet
    console.log('🔑 Loading wallet...');
    const walletManager = new WalletManager();
    await walletManager.loadWallet(args.wallet);
    const walletAddress = walletManager.getPublicKey();
    console.log(`✅ Wallet loaded: ${walletAddress}\n`);
    
    // Check token balance
    console.log('🪙  Checking token balance...');
    const tokenBalance = await walletManager.getTokenBalance(args.token);
    console.log(`Balance: ${tokenBalance.toLocaleString()} tokens\n`);
    
    if (tokenBalance === 0) {
      throw new Error('No tokens to sell. Balance is 0.');
    }
    
    // Determine amount to sell
    let sellAmount = args.amount;
    if (args.all) {
      sellAmount = tokenBalance;
      console.log(`📊 Selling ALL tokens: ${sellAmount.toLocaleString()}\n`);
    } else if (args.percent) {
      sellAmount = tokenBalance * (args.percent / 100);
      console.log(`📊 Selling ${args.percent}% of tokens: ${sellAmount.toLocaleString()}\n`);
    }
    
    if (sellAmount > tokenBalance) {
      throw new Error(`Insufficient balance. Trying to sell ${sellAmount}, have ${tokenBalance}`);
    }
    
    // Authenticate
    console.log('🔐 Authenticating with LaunchPad...');
    const apiClient = new LaunchPadAPIClient();
    
    const authMessage = walletManager.generateAuthMessage();
    const signed = walletManager.signMessage(authMessage);
    
    await apiClient.authenticateWallet(
      signed.publicKey,
      signed.signature,
      signed.message
    );
    console.log('✅ Authenticated\n');
    
    // Get quote first (unless --no-quote)
    if (!args.noQuote) {
      console.log('📊 Getting price quote...');
      const quote = await apiClient.getQuote(args.token, {
        amountTokens: sellAmount,
        slippage: args.slippage,
      });
      
      console.log('='.repeat(60));
      console.log('Quote Details:');
      console.log('='.repeat(60));
      console.log(`Input (Tokens):    ${sellAmount.toLocaleString()}`);
      console.log(`Output (SOL):      ${quote.quote.outputAmount.toFixed(4)}`);
      console.log(`Price per Token:   ${formatUsd(quote.quote.pricePerToken)}`);
      console.log(`Price Impact:      ${quote.quote.priceImpact.toFixed(2)}%`);
      console.log(`Fee:               ${formatUsd(quote.quote.fee)}`);
      console.log(`Min Output (SOL):  ${quote.quote.minOutputAmount.toFixed(4)}`);
      console.log('='.repeat(60) + '\n');
      
      // Warn about high price impact
      if (quote.quote.priceImpact > 5) {
        console.log('⚠️  WARNING: High price impact! Consider reducing amount.\n');
      }
      
      // Confirm if not auto-confirmed
      if (!args.yes) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        
        const answer = await new Promise((resolve) => {
          rl.question('Continue with sale? (yes/no): ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
          console.log('❌ Sale cancelled.');
          return;
        }
        console.log('');
      }
    }
    
    // Execute sell
    console.log('💸 Selling tokens...');
    console.log('⏳ This may take a few moments...\n');
    
    const result = await apiClient.sellToken(
      args.token,
      sellAmount,
      args.slippage
    );
    
    // Success!
    printTransaction(result.transaction, 'sell');
    
    console.log('🎉 Sale completed successfully!');
    console.log(`\n📊 View transaction: https://solscan.io/tx/${result.transaction.signature}`);
    
    // Show new balance
    if (!args.noBalance) {
      console.log('\n💰 Checking new balances...');
      const newSolBalance = await walletManager.getSolBalance();
      const newTokenBalance = await walletManager.getTokenBalance(args.token);
      
      console.log(`SOL Balance:   ${newSolBalance.toFixed(4)} SOL`);
      console.log(`Token Balance: ${newTokenBalance.toLocaleString()} tokens\n`);
    }
    
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    wallet: null,
    token: null,
    amount: null,
    all: false,
    percent: null,
    slippage: 0.5,
    yes: false,
    noQuote: false,
    noBalance: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '--wallet':
      case '-w':
        parsed.wallet = next;
        i++;
        break;
      case '--token':
      case '-t':
        parsed.token = next;
        i++;
        break;
      case '--amount':
      case '-a':
        parsed.amount = parseFloat(next);
        i++;
        break;
      case '--all':
        parsed.all = true;
        break;
      case '--percent':
      case '-p':
        parsed.percent = parseFloat(next);
        i++;
        break;
      case '--slippage':
      case '-s':
        parsed.slippage = parseFloat(next);
        i++;
        break;
      case '--yes':
      case '-y':
        parsed.yes = true;
        break;
      case '--no-quote':
        parsed.noQuote = true;
        break;
      case '--no-balance':
        parsed.noBalance = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  // Validate required args
  if (!parsed.wallet || !parsed.token) {
    console.error('❌ Error: Missing required arguments\n');
    printHelp();
    process.exit(1);
  }
  
  // Must specify amount, --all, or --percent
  if (!parsed.amount && !parsed.all && !parsed.percent) {
    console.error('❌ Error: Must specify --amount, --all, or --percent\n');
    printHelp();
    process.exit(1);
  }
  
  // Validate trade params if amount specified
  if (parsed.amount) {
    validateTradeParams(parsed.amount, parsed.slippage);
  }
  
  return parsed;
}

function printHelp() {
  console.log(`
LaunchPad Token Seller

USAGE:
  node sell-token.js [options]

REQUIRED OPTIONS:
  -w, --wallet <name>              Wallet to use for sale
  -t, --token <mint-address>       Token mint address to sell

AMOUNT OPTIONS (choose one):
  -a, --amount <tokens>            Exact number of tokens to sell
  --all                            Sell entire balance
  -p, --percent <percent>          Sell percentage of balance (e.g., 50)

OPTIONAL:
  -s, --slippage <percent>         Slippage tolerance (default: 0.5)
  -y, --yes                        Skip confirmation prompt
  --no-quote                       Skip price quote display
  --no-balance                     Don't show balance after sale

EXAMPLES:
  # Sell specific amount
  node sell-token.js \\
    --wallet my-wallet \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --amount 1000
  
  # Sell all tokens
  node sell-token.js \\
    --wallet my-wallet \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --all
  
  # Sell 50% of holdings
  node sell-token.js \\
    --wallet my-wallet \\
    --token MINT \\
    --percent 50
  
  # Quick sell with auto-confirm
  node sell-token.js -w my-wallet -t MINT --all -y

NOTES:
  - Wallet must hold tokens to sell
  - Higher slippage = more likely to succeed but worse price
  - Check quote before large sales
  - Transactions are irreversible
  `);
}

main();
