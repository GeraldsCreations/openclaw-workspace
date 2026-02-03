#!/usr/bin/env node

/**
 * LaunchPad Trading Operations
 * Create, buy, sell tokens on LaunchPad platform
 */

const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const config = require('../lib/config');
const WalletManager = require('../lib/wallet-manager');

const program = new Command();

program
  .name('launchpad')
  .description('LaunchPad trading operations')
  .version('2.0.0');

/**
 * Get LaunchPad API client
 */
function getAPIClient() {
  const apiUrl = config.get('apiUrl');
  return axios.create({
    baseURL: apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Create token command
program
  .command('create <name> <symbol>')
  .description('Create a new token')
  .option('-d, --description <desc>', 'Token description')
  .option('-i, --image <url>', 'Token image URL')
  .action(async (name, symbol, options) => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const api = getAPIClient();
      
      console.log('');
      console.log(chalk.cyan('🚀 Creating token...'));
      console.log(chalk.gray('Name:'), name);
      console.log(chalk.gray('Symbol:'), symbol);
      if (options.description) console.log(chalk.gray('Description:'), options.description);
      if (options.image) console.log(chalk.gray('Image:'), options.image);
      console.log('');
      
      // Get creator wallet info
      const creatorWallet = await wallet.getAddress();
      const agentId = config.get('agentId');
      
      // Request token creation
      const response = await api.post('/tokens/create', {
        name,
        symbol,
        description: options.description || '',
        imageUrl: options.image || '',
        creatorWallet,
        creatorBotId: agentId,
      });
      
      const { transaction, tokenMint } = response.data;
      
      console.log(chalk.cyan('📝 Token details:'));
      console.log(chalk.gray('Mint:'), tokenMint);
      console.log('');
      
      // Decode and sign transaction
      console.log(chalk.cyan('✍️  Signing transaction...'));
      const txBuffer = Buffer.from(transaction, 'base64');
      const tx = require('@solana/web3.js').Transaction.from(txBuffer);
      
      // Sign and send
      const signature = await wallet.signAndSendTransaction(tx);
      
      console.log('');
      console.log(chalk.green('✅ Token created successfully!'));
      console.log(chalk.bold('Mint Address:'), tokenMint);
      console.log(chalk.gray('Transaction:'), signature);
      console.log('');
      console.log(chalk.yellow('💎 You earn 50% of trading fees from this token!'));
      console.log('');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Buy token command
program
  .command('buy <mint> <amount>')
  .description('Buy tokens with SOL')
  .option('-s, --slippage <percent>', 'Slippage tolerance (default: 5%)', '5')
  .option('-q, --quote', 'Get quote only, don\'t execute')
  .action(async (mint, amount, options) => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const api = getAPIClient();
      const amountSol = parseFloat(amount);
      
      if (isNaN(amountSol) || amountSol <= 0) {
        throw new Error('Invalid amount');
      }
      
      console.log('');
      console.log(chalk.cyan('💰 Buy Quote'));
      console.log(chalk.gray('Token:'), mint);
      console.log(chalk.gray('Amount:'), amountSol, 'SOL');
      console.log('');
      
      // Get quote
      const quoteResponse = await api.get('/trade/quote/buy', {
        params: {
          tokenMint: mint,
          solAmount: amountSol,
        },
      });
      
      const quote = quoteResponse.data;
      
      console.log(chalk.green('You will receive:'), quote.tokensOut, 'tokens');
      console.log(chalk.gray('Price per token:'), quote.pricePerToken, 'SOL');
      console.log(chalk.gray('Slippage:'), options.slippage + '%');
      console.log('');
      
      if (options.quote) {
        console.log(chalk.yellow('Quote only - no trade executed'));
        return;
      }
      
      // Execute trade
      console.log(chalk.cyan('Executing trade...'));
      
      const buyerWallet = await wallet.getAddress();
      
      const tradeResponse = await api.post('/trade/buy', {
        tokenMint: mint,
        solAmount: amountSol,
        buyerWallet,
        slippage: parseFloat(options.slippage),
      });
      
      const { transaction } = tradeResponse.data;
      
      // Sign and send
      const txBuffer = Buffer.from(transaction, 'base64');
      const tx = require('@solana/web3.js').Transaction.from(txBuffer);
      
      const signature = await wallet.signAndSendTransaction(tx);
      
      console.log('');
      console.log(chalk.green('✅ Purchase successful!'));
      console.log(chalk.bold('Tokens received:'), quote.tokensOut);
      console.log(chalk.gray('Transaction:'), signature);
      console.log('');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Sell token command
program
  .command('sell <mint> <amount>')
  .description('Sell tokens for SOL')
  .option('-s, --slippage <percent>', 'Slippage tolerance (default: 5%)', '5')
  .option('-q, --quote', 'Get quote only, don\'t execute')
  .option('-a, --all', 'Sell all tokens')
  .action(async (mint, amount, options) => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const api = getAPIClient();
      
      let tokenAmount;
      
      if (options.all) {
        // Get current balance
        const balance = await wallet.getTokenBalance(mint);
        tokenAmount = balance;
        console.log(chalk.cyan('Selling all tokens:'), tokenAmount);
      } else {
        tokenAmount = parseFloat(amount);
        if (isNaN(tokenAmount) || tokenAmount <= 0) {
          throw new Error('Invalid amount');
        }
      }
      
      console.log('');
      console.log(chalk.cyan('💸 Sell Quote'));
      console.log(chalk.gray('Token:'), mint);
      console.log(chalk.gray('Amount:'), tokenAmount, 'tokens');
      console.log('');
      
      // Get quote
      const quoteResponse = await api.get('/trade/quote/sell', {
        params: {
          tokenMint: mint,
          tokenAmount,
        },
      });
      
      const quote = quoteResponse.data;
      
      console.log(chalk.green('You will receive:'), quote.solOut, 'SOL');
      console.log(chalk.gray('Price per token:'), quote.pricePerToken, 'SOL');
      console.log(chalk.gray('Slippage:'), options.slippage + '%');
      console.log('');
      
      if (options.quote) {
        console.log(chalk.yellow('Quote only - no trade executed'));
        return;
      }
      
      // Execute trade
      console.log(chalk.cyan('Executing trade...'));
      
      const sellerWallet = await wallet.getAddress();
      
      const tradeResponse = await api.post('/trade/sell', {
        tokenMint: mint,
        tokenAmount,
        sellerWallet,
        slippage: parseFloat(options.slippage),
      });
      
      const { transaction } = tradeResponse.data;
      
      // Sign and send
      const txBuffer = Buffer.from(transaction, 'base64');
      const tx = require('@solana/web3.js').Transaction.from(txBuffer);
      
      const signature = await wallet.signAndSendTransaction(tx);
      
      console.log('');
      console.log(chalk.green('✅ Sale successful!'));
      console.log(chalk.bold('SOL received:'), quote.solOut);
      console.log(chalk.gray('Transaction:'), signature);
      console.log('');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Quote command (standalone)
program
  .command('quote <mint>')
  .description('Get buy/sell quotes')
  .option('-b, --buy <amount>', 'Quote for buying with X SOL')
  .option('-s, --sell <amount>', 'Quote for selling X tokens')
  .action(async (mint, options) => {
    try {
      const api = getAPIClient();
      
      console.log('');
      console.log(chalk.cyan('📊 Token Quotes'));
      console.log(chalk.gray('Token:'), mint);
      console.log('');
      
      if (options.buy) {
        const amount = parseFloat(options.buy);
        const response = await api.get('/trade/quote/buy', {
          params: { tokenMint: mint, solAmount: amount },
        });
        
        console.log(chalk.green('Buy Quote:'));
        console.log('  Spend:', amount, 'SOL');
        console.log('  Receive:', response.data.tokensOut, 'tokens');
        console.log('  Price:', response.data.pricePerToken, 'SOL/token');
        console.log('');
      }
      
      if (options.sell) {
        const amount = parseFloat(options.sell);
        const response = await api.get('/trade/quote/sell', {
          params: { tokenMint: mint, tokenAmount: amount },
        });
        
        console.log(chalk.green('Sell Quote:'));
        console.log('  Sell:', amount, 'tokens');
        console.log('  Receive:', response.data.solOut, 'SOL');
        console.log('  Price:', response.data.pricePerToken, 'SOL/token');
        console.log('');
      }
      
      if (!options.buy && !options.sell) {
        console.log(chalk.yellow('Specify --buy or --sell amount'));
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
