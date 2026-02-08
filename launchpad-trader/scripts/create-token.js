#!/usr/bin/env node

/**
 * Create Token Script
 * Deploy new tokens on LaunchPad platform
 */

import LaunchPadAPIClient from '../lib/api-client.js';
import WalletManager from '../lib/wallet-manager.js';
import { validateTokenParams, printError } from '../lib/utils.js';
import fs from 'fs/promises';

async function main() {
  const args = parseArgs();
  
  try {
    // Load wallet
    console.log('🔑 Loading wallet...');
    const walletManager = new WalletManager();
    await walletManager.loadWallet(args.wallet);
    console.log(`✅ Wallet loaded: ${walletManager.getPublicKey()}\n`);
    
    // Prepare token data
    const tokenData = {
      name: args.name,
      symbol: args.symbol,
      description: args.description,
      imageUrl: args.image,
      initialMarketCap: args.initialMcap || 10000,
      migrationMarketCap: args.migrationMcap || 100000,
      metadata: {
        website: args.website || '',
        twitter: args.twitter || '',
        telegram: args.telegram || '',
      },
    };
    
    // Validate parameters
    console.log('🔍 Validating token parameters...');
    validateTokenParams(tokenData);
    console.log('✅ Parameters valid\n');
    
    // Display token info
    console.log('📋 Token Details:');
    console.log('='.repeat(60));
    console.log(`Name:              ${tokenData.name}`);
    console.log(`Symbol:            ${tokenData.symbol}`);
    console.log(`Description:       ${tokenData.description}`);
    console.log(`Image:             ${tokenData.imageUrl}`);
    console.log(`Initial Mcap:      $${tokenData.initialMarketCap.toLocaleString()}`);
    console.log(`Migration Mcap:    $${tokenData.migrationMarketCap.toLocaleString()}`);
    if (tokenData.metadata.website) {
      console.log(`Website:           ${tokenData.metadata.website}`);
    }
    if (tokenData.metadata.twitter) {
      console.log(`Twitter:           ${tokenData.metadata.twitter}`);
    }
    if (tokenData.metadata.telegram) {
      console.log(`Telegram:          ${tokenData.metadata.telegram}`);
    }
    console.log('='.repeat(60) + '\n');
    
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
    
    // Create token
    console.log('🚀 Creating token on LaunchPad...');
    console.log('⏳ This may take a few moments...\n');
    
    const result = await apiClient.createToken(tokenData);
    
    // Success!
    console.log('='.repeat(60));
    console.log('✅ TOKEN CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`Mint Address: ${result.token.mintAddress}`);
    console.log(`Signature:    ${result.token.signature}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎉 Your token is now live on LaunchPad!');
    console.log('\n📊 Next steps:');
    console.log(`   • View on LaunchPad: https://launchpad.example.com/token/${result.token.mintAddress}`);
    console.log(`   • Start trading: node buy-token.js --wallet ${args.wallet} --token ${result.token.mintAddress}`);
    console.log('   • Share with your community!');
    
    // Save token info
    if (args.save) {
      await saveTokenInfo(tokenData, result.token);
    }
    
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

async function saveTokenInfo(tokenData, tokenResult) {
  const info = {
    ...tokenData,
    mintAddress: tokenResult.mintAddress,
    signature: tokenResult.signature,
    createdAt: new Date().toISOString(),
  };
  
  const filename = `token_${tokenData.symbol}_${Date.now()}.json`;
  await fs.writeFile(filename, JSON.stringify(info, null, 2));
  console.log(`\n💾 Token info saved to: ${filename}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    wallet: null,
    name: null,
    symbol: null,
    description: null,
    image: null,
    initialMcap: null,
    migrationMcap: null,
    website: null,
    twitter: null,
    telegram: null,
    save: false,
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
      case '--name':
      case '-n':
        parsed.name = next;
        i++;
        break;
      case '--symbol':
      case '-s':
        parsed.symbol = next;
        i++;
        break;
      case '--description':
      case '-d':
        parsed.description = next;
        i++;
        break;
      case '--image':
      case '-i':
        parsed.image = next;
        i++;
        break;
      case '--initial-mcap':
        parsed.initialMcap = parseFloat(next);
        i++;
        break;
      case '--migration-mcap':
        parsed.migrationMcap = parseFloat(next);
        i++;
        break;
      case '--website':
        parsed.website = next;
        i++;
        break;
      case '--twitter':
        parsed.twitter = next;
        i++;
        break;
      case '--telegram':
        parsed.telegram = next;
        i++;
        break;
      case '--save':
        parsed.save = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  // Validate required args
  if (!parsed.wallet || !parsed.name || !parsed.symbol || !parsed.description || !parsed.image) {
    console.error('❌ Error: Missing required arguments\n');
    printHelp();
    process.exit(1);
  }
  
  return parsed;
}

function printHelp() {
  console.log(`
LaunchPad Token Creator

USAGE:
  node create-token.js [options]

REQUIRED OPTIONS:
  -w, --wallet <name>              Wallet to use for creation
  -n, --name <name>                Token name
  -s, --symbol <symbol>            Token symbol (uppercase, max 10 chars)
  -d, --description <text>         Token description
  -i, --image <url>                Token image URL

OPTIONAL:
  --initial-mcap <amount>          Initial market cap (default: 10000)
  --migration-mcap <amount>        Migration market cap (default: 100000)
  --website <url>                  Project website
  --twitter <url>                  Twitter/X profile
  --telegram <url>                 Telegram group
  --save                           Save token info to JSON file

EXAMPLES:
  # Basic token creation
  node create-token.js \\
    --wallet my-wallet \\
    --name "My Token" \\
    --symbol "MTK" \\
    --description "The best token ever" \\
    --image "https://example.com/token.png"
  
  # With full metadata
  node create-token.js \\
    --wallet my-wallet \\
    --name "Super Coin" \\
    --symbol "SUPER" \\
    --description "Revolutionary DeFi token" \\
    --image "https://example.com/super.png" \\
    --initial-mcap 50000 \\
    --migration-mcap 500000 \\
    --website "https://supercoin.io" \\
    --twitter "https://x.com/supercoin" \\
    --save

NOTES:
  - Wallet must have sufficient SOL for transaction fees
  - Symbol must be uppercase and alphanumeric only
  - Image URL must be publicly accessible
  - Migration mcap must be greater than initial mcap
  `);
}

main();
