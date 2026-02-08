#!/usr/bin/env node

/**
 * Buy Token Script
 * Purchase tokens on LaunchPad platform
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
    
    // Check balance
    console.log('💰 Checking SOL balance...');
    const balance = await walletManager.getSolBalance();
    console.log(`Balance: ${balance.toFixed(4)} SOL\n`);
    
    if (balance < args.amount) {
      throw new Error(`Insufficient balance. Need ${args.amount} SOL, have ${balance.toFixed(4)} SOL`);
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
        amountSol: args.amount,
        slippage: args.slippage,
      });
      
      console.log('='.repeat(60));
      console.log('Quote Details:');
      console.log('='.repeat(60));
      console.log(`Input (SOL):       ${args.amount.toFixed(4)}`);
      console.log(`Output (Tokens):   ${quote.quote.outputAmount.toLocaleString()}`);
      console.log(`Price per Token:   ${formatUsd(quote.quote.pricePerToken)}`);
      console.log(`Price Impact:      ${quote.quote.priceImpact.toFixed(2)}%`);
      console.log(`Fee:               ${formatUsd(quote.quote.fee)}`);
      console.log(`Min Output:        ${quote.quote.minOutputAmount.toLocaleString()}`);
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
          rl.question('Continue with purchase? (yes/no): ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
          console.log('❌ Purchase cancelled.');
          return;
        }
        console.log('');
      }
    }
    
    // Execute buy
    console.log('🛒 Purchasing tokens...');
    console.log('⏳ This may take a few moments...\n');
    
    const result = await apiClient.buyToken(
      args.token,
      args.amount,
      args.slippage
    );
    
    // Success!
    printTransaction(result.transaction, 'buy');
    
    console.log('🎉 Purchase completed successfully!');
    console.log(`\n📊 View transaction: https://solscan.io/tx/${result.transaction.signature}`);
    
    // Show new balance
    if (!args.noBalance) {
      console.log('\n💰 Checking new balances...');
      const newSolBalance = await walletManager.getSolBalance();
      const tokenBalance = await walletManager.getTokenBalance(args.token);
      
      console.log(`SOL Balance:   ${newSolBalance.toFixed(4)} SOL`);
      console.log(`Token Balance: ${tokenBalance.toLocaleString()} tokens\n`);
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
  if (!parsed.wallet || !parsed.token || !parsed.amount) {
    console.error('❌ Error: Missing required arguments\n');
    printHelp();
    process.exit(1);
  }
  
  // Validate trade params
  validateTradeParams(parsed.amount, parsed.slippage);
  
  return parsed;
}

function printHelp() {
  console.log(`
LaunchPad Token Buyer

USAGE:
  node buy-token.js [options]

REQUIRED OPTIONS:
  -w, --wallet <name>              Wallet to use for purchase
  -t, --token <mint-address>       Token mint address to buy
  -a, --amount <sol>               Amount of SOL to spend

OPTIONAL:
  -s, --slippage <percent>         Slippage tolerance (default: 0.5)
  -y, --yes                        Skip confirmation prompt
  --no-quote                       Skip price quote display
  --no-balance                     Don't show balance after purchase

EXAMPLES:
  # Buy with 1 SOL
  node buy-token.js \\
    --wallet my-wallet \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --amount 1.0
  
  # Buy with custom slippage
  node buy-token.js \\
    --wallet my-wallet \\
    --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \\
    --amount 0.5 \\
    --slippage 1.0
  
  # Auto-confirm purchase
  node buy-token.js -w my-wallet -t MINT -a 0.1 -y

NOTES:
  - Wallet must have sufficient SOL for amount + fees
  - Higher slippage = more likely to succeed but worse price
  - Check quote before large purchases
  - Transactions are irreversible
  `);
}

main();
