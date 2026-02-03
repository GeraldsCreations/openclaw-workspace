const { Connection, Keypair } = require('@solana/web3.js');
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3000/v1';

async function deployToken() {
  // Load the new wallet
  const walletData = JSON.parse(fs.readFileSync('/tmp/open-pump-wallet.json', 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));
  
  console.log('🚀 Deploying "Open Pump" Token...');
  console.log('Creator wallet:', wallet.publicKey.toString());
  console.log('');
  
  // Token parameters (correct schema)
  const tokenData = {
    name: 'Open Pump',
    symbol: 'OPUMP',
    description: 'The ultimate pump token for testing LaunchPad E2E flow',
    imageUrl: 'https://via.placeholder.com/400?text=OPUMP',
    creator: wallet.publicKey.toString(),
    creatorType: 'agent',
    initialBuy: 0.1 // Buy 0.1 SOL worth on creation
  };
  
  console.log('📝 Token Details:');
  console.log(JSON.stringify(tokenData, null, 2));
  console.log('');
  
  try {
    // Create token via API
    console.log('📡 Calling API to create token...');
    const response = await axios.post(`${API_URL}/tokens/create`, tokenData, {
      timeout: 60000 // 60 second timeout
    });
    
    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.success || response.data.token) {
      const token = response.data.token || response.data;
      console.log('🎉 Token Created Successfully!');
      console.log('');
      console.log('Token Address:', token.address || token.mint);
      console.log('Token ID:', token.id);
      console.log('DBC Config:', token.dbcConfig || token.poolAddress);
      console.log('');
      
      // Save token info for later use
      fs.writeFileSync('/tmp/open-pump-token.json', JSON.stringify(token, null, 2));
      console.log('💾 Token info saved to: /tmp/open-pump-token.json');
      
      console.log('');
      console.log('Next Steps:');
      console.log('1. ✅ Verify token in database');
      console.log('2. ✅ Check frontend listing');
      console.log('3. ✅ Test buy/sell from skill');
    } else {
      console.error('❌ Token creation failed:', response.data.error || response.data.message);
    }
  } catch (error) {
    console.error('❌ Error deploying token:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

deployToken().catch(console.error);
