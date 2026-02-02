#!/usr/bin/env node

/**
 * Bot Rewards Management
 * Check and claim rewards from tokens created on the platform
 */

const axios = require('axios');
const { loadWallet } = require('./wallet');
const { config } = require('./config');

// Configuration
const API_URL = config.apiUrl;
const BOT_ID = config.agentId;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(`💰 Bot Rewards - Agent: ${BOT_ID} | API: ${API_URL}`);

/**
 * Get bot rewards
 */
async function getRewards(botId = BOT_ID) {
  console.log('💰 Checking bot rewards...');
  console.log('   Bot ID:', botId);
  
  try {
    const response = await api.get(`/rewards/${botId}`);
    const data = response.data.data;
    
    console.log('');
    console.log('✅ Rewards Summary:');
    console.log('   Total Earned:    ', data.totalEarned.toFixed(4), 'SOL');
    console.log('   Claimed:         ', data.claimed.toFixed(4), 'SOL');
    console.log('   Unclaimed:       ', data.unclaimed.toFixed(4), 'SOL 💎');
    console.log('   Token Count:     ', data.poolCount);
    
    if (data.rewards.length > 0) {
      console.log('');
      console.log('📊 Breakdown by Token:');
      data.rewards.forEach((reward, i) => {
        console.log(`\n   ${i + 1}. Pool: ${reward.poolAddress.slice(0, 8)}...`);
        console.log(`      Token:     ${reward.tokenAddress.slice(0, 8)}...`);
        console.log(`      Earned:    ${reward.totalFeesEarned.toFixed(4)} SOL`);
        console.log(`      Claimed:   ${reward.claimedAmount.toFixed(4)} SOL`);
        console.log(`      Unclaimed: ${reward.unclaimedAmount.toFixed(4)} SOL`);
        console.log(`      Share:     ${reward.revenueSharePercent}%`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to get rewards:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Claim bot rewards
 */
async function claimRewards(botId = BOT_ID) {
  const wallet = loadWallet();
  const botWallet = wallet.publicKey.toBase58();
  
  console.log('💸 Claiming bot rewards...');
  console.log('   Bot ID:', botId);
  console.log('   Wallet:', botWallet);
  
  try {
    const response = await api.post(`/rewards/${botId}/claim`, {
      botWallet,
    });
    
    const result = response.data.data;
    
    console.log('');
    console.log('✅ Claim successful!');
    console.log('   Amount:    ', result.amount.toFixed(4), 'SOL');
    console.log('   Message:   ', result.message);
    console.log('');
    console.log('💰 SOL has been transferred to your wallet!');
    console.log(`🔍 Wallet: ${botWallet}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to claim rewards:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get leaderboard
 */
async function getLeaderboard(limit = 10) {
  console.log('🏆 Fetching bot leaderboard...');
  
  try {
    const response = await api.get('/rewards/leaderboard/top', {
      params: { limit },
    });
    
    const leaderboard = response.data.data;
    
    console.log('');
    console.log(`🏆 Top ${leaderboard.length} Earning Bots:\n`);
    
    leaderboard.forEach((bot, i) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      console.log(`${emoji} Bot: ${bot.botId}`);
      console.log(`   Total Earned: ${bot.totalEarned.toFixed(4)} SOL`);
      console.log(`   Token Count:  ${bot.poolCount}`);
      console.log(`   Wallet:       ${bot.botWallet.slice(0, 12)}...`);
      console.log('');
    });
    
    return leaderboard;
  } catch (error) {
    console.error('❌ Failed to get leaderboard:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get platform stats
 */
async function getPlatformStats() {
  console.log('📊 Fetching platform statistics...');
  
  try {
    const response = await api.get('/rewards/stats/platform');
    const stats = response.data.data;
    
    console.log('');
    console.log('📊 Platform Stats:');
    console.log('   Total Fees Collected:  ', stats.totalFeesCollected.toFixed(4), 'SOL');
    console.log('   Total Vaults:          ', stats.totalVaults);
    console.log('   Bot Rewards (Total):   ', stats.totalBotRewards.toFixed(4), 'SOL');
    console.log('   Bot Rewards (Claimed): ', stats.totalClaimed.toFixed(4), 'SOL');
    console.log('   Bot Rewards (Pending): ', stats.totalUnclaimed.toFixed(4), 'SOL');
    console.log('');
    console.log('💡 Platform keeps 50%, bots earn 50% of trading fees');
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get platform stats:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Trigger manual fee collection (admin)
 */
async function collectFees() {
  console.log('⚙️  Triggering manual fee collection...');
  
  try {
    const response = await api.post('/rewards/collect');
    const result = response.data.data;
    
    console.log('');
    console.log('✅ Fee collection completed!');
    console.log('   Vaults Processed:', result.poolsProcessed);
    console.log('   Vaults Collected:', result.collected);
    console.log('   Total Amount:    ', result.totalAmount.toFixed(4), 'SOL');
    
    return result;
  } catch (error) {
    console.error('❌ Failed to collect fees:', error.response?.data || error.message);
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
      case 'check':
      case 'balance':
        await getRewards(args[1] || BOT_ID);
        break;
        
      case 'claim':
        await claimRewards(args[1] || BOT_ID);
        break;
        
      case 'leaderboard':
      case 'top':
        await getLeaderboard(parseInt(args[1]) || 10);
        break;
        
      case 'stats':
      case 'platform':
        await getPlatformStats();
        break;
        
      case 'collect':
        await collectFees();
        break;
        
      default:
        console.log('LaunchPad Bot Rewards Management\n');
        console.log('Usage:');
        console.log('  rewards.js check [botId]     - Check bot rewards');
        console.log('  rewards.js claim [botId]     - Claim pending rewards');
        console.log('  rewards.js leaderboard [n]   - View top earning bots');
        console.log('  rewards.js stats             - View platform statistics');
        console.log('  rewards.js collect           - Trigger fee collection (admin)');
        console.log('');
        console.log('Environment:');
        console.log(`  OPENCLAW_AGENT_ID: ${BOT_ID}`);
        console.log(`  LAUNCHPAD_API_URL: ${API_URL}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  getRewards,
  claimRewards,
  getLeaderboard,
  getPlatformStats,
  collectFees,
};

// Run if called directly
if (require.main === module) {
  main();
}
