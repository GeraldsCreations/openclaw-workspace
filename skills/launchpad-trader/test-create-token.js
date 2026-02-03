#!/usr/bin/env node

/**
 * Test token creation via LaunchPad skill
 */

const axios = require('axios');
const { Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const { config } = require('./config');

const CREATOR_WALLET = '/tmp/launchpad-test/wallets/wallet1.json';
const API_URL = config.apiUrl;

async function createTestToken() {
  console.log('🚀 Creating Test Token on LaunchPad...\n');
  
  // Load creator wallet
  const keypairData = JSON.parse(fs.readFileSync(CREATOR_WALLET, 'utf8'));
  const creator = Keypair.fromSecretKey(new Uint8Array(keypairData));
  
  const creatorAddress = creator.publicKey.toBase58();
  console.log('👤 Creator Wallet:', creatorAddress);
  console.log('🤖 Bot ID:', config.agentId);
  console.log('');
  
  // Token details
  const tokenData = {
    name: 'Test Meme Coin',
    symbol: 'TEST',
    description: 'Integration test token for LaunchPad fee collection',
    initialPrice: 0.000001,
    initialLiquidity: 0.2, // 0.2 SOL initial liquidity (testing with limited SOL)
    creator: creatorAddress,
    creatorBotId: config.agentId,
    creatorBotWallet: creatorAddress,
    revenueSharePercent: 50,
  };
  
  console.log('📝 Token Details:');
  console.log(`   Name: ${tokenData.name}`);
  console.log(`   Symbol: ${tokenData.symbol}`);
  console.log(`   Initial Price: ${tokenData.initialPrice} SOL`);
  console.log(`   Initial Liquidity: ${tokenData.initialLiquidity} SOL`);
  console.log(`   Revenue Share: ${tokenData.revenueSharePercent}%`);
  console.log('');
  
  try {
    console.log('📤 Sending token creation request...');
    
    // Use Meteora API endpoint (now using funded platform wallet!)
    const response = await axios.post(`${API_URL}/api/v1/tokens/create`, tokenData);
    
    const result = response.data;
    
    console.log('✅ Token Created Successfully!\n');
    console.log('📍 Pool Address:', result.poolAddress);
    console.log('🪙 Token Address:', result.tokenAddress);
    console.log('💵 Launch Fee:', result.launchFee, 'SOL');
    console.log('🔗 Signature:', result.signature);
    console.log('');
    
    // Save token info for trading tests
    const tokenInfo = {
      poolAddress: result.poolAddress,
      tokenAddress: result.tokenAddress,
      creatorWallet: creatorAddress,
      creatorBotId: config.agentId,
      createdAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      '/tmp/launchpad-test/token-info.json',
      JSON.stringify(tokenInfo, null, 2)
    );
    
    console.log('📝 Token info saved to /tmp/launchpad-test/token-info.json');
    console.log('✅ Ready for trading tests!');
    
    return result;
    
  } catch (error) {
    console.error('❌ Token creation failed:', error.response?.data || error.message);
    throw error;
  }
}

createTestToken().catch(console.error);
