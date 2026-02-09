#!/usr/bin/env node
// Deploy CHAD token using API key

const API_BASE = "https://launchpad-backend-production-e95b.up.railway.app/v1";
const API_KEY = "12be163746086e7e2d5069f6af4f5ae9075a4f8b1787245c1af4672ee52ab8fa";

async function createToken() {
  console.log('🚀 Creating CHAD token with API key authentication...\n');
  
  const tokenData = {
    name: "Chad",
    symbol: "CHAD", 
    description: "The ultimate chad token - for absolute legends 😎",
    imageUrl: "https://via.placeholder.com/800x800/FFD700/000000?text=CHAD",
    creator: "At6hSj5N2LwpHCNUDN8t4WiS2iCBr7KCasZUPnwxHJtq", // Required by DTO validation
    initialBuy: 0.01
  };
  
  console.log('Token Details:');
  console.log('  Name:', tokenData.name);
  console.log('  Symbol:', tokenData.symbol);
  console.log('  Description:', tokenData.description);
  console.log('  Initial Buy:', tokenData.initialBuy, 'SOL');
  console.log('');
  
  const res = await fetch(`${API_BASE}/tokens/create-and-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(tokenData)
  });
  
  if (!res.ok) {
    const error = await res.json();
    console.error('❌ Error:', error);
    throw new Error(JSON.stringify(error, null, 2));
  }
  
  return await res.json();
}

(async () => {
  try {
    const result = await createToken();
    
    console.log('✅ CHAD TOKEN DEPLOYED!\n');
    console.log('🎉 Token Mint:', result.tokenMint);
    console.log('🏊 Pool Address:', result.poolAddress);
    console.log('📝 Transaction:', result.signature);
    console.log('🔍 Explorer:', result.explorerUrl);
    console.log('\n🚀 CHAD is live on the blockchain!');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
})();
