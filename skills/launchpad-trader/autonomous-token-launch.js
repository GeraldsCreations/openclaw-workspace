#!/usr/bin/env node

/**
 * Autonomous Token Launcher
 * Creates real Solana SPL token + stores in database
 * No human intervention required
 */

const { 
  Connection, 
  Keypair, 
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');

const RPC_URL = 'https://api.devnet.solana.com';
const API_URL = 'http://localhost:3000/v1';

/**
 * Deploy a real SPL token on Solana
 */
async function deployToken(params) {
  const {
    name,
    symbol,
    description,
    imageUrl,
    creatorWallet, // Keypair
    initialSupply = 1_000_000_000, // 1 billion tokens
    decimals = 9
  } = params;

  console.log('🚀 Deploying SPL Token on Solana...');
  console.log('=====================================');
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Creator: ${creatorWallet.publicKey.toString()}`);
  console.log(`Initial Supply: ${initialSupply.toLocaleString()}`);
  console.log('');

  const connection = new Connection(RPC_URL, 'confirmed');

  try {
    // 1. Create SPL token mint
    console.log('📝 Step 1: Creating SPL token mint...');
    const mint = await createMint(
      connection,
      creatorWallet, // Payer
      creatorWallet.publicKey, // Mint authority
      creatorWallet.publicKey, // Freeze authority
      decimals,
      undefined, // Mint keypair (auto-generated)
      { commitment: 'confirmed' },
      TOKEN_PROGRAM_ID
    );
    
    console.log('✅ Token mint created:', mint.toBase58());
    console.log(`   Explorer: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet\n`);

    // 2. Create token account for creator
    console.log('📝 Step 2: Creating creator token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      creatorWallet,
      mint,
      creatorWallet.publicKey,
      false,
      'confirmed'
    );
    
    console.log('✅ Token account created:', tokenAccount.address.toBase58());
    console.log('');

    // 3. Mint initial supply to creator
    console.log('📝 Step 3: Minting initial supply...');
    const mintSignature = await mintTo(
      connection,
      creatorWallet,
      mint,
      tokenAccount.address,
      creatorWallet.publicKey, // Mint authority
      initialSupply * Math.pow(10, decimals), // Amount in smallest units
      [],
      { commitment: 'confirmed' }
    );
    
    console.log('✅ Minted initial supply!');
    console.log(`   Signature: ${mintSignature}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${mintSignature}?cluster=devnet\n`);

    return {
      mint: mint.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      mintSignature
    };

  } catch (error) {
    console.error('❌ Token deployment failed:', error.message);
    throw error;
  }
}

/**
 * Store token in database via API
 */
async function storeTokenInDatabase(params) {
  const {
    name,
    symbol,
    description,
    imageUrl,
    creator,
    mint,
    bondingCurve = mint // Use mint as bonding curve for now
  } = params;

  console.log('💾 Storing token in database...');

  try {
    const response = await axios.post(`${API_URL}/tokens/create`, {
      name,
      symbol,
      description,
      imageUrl,
      creator,
      creatorType: 'agent',
      initialBuy: 0
    });

    // Update with real addresses
    // TODO: Add proper endpoint to update token addresses
    console.log('✅ Token stored in database!');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    console.log('');

    return response.data;
  } catch (error) {
    console.error('❌ Database storage failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Test buy operation
 */
async function testBuy(params) {
  const { tokenMint, buyerWallet, amount } = params;

  console.log('🛒 Testing BUY operation...');
  console.log(`   Token: ${tokenMint}`);
  console.log(`   Amount: ${amount} SOL`);
  console.log('');

  // For now, just log - actual trading needs bonding curve implementation
  console.log('⚠️  Trading requires bonding curve - coming next!');
  console.log('');
}

/**
 * Test sell operation
 */
async function testSell(params) {
  const { tokenMint, sellerWallet, amount } = params;

  console.log('💰 Testing SELL operation...');
  console.log(`   Token: ${tokenMint}`);
  console.log(`   Amount: ${amount} tokens`);
  console.log('');

  // For now, just log - actual trading needs bonding curve implementation
  console.log('⚠️  Trading requires bonding curve - coming next!');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('     🍆 AUTONOMOUS TOKEN LAUNCHER 🍆');
  console.log('═══════════════════════════════════════════════════\n');

  // Load creator wallet
  const walletData = JSON.parse(fs.readFileSync('/tmp/open-pump-wallet.json', 'utf8'));
  const creatorWallet = Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));

  console.log('👤 Creator Wallet:', creatorWallet.publicKey.toString());
  console.log('');

  // Token parameters
  const tokenParams = {
    name: 'Open Pump',
    symbol: 'OPUMP',
    description: 'The ultimate pump token for testing LaunchPad E2E flow - deployed autonomously!',
    imageUrl: 'https://via.placeholder.com/400?text=OPUMP',
    creatorWallet,
    initialSupply: 1_000_000_000,
    decimals: 9
  };

  try {
    // Step 1: Deploy token on-chain
    console.log('═══ PHASE 1: ON-CHAIN DEPLOYMENT ═══\n');
    const deployment = await deployToken(tokenParams);
    
    console.log('🎉 Deployment Complete!');
    console.log('   Mint Address:', deployment.mint);
    console.log('   Token Account:', deployment.tokenAccount);
    console.log('');

    // Save deployment info
    fs.writeFileSync('/tmp/opump-deployment.json', JSON.stringify({
      ...deployment,
      creator: creatorWallet.publicKey.toString(),
      timestamp: new Date().toISOString()
    }, null, 2));

    // Step 2: Store in database
    console.log('═══ PHASE 2: DATABASE STORAGE ═══\n');
    const dbToken = await storeTokenInDatabase({
      name: tokenParams.name,
      symbol: tokenParams.symbol,
      description: tokenParams.description,
      imageUrl: tokenParams.imageUrl,
      creator: creatorWallet.publicKey.toString(),
      mint: deployment.mint,
      bondingCurve: deployment.mint
    });

    // Step 3: Test trading (placeholder)
    console.log('═══ PHASE 3: TRADING TEST ═══\n');
    await testBuy({
      tokenMint: deployment.mint,
      buyerWallet: creatorWallet,
      amount: 0.1
    });

    await testSell({
      tokenMint: deployment.mint,
      sellerWallet: creatorWallet,
      amount: 1000
    });

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('                  ✅ SUCCESS!');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Token Deployed:');
    console.log(`  Name: ${tokenParams.name}`);
    console.log(`  Symbol: ${tokenParams.symbol}`);
    console.log(`  Mint: ${deployment.mint}`);
    console.log(`  Creator: ${creatorWallet.publicKey.toString()}`);
    console.log('');
    console.log('✅ On-chain deployment: COMPLETE');
    console.log('✅ Database storage: COMPLETE');
    console.log('⏳ Trading (bonding curve): PENDING');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Verify token on frontend');
    console.log('2. Implement bonding curve trading');
    console.log('3. Test buy/sell from skill');
    console.log('');

  } catch (error) {
    console.error('\n❌ Autonomous launch failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { deployToken, storeTokenInDatabase, testBuy, testSell };
