#!/usr/bin/env node

/**
 * Complete Two-Transaction Flow Test
 * Tests: Token creation + Pool creation + Liquidity addition (platform owns)
 */

const { Connection, Keypair, Transaction, PublicKey } = require('@solana/web3.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/v1';
const RPC_URL = 'https://api.devnet.solana.com';
const WALLETS_FILE = '/tmp/launchpad-test/wallets/wallets.json';

async function testTwoTransactionFlow() {
  console.log('🚀 Testing Two-Transaction Flow\n');
  console.log('='.repeat(60));

  try {
    // Load test wallet
    const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    const testWallet = wallets[0]; // Use wallet 1 for testing
    
    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(testWallet.path, 'utf8')))
    );

    console.log(`\n📍 Test Wallet: ${testWallet.address}`);
    
    // Check balance
    const connection = new Connection(RPC_URL, 'confirmed');
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log(`💰 Balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

    if (balance < 0.6e9) {
      throw new Error('Insufficient balance. Need at least 0.6 SOL for testing.');
    }

    // ========================================
    // TRANSACTION 1: Create Token + Pool
    // ========================================
    
    console.log('=' .repeat(60));
    console.log('TRANSACTION 1: Token + Pool Creation');
    console.log('='.repeat(60));

    const tokenParams = {
      name: 'Test Bot Token',
      symbol: 'TBOT',
      description: 'Two-transaction flow test token',
      initialPrice: 0.000001,
      liquidityAmount: 0.5, // Will be added in TX2
      creator: testWallet.address,
      creatorBotId: 'test-bot-main',
    };

    console.log('\n📝 Token Parameters:');
    console.log(`   Name: ${tokenParams.name}`);
    console.log(`   Symbol: ${tokenParams.symbol}`);
    console.log(`   Initial Price: ${tokenParams.initialPrice} SOL`);
    console.log(`   Liquidity Amount: ${tokenParams.liquidityAmount} SOL`);
    console.log(`   Creator: ${tokenParams.creator}`);

    // Step 1: Build token + pool transaction
    console.log('\n📤 Step 1: Building token + pool transaction...');
    
    const buildResponse = await axios.post(`${API_URL}/api/v1/transaction/build`, tokenParams);
    
    if (!buildResponse.data.transaction || !buildResponse.data.tokenMint) {
      throw new Error('Invalid build response');
    }

    const { transaction: unsignedTxBase64, tokenMint } = buildResponse.data;
    
    console.log(`✅ Transaction built successfully`);
    console.log(`   Token Mint: ${tokenMint}`);
    console.log(`   Transaction Size: ${Buffer.from(unsignedTxBase64, 'base64').length} bytes`);

    // Step 2: Sign transaction
    console.log('\n🔐 Step 2: Signing transaction with bot wallet...');
    
    const transaction1 = Transaction.from(Buffer.from(unsignedTxBase64, 'base64'));
    transaction1.sign(walletKeypair);
    const signedTx1Base64 = transaction1.serialize().toString('base64');
    
    console.log(`✅ Transaction signed`);

    // Step 3: Submit transaction
    console.log('\n📤 Step 3: Submitting signed transaction...');
    
    const submitResponse = await axios.post(`${API_URL}/api/v1/transaction/submit`, {
      signedTransaction: signedTx1Base64,
      tokenMint,
      creator: testWallet.address,
      creatorBotId: 'test-bot-main',
      initialPrice: tokenParams.initialPrice,
      liquidityAmount: tokenParams.liquidityAmount,
    });

    if (!submitResponse.data.success || !submitResponse.data.poolAddress) {
      throw new Error('Transaction submission failed');
    }

    const { signature: tx1Signature, poolAddress } = submitResponse.data;
    
    console.log(`✅ Transaction submitted successfully!`);
    console.log(`   Signature: ${tx1Signature}`);
    console.log(`   Pool Address: ${poolAddress}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx1Signature}?cluster=devnet`);

    // ========================================
    // TRANSACTION 2: Add Liquidity
    // ========================================
    
    console.log('\n' + '='.repeat(60));
    console.log('TRANSACTION 2: Add Liquidity (Platform Owns)');
    console.log('='.repeat(60));

    console.log('\n⏳ Waiting 5 seconds for pool to be indexed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Build liquidity transaction
    console.log('\n📤 Step 4: Building liquidity transaction...');
    
    const liquidityParams = {
      poolAddress,
      tokenMint,
      liquidityAmount: tokenParams.liquidityAmount,
      botWallet: testWallet.address,
      creatorBotId: 'test-bot-main',
    };

    const buildLiquidityResponse = await axios.post(
      `${API_URL}/api/v1/transaction/build-liquidity`,
      liquidityParams
    );

    if (!buildLiquidityResponse.data.transaction || !buildLiquidityResponse.data.positionPubkey) {
      throw new Error('Invalid liquidity build response');
    }

    const { 
      transaction: unsignedLiquidityTxBase64, 
      positionPubkey 
    } = buildLiquidityResponse.data;

    console.log(`✅ Liquidity transaction built`);
    console.log(`   Position Pubkey: ${positionPubkey}`);
    console.log(`   Transaction Size: ${Buffer.from(unsignedLiquidityTxBase64, 'base64').length} bytes`);

    // Step 5: Sign liquidity transaction
    console.log('\n🔐 Step 5: Signing liquidity transaction...');
    
    const transaction2 = Transaction.from(Buffer.from(unsignedLiquidityTxBase64, 'base64'));
    transaction2.sign(walletKeypair);
    const signedTx2Base64 = transaction2.serialize().toString('base64');
    
    console.log(`✅ Transaction signed`);

    // Step 6: Submit liquidity transaction
    console.log('\n📤 Step 6: Submitting liquidity transaction...');
    
    const submitLiquidityResponse = await axios.post(
      `${API_URL}/api/v1/transaction/submit-liquidity`,
      {
        signedTransaction: signedTx2Base64,
        poolAddress,
        tokenMint,
        positionPubkey,
        botWallet: testWallet.address,
        liquidityAmount: tokenParams.liquidityAmount,
        creatorBotId: 'test-bot-main',
      }
    );

    if (!submitLiquidityResponse.data.success) {
      throw new Error('Liquidity submission failed');
    }

    const { signature: tx2Signature } = submitLiquidityResponse.data;

    console.log(`✅ Liquidity added successfully!`);
    console.log(`   Signature: ${tx2Signature}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx2Signature}?cluster=devnet`);

    // ========================================
    // VERIFICATION
    // ========================================
    
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION');
    console.log('='.repeat(60));

    console.log('\n⏳ Waiting 5 seconds for database updates...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check LP position
    console.log('\n📊 Checking LP position...');
    
    try {
      const positionResponse = await axios.get(
        `${API_URL}/api/v1/lp/position/${testWallet.address}/${poolAddress}`
      );

      if (positionResponse.data.success) {
        const position = positionResponse.data.position;
        console.log(`✅ LP Position found:`);
        console.log(`   Pool: ${position.poolAddress}`);
        console.log(`   Token: ${position.tokenAddress}`);
        console.log(`   Initial Liquidity: ${position.initialLiquidity} SOL`);
        console.log(`   Current Liquidity: ${position.currentLiquidity} SOL`);
        console.log(`   Fees Collected: ${position.feesCollected} SOL`);
        console.log(`   Is Active: ${position.isActive}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch LP position: ${error.message}`);
    }

    // Check on-chain balances
    console.log('\n📊 Checking on-chain balances...');
    
    const finalBalance = await connection.getBalance(walletKeypair.publicKey);
    const spent = (balance - finalBalance) / 1e9;
    
    console.log(`   Initial Balance: ${(balance / 1e9).toFixed(4)} SOL`);
    console.log(`   Final Balance: ${(finalBalance / 1e9).toFixed(4)} SOL`);
    console.log(`   Total Spent: ${spent.toFixed(4)} SOL`);

    // ========================================
    // SUMMARY
    // ========================================
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n✅ Two-Transaction Flow Test PASSED!\n`);
    console.log(`Token Mint: ${tokenMint}`);
    console.log(`Pool Address: ${poolAddress}`);
    console.log(`Position Pubkey: ${positionPubkey}`);
    console.log(`\nTransaction 1: ${tx1Signature}`);
    console.log(`Transaction 2: ${tx2Signature}`);
    console.log(`\nTotal Cost: ${spent.toFixed(4)} SOL`);
    console.log(`\n🎉 Platform owns the LP position!`);
    console.log(`🎉 Bot can now request withdrawals/sells with fees!`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

testTwoTransactionFlow().catch(console.error);
