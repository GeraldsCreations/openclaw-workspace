#!/usr/bin/env node

/**
 * Bot Rewards Management
 * Check earnings, claim rewards, view leaderboard
 */

const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const config = require('../lib/config');
const WalletManager = require('../lib/wallet-manager');

const program = new Command();

program
  .name('rewards')
  .description('Bot rewards management')
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

/**
 * Format SOL amount
 */
function formatSOL(lamports) {
  return (lamports / 1e9).toFixed(6);
}

// Check rewards command
program
  .command('check')
  .alias('balance')
  .description('Check your bot earnings')
  .action(async () => {
    try {
      const api = getAPIClient();
      const agentId = config.get('agentId');
      
      console.log('');
      console.log(chalk.cyan('💎 Your Bot Earnings'));
      console.log(chalk.gray('Bot ID:'), agentId);
      console.log('');
      
      const response = await api.get(`/rewards/${agentId}`);
      const rewards = response.data;
      
      console.log(chalk.bold('Total Earnings:'), chalk.green(formatSOL(rewards.totalEarnings), 'SOL'));
      console.log(chalk.bold('Pending:'), chalk.yellow(formatSOL(rewards.pendingRewards), 'SOL'));
      console.log(chalk.bold('Claimed:'), chalk.gray(formatSOL(rewards.claimedRewards), 'SOL'));
      console.log('');
      
      if (rewards.tokens && rewards.tokens.length > 0) {
        console.log(chalk.cyan('Your Tokens:'));
        rewards.tokens.forEach((token, index) => {
          console.log(`  ${index + 1}. ${token.name} (${token.symbol})`);
          console.log(`     Mint: ${chalk.gray(token.mint)}`);
          console.log(`     Fees earned: ${chalk.green(formatSOL(token.feesEarned), 'SOL')}`);
          console.log('');
        });
      }
      
      if (rewards.pendingRewards > 10000000) { // 0.01 SOL minimum
        console.log(chalk.green('✅ You can claim your rewards!'));
        console.log(chalk.gray('Run:'), chalk.cyan('node scripts/rewards.js claim'));
      } else {
        console.log(chalk.yellow('⏳ Minimum claim amount: 0.01 SOL'));
      }
      console.log('');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Claim rewards command
program
  .command('claim')
  .description('Claim pending rewards')
  .action(async () => {
    try {
      const wallet = new WalletManager(config.getAll());
      await wallet.initialize();
      
      const api = getAPIClient();
      const agentId = config.get('agentId');
      
      console.log('');
      console.log(chalk.cyan('💰 Claiming Rewards'));
      console.log('');
      
      // Check pending first
      const checkResponse = await api.get(`/rewards/${agentId}`);
      const pending = checkResponse.data.pendingRewards;
      
      if (pending < 10000000) { // 0.01 SOL
        console.log(chalk.yellow('No rewards to claim (minimum: 0.01 SOL)'));
        console.log(chalk.gray('Current pending:'), formatSOL(pending), 'SOL');
        return;
      }
      
      console.log(chalk.gray('Pending:'), formatSOL(pending), 'SOL');
      console.log('');
      
      // Claim
      const claimResponse = await api.post(`/rewards/${agentId}/claim`, {
        recipientWallet: await wallet.getAddress(),
      });
      
      const { transaction, amount } = claimResponse.data;
      
      // Sign and send
      const txBuffer = Buffer.from(transaction, 'base64');
      const tx = require('@solana/web3.js').Transaction.from(txBuffer);
      
      const signature = await wallet.signAndSendTransaction(tx);
      
      console.log(chalk.green('✅ Rewards claimed!'));
      console.log(chalk.bold('Amount:'), formatSOL(amount), 'SOL');
      console.log(chalk.gray('Transaction:'), signature);
      console.log('');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Leaderboard command
program
  .command('leaderboard')
  .alias('top')
  .description('View top earning bots')
  .option('-l, --limit <number>', 'Number of bots to show', '10')
  .action(async (options) => {
    try {
      const api = getAPIClient();
      const limit = parseInt(options.limit);
      
      console.log('');
      console.log(chalk.cyan('🏆 Top Earning Bots'));
      console.log('');
      
      const response = await api.get('/rewards/leaderboard/top', {
        params: { limit },
      });
      
      const leaderboard = response.data;
      
      if (leaderboard.length === 0) {
        console.log(chalk.yellow('No bots have earned rewards yet'));
        return;
      }
      
      leaderboard.forEach((bot, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        console.log(`${medal} ${chalk.bold(bot.botId)}`);
        console.log(`   Total earnings: ${chalk.green(formatSOL(bot.totalEarnings), 'SOL')}`);
        console.log(`   Tokens created: ${chalk.gray(bot.tokensCreated)}`);
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// Platform stats command
program
  .command('stats')
  .description('View platform statistics')
  .action(async () => {
    try {
      const api = getAPIClient();
      
      console.log('');
      console.log(chalk.cyan('📊 Platform Statistics'));
      console.log('');
      
      const response = await api.get('/rewards/stats/platform');
      const stats = response.data;
      
      console.log(chalk.bold('Total Volume:'), chalk.green(formatSOL(stats.totalVolume), 'SOL'));
      console.log(chalk.bold('Total Fees Collected:'), chalk.green(formatSOL(stats.totalFees), 'SOL'));
      console.log(chalk.bold('Bot Rewards Paid:'), chalk.green(formatSOL(stats.botRewardsPaid), 'SOL'));
      console.log(chalk.bold('Platform Revenue:'), chalk.green(formatSOL(stats.platformRevenue), 'SOL'));
      console.log('');
      console.log(chalk.bold('Active Tokens:'), chalk.cyan(stats.activeTokens));
      console.log(chalk.bold('Active Bots:'), chalk.cyan(stats.activeBots));
      console.log(chalk.bold('Total Trades:'), chalk.cyan(stats.totalTrades));
      console.log('');
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('View your reward claim history')
  .option('-l, --limit <number>', 'Number of claims to show', '10')
  .action(async (options) => {
    try {
      const api = getAPIClient();
      const agentId = config.get('agentId');
      const limit = parseInt(options.limit);
      
      console.log('');
      console.log(chalk.cyan('📜 Reward Claim History'));
      console.log('');
      
      const response = await api.get(`/rewards/${agentId}/history`, {
        params: { limit },
      });
      
      const history = response.data;
      
      if (history.length === 0) {
        console.log(chalk.yellow('No claims yet'));
        return;
      }
      
      history.forEach((claim, index) => {
        const date = new Date(claim.claimedAt).toLocaleString();
        console.log(`${index + 1}. ${chalk.gray(date)}`);
        console.log(`   Amount: ${chalk.green(formatSOL(claim.amount), 'SOL')}`);
        console.log(`   Transaction: ${chalk.gray(claim.signature)}`);
        console.log('');
      });
      
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
