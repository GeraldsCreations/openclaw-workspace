#!/usr/bin/env node

/**
 * Wallet Operations CLI
 * Check balances, send SOL/tokens, view wallet info
 */

const { Command } = require('commander');
const chalk = require('chalk');
const config = require('../lib/config');
const WalletManager = require('../lib/wallet-manager');

const program = new Command();

program
  .name('wallet')
  .description('Wallet operations for LaunchPad Trader')
  .version('2.0.0');

// Balance command
program
  .command('balance')
  .description('Check SOL balance')
  .option('-a, --address <address>', 'Check balance for specific address')
  .action(async (options) => {
    try {
      const wallet = new WalletManager(config.getAll());
      
      if (options.address) {
        // Check external address
        const balance = await wallet.getBalance(options.address);
        console.log('');
        console.log(chalk.cyan('Address:'), options.address);
        console.log(chalk.green('Balance:'), balance, 'SOL');
      } else {
        // Check own wallet
        await wallet.initialize();
        const balance = await wallet.getBalance();
        console.log('');
        console.log(chalk.cyan('Your Wallet'));
        console.log(chalk.green('Balance:'), balance, 'SOL');
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Address command
program
  .command('address')
  .description('Show wallet address')
  .action(async () => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const address = await wallet.getAddress();
      
      console.log('');
      console.log(chalk.cyan('Your Wallet Address:'));
      console.log(chalk.bold(address));
      console.log('');
      
      // Show explorer link
      const network = config.get('network');
      const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
      console.log(chalk.gray('Explorer:'), `https://explorer.solana.com/address/${address}${cluster}`);
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Token balance command
program
  .command('token <mint>')
  .description('Check token balance')
  .option('-a, --address <address>', 'Check for specific wallet address')
  .action(async (mint, options) => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      console.log('');
      console.log(chalk.cyan('Checking token balance...'));
      console.log(chalk.gray('Mint:'), mint);
      
      const balance = await wallet.getTokenBalance(mint);
      
      console.log('');
      console.log(chalk.green('Balance:'), balance, 'tokens');
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// All tokens command
program
  .command('tokens')
  .alias('list')
  .description('List all token balances')
  .action(async () => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      console.log('');
      console.log(chalk.cyan('📦 Your Token Holdings'));
      console.log('');
      
      const balances = await wallet.getAllTokenBalances();
      
      if (balances.length === 0) {
        console.log(chalk.yellow('No tokens found'));
      } else {
        console.log(chalk.green(`Found ${balances.length} token(s) with balance`));
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Send SOL command
program
  .command('send-sol <to> <amount>')
  .description('Send SOL to an address')
  .action(async (to, amount) => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }
      
      console.log('');
      console.log(chalk.cyan('Sending SOL...'));
      console.log(chalk.gray('To:'), to);
      console.log(chalk.gray('Amount:'), amountNum, 'SOL');
      console.log('');
      
      const signature = await wallet.sendSol(to, amountNum);
      
      console.log('');
      console.log(chalk.green('✅ Transaction successful!'));
      console.log(chalk.gray('Signature:'), signature);
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Send tokens command
program
  .command('send-token <mint> <to> <amount>')
  .description('Send tokens to an address')
  .action(async (mint, to, amount) => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }
      
      console.log('');
      console.log(chalk.cyan('Sending tokens...'));
      console.log(chalk.gray('Mint:'), mint);
      console.log(chalk.gray('To:'), to);
      console.log(chalk.gray('Amount:'), amountNum);
      console.log('');
      
      const signature = await wallet.sendTokens(mint, to, amountNum);
      
      console.log('');
      console.log(chalk.green('✅ Transaction successful!'));
      console.log(chalk.gray('Signature:'), signature);
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .alias('status')
  .description('Show wallet information')
  .action(async () => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const info = await wallet.getWalletInfo();
      
      console.log('');
      console.log(chalk.bold.cyan('💼 Wallet Information'));
      console.log(chalk.gray('━'.repeat(60)));
      console.log('');
      console.log(chalk.cyan('Address:'), info.address);
      console.log(chalk.cyan('Provider:'), info.provider);
      console.log(chalk.cyan('Network:'), info.network);
      console.log(chalk.cyan('Balance:'), info.balance, 'SOL');
      
      if (info.walletId) {
        console.log(chalk.cyan('Wallet ID:'), info.walletId);
      }
      
      console.log('');
      console.log(chalk.gray('RPC:'), info.rpcUrl);
      console.log('');
      
      // Show explorer link
      const cluster = info.network === 'mainnet-beta' ? '' : `?cluster=${info.network}`;
      console.log(chalk.gray('Explorer:'), `https://explorer.solana.com/address/${info.address}${cluster}`);
      console.log('');
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .option('--show-secrets', 'Show sensitive values')
  .action((options) => {
    try {
      config.display(!options.showSecrets);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
