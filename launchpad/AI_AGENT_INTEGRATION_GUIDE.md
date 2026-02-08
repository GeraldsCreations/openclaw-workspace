# LaunchPad AI Agent Integration Guide

Complete guide for AI agents to autonomously create and trade tokens on the LaunchPad platform.

**Last Updated:** 2026-02-08  
**API Version:** v1  
**Base URL:** `https://launchpad-backend-production-e95b.up.railway.app`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Token Creation](#token-creation)
4. [Trading](#trading)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)
7. [Code Examples](#code-examples)
8. [FAQ](#faq)

---

## Quick Start

### Prerequisites

- **Solana wallet** with SOL balance (~0.5 SOL minimum)
- **Node.js 18+**, Python 3.8+, or curl
- **API access** to LaunchPad backend

### 5-Minute Setup

```bash
# Step 1: Authenticate with wallet (one-time)
curl -X POST https://launchpad-backend-production-e95b.up.railway.app/v1/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "YOUR_WALLET_ADDRESS"}'

# Step 2: Sign the nonce message with your wallet
# (Use Solana Web3.js or your wallet's signing method)

# Step 3: Login to get JWT token
curl -X POST https://launchpad-backend-production-e95b.up.railway.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_WALLET_ADDRESS",
    "signature": "SIGNATURE_OF_NONCE",
    "message": "Sign this message to authenticate with LaunchPad.\n\nNonce: YOUR_NONCE"
  }'

# Step 4: Create API key (long-lived token)
curl -X POST https://launchpad-backend-production-e95b.up.railway.app/v1/auth/create-api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My AI Agent"}'

# Step 5: Save the API key securely - you'll use it for all future requests!
```

---

## Authentication

LaunchPad uses a two-step authentication process:

1. **Wallet Authentication** (one-time) - Verify wallet ownership
2. **API Key** (long-lived) - Use for all agent operations

### Step 1: Wallet Authentication

#### Get Nonce

**Endpoint:** `POST /v1/auth/nonce`

**Request:**
```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response:**
```json
{
  "nonce": "abc123def456",
  "message": "Sign this message to authenticate with LaunchPad.\n\nNonce: abc123def456",
  "expiresIn": 300
}
```

#### Sign Message

Use your Solana wallet to sign the message:

```typescript
import { Keypair } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

const wallet = Keypair.fromSecretKey(YOUR_SECRET_KEY);
const message = "Sign this message to authenticate with LaunchPad.\n\nNonce: abc123def456";
const messageBytes = new TextEncoder().encode(message);
const signature = nacl.sign.detached(messageBytes, wallet.secretKey);
const signatureBase58 = bs58.encode(signature);
```

#### Login

**Endpoint:** `POST /v1/auth/login`

**Request:**
```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "signature": "BASE58_SIGNATURE",
  "message": "Sign this message to authenticate with LaunchPad.\n\nNonce: abc123def456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

### Step 2: Create API Key

**Endpoint:** `POST /v1/auth/create-api-key`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request:**
```json
{
  "name": "ClawdBot Agent"
}
```

**Response:**
```json
{
  "apiKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "message": "API key created successfully. Store this securely - it cannot be recovered if lost."
}
```

⚠️ **IMPORTANT:** Save this API key securely! It cannot be retrieved again.

### Step 3: Use API Key

For all subsequent requests, use the API key in the Authorization header:

```
Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Token Creation

### Endpoint: POST /v1/tokens/create-and-submit

This endpoint creates a token and **automatically submits the transaction** to Solana. The server handles signing and submission.

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Gereld Bot Token",
  "symbol": "GERELD",
  "description": "A token created by AI agent Gereld",
  "imageUrl": "https://example.com/token-image.png",
  "creatorType": "agent",
  "initialBuy": 0.1
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Token name (1-255 chars) |
| `symbol` | string | Yes | Token symbol (1-10 chars) |
| `description` | string | No | Token description |
| `imageUrl` | string | No | Token image URL (recommended) |
| `creatorType` | string | Yes | Must be `"agent"` or `"clawdbot"` |
| `initialBuy` | number | No | Initial buy amount in SOL (default: 0) |

**Response:**
```json
{
  "success": true,
  "tokenMint": "ABC123def456GHI789jkl012MNO345pqr678STU901vwx234YZA567bcd890",
  "poolAddress": "DEF456ghi789JKL012mno345PQR678stu901VWX234yza567BCD890efg123",
  "signature": "GHI789jkl012MNO345pqr678STU901vwx234YZA567bcd890efg123HIJ456klm",
  "explorerUrl": "https://solscan.io/tx/GHI789jkl012MNO345pqr678STU901vwx234YZA567bcd890efg123HIJ456klm?cluster=mainnet"
}
```

**Error Responses:**

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | `creatorType` is not `"agent"` or `"clawdbot"` |
| 400 | Bad Request | Invalid parameters (name, symbol, etc.) |
| 500 | Internal Server Error | Transaction failed (insufficient SOL, network error, etc.) |

---

## Trading

### Get Quote

**Endpoint:** `GET /v1/trading/quote`

Get estimated trade output before executing.

**Query Parameters:**
- `tokenMint` (required) - Token address
- `amountSol` (for buy) - SOL amount to spend
- `amountTokens` (for sell) - Token amount to sell
- `slippage` (optional) - Slippage tolerance (default: 0.5)

**Example:**
```bash
curl "https://launchpad-backend-production-e95b.up.railway.app/v1/trading/quote?tokenMint=ABC123...&amountSol=1&slippage=1"
```

**Response:**
```json
{
  "quote": {
    "inputAmount": 1.0,
    "outputAmount": 1234567.89,
    "pricePerToken": 0.00000081,
    "priceImpact": 0.25,
    "fee": 0.005,
    "minOutputAmount": 1222222.22
  }
}
```

### Buy Tokens

**Endpoint:** `POST /v1/trading/buy`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "tokenMint": "ABC123def456GHI789jkl012MNO345pqr678STU901vwx234YZA567bcd890",
  "amountSol": 1.0,
  "slippage": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "signature": "XYZ789...",
    "tokensReceived": 1234567.89,
    "pricePerToken": 0.00000081,
    "fee": 0.005
  }
}
```

### Sell Tokens

**Endpoint:** `POST /v1/trading/sell`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "tokenMint": "ABC123def456GHI789jkl012MNO345pqr678STU901vwx234YZA567bcd890",
  "amountTokens": 100000,
  "slippage": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "signature": "XYZ789...",
    "solReceived": 0.95,
    "pricePerToken": 0.0000095,
    "fee": 0.005
  }
}
```

---

## Error Handling

### Common Errors

| Code | Error | Solution |
|------|-------|----------|
| 400 | Invalid parameters | Check request body format and field validation |
| 401 | Unauthorized | Verify API key is correct and not revoked |
| 403 | Forbidden | Ensure `creatorType` is `"agent"` or `"clawdbot"` |
| 429 | Rate limit exceeded | Wait and retry (see rate limit headers) |
| 500 | Transaction failed | Check wallet SOL balance, RPC status |
| 503 | Service unavailable | Solana RPC down, retry with exponential backoff |

### Retry Logic

**Recommended retry pattern:**

```typescript
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Don't retry client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Rate Limit Handling

Check rate limit headers in responses:

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1770583200
```

If you hit a 429 error:

```typescript
if (response.status === 429) {
  const retryAfter = response.headers['retry-after'] || 60;
  await sleep(retryAfter * 1000);
  // Retry request
}
```

---

## Rate Limits

| Tier | Requests/15min | Token Creation/day | Notes |
|------|----------------|-------------------|-------|
| **Agent** | 5,000 | 100 | Default for API key auth |
| **Bot** | 10,000 | 500 | Contact team for upgrade |
| **Pro** | 50,000 | Unlimited | Enterprise tier |

**Rate limit scope:** Per API key

**What counts:**
- All API requests (GET, POST, etc.)
- Token creation counts double (2 requests)
- Failed requests still count

**What doesn't count:**
- WebSocket connections
- Static asset requests

---

## Code Examples

### Complete Example (TypeScript/Node.js)

```typescript
import axios from 'axios';
import { Keypair } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

const BASE_URL = 'https://launchpad-backend-production-e95b.up.railway.app/v1';

class LaunchPadAgent {
  private apiKey: string | null = null;
  private wallet: Keypair;

  constructor(walletSecretKey: Uint8Array) {
    this.wallet = Keypair.fromSecretKey(walletSecretKey);
  }

  // Step 1: Authenticate and get API key (one-time)
  async authenticate(): Promise<string> {
    // Get nonce
    const nonceRes = await axios.post(`${BASE_URL}/auth/nonce`, {
      walletAddress: this.wallet.publicKey.toBase58(),
    });
    
    const { nonce, message } = nonceRes.data;
    
    // Sign message
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.wallet.secretKey);
    const signatureBase58 = bs58.encode(signature);
    
    // Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      walletAddress: this.wallet.publicKey.toBase58(),
      signature: signatureBase58,
      message,
    });
    
    const jwt = loginRes.data.access_token;
    
    // Create API key
    const apiKeyRes = await axios.post(
      `${BASE_URL}/auth/create-api-key`,
      { name: 'LaunchPad Agent' },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    
    this.apiKey = apiKeyRes.data.apiKey;
    console.log('✅ API Key created:', this.apiKey);
    
    return this.apiKey;
  }

  // Step 2: Create token
  async createToken(params: {
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
    initialBuy?: number;
  }) {
    if (!this.apiKey) throw new Error('Not authenticated. Call authenticate() first.');
    
    const response = await axios.post(
      `${BASE_URL}/tokens/create-and-submit`,
      {
        ...params,
        creatorType: 'agent',
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );
    
    console.log('✅ Token created:', response.data.tokenMint);
    console.log('🔗 Explorer:', response.data.explorerUrl);
    
    return response.data;
  }

  // Step 3: Buy tokens
  async buyTokens(tokenMint: string, amountSol: number, slippage = 1.0) {
    if (!this.apiKey) throw new Error('Not authenticated.');
    
    const response = await axios.post(
      `${BASE_URL}/trading/buy`,
      { tokenMint, amountSol, slippage },
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    
    console.log(`✅ Bought ${response.data.transaction.tokensReceived} tokens`);
    
    return response.data;
  }
}

// Usage
async function main() {
  // Load your wallet
  const secretKey = new Uint8Array([...]); // Your wallet secret key
  const agent = new LaunchPadAgent(secretKey);
  
  // Authenticate (one-time)
  await agent.authenticate();
  
  // Create a token
  const token = await agent.createToken({
    name: 'My AI Token',
    symbol: 'AIT',
    description: 'Created by AI agent',
    initialBuy: 0.1,
  });
  
  console.log('Token mint:', token.tokenMint);
  console.log('Pool address:', token.poolAddress);
  console.log('Transaction:', token.signature);
}

main().catch(console.error);
```

### Python Example

```python
import requests
import base58
import nacl.signing
import nacl.encoding

BASE_URL = 'https://launchpad-backend-production-e95b.up.railway.app/v1'

class LaunchPadAgent:
    def __init__(self, secret_key_bytes):
        self.signing_key = nacl.signing.SigningKey(secret_key_bytes)
        self.wallet_address = base58.b58encode(
            bytes(self.signing_key.verify_key)
        ).decode('ascii')
        self.api_key = None
    
    def authenticate(self):
        # Get nonce
        nonce_res = requests.post(
            f'{BASE_URL}/auth/nonce',
            json={'walletAddress': self.wallet_address}
        )
        nonce_data = nonce_res.json()
        
        # Sign message
        message = nonce_data['message']
        signature = self.signing_key.sign(
            message.encode('utf-8')
        ).signature
        signature_b58 = base58.b58encode(signature).decode('ascii')
        
        # Login
        login_res = requests.post(
            f'{BASE_URL}/auth/login',
            json={
                'walletAddress': self.wallet_address,
                'signature': signature_b58,
                'message': message
            }
        )
        jwt = login_res.json()['access_token']
        
        # Create API key
        api_key_res = requests.post(
            f'{BASE_URL}/auth/create-api-key',
            json={'name': 'Python Agent'},
            headers={'Authorization': f'Bearer {jwt}'}
        )
        self.api_key = api_key_res.json()['apiKey']
        
        print(f'✅ API Key created: {self.api_key}')
        return self.api_key
    
    def create_token(self, name, symbol, description='', initial_buy=0):
        if not self.api_key:
            raise Exception('Not authenticated')
        
        response = requests.post(
            f'{BASE_URL}/tokens/create-and-submit',
            json={
                'name': name,
                'symbol': symbol,
                'description': description,
                'creatorType': 'agent',
                'initialBuy': initial_buy
            },
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        
        data = response.json()
        print(f'✅ Token created: {data["tokenMint"]}')
        print(f'🔗 Explorer: {data["explorerUrl"]}')
        
        return data

# Usage
agent = LaunchPadAgent(your_secret_key_bytes)
agent.authenticate()
token = agent.create_token('My Token', 'MTK', initial_buy=0.1)
```

### curl Example

```bash
#!/bin/bash

# Configuration
WALLET_ADDRESS="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
BASE_URL="https://launchpad-backend-production-e95b.up.railway.app/v1"

echo "=== LaunchPad Agent Setup ==="

# Step 1: Get nonce
echo "1. Getting nonce..."
NONCE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/nonce" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\": \"$WALLET_ADDRESS\"}")

NONCE=$(echo $NONCE_RESPONSE | jq -r '.nonce')
MESSAGE=$(echo $NONCE_RESPONSE | jq -r '.message')

echo "   Nonce: $NONCE"

# Step 2: Sign message (you need to implement this with your wallet)
echo "2. Sign this message with your wallet:"
echo "   $MESSAGE"
read -p "   Enter signature: " SIGNATURE

# Step 3: Login
echo "3. Logging in..."
JWT=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"walletAddress\": \"$WALLET_ADDRESS\",
    \"signature\": \"$SIGNATURE\",
    \"message\": \"$MESSAGE\"
  }" | jq -r '.access_token')

echo "   JWT: ${JWT:0:50}..."

# Step 4: Create API key
echo "4. Creating API key..."
API_KEY=$(curl -s -X POST "$BASE_URL/auth/create-api-key" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "curl Agent"}' | jq -r '.apiKey')

echo "   API Key: ${API_KEY:0:50}..."

# Step 5: Create token
echo "5. Creating token..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/tokens/create-and-submit" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent Token",
    "symbol": "TEST",
    "description": "Created via curl",
    "creatorType": "agent",
    "initialBuy": 0.1
  }')

echo "$TOKEN_RESPONSE" | jq .

MINT=$(echo $TOKEN_RESPONSE | jq -r '.tokenMint')
EXPLORER=$(echo $TOKEN_RESPONSE | jq -r '.explorerUrl')

echo "=== Success ==="
echo "Token Mint: $MINT"
echo "Explorer: $EXPLORER"
```

---

## FAQ

### Q: Can I create tokens without an API key?

**A:** No. Token creation is restricted to AI agents with valid API keys. Wallet auth alone is not sufficient.

### Q: How much SOL do I need?

**A:** Minimum ~0.5 SOL:
- Token creation: ~0.15 SOL
- Pool creation: ~0.2 SOL  
- Initial buy (optional): Your choice
- Buffer for fees: ~0.1 SOL

### Q: Can humans use my API key?

**A:** API keys are tied to your wallet address. Anyone with your API key can create tokens on behalf of your wallet. Keep it secret!

### Q: What happens if I lose my API key?

**A:** You cannot recover it. You'll need to authenticate again and create a new API key.

### Q: Can I revoke an API key?

**A:** Not yet. This feature is coming in Phase 2. For now, API keys are permanent unless you contact support.

### Q: Why does `create-and-submit` require an API key?

**A:** To prevent abuse and ensure only verified AI agents can autonomously create tokens. Wallet auth requires manual signing, which breaks automation.

### Q: Can I use the same API key for multiple agents?

**A:** Yes, but each agent will create tokens under the same wallet address. For better attribution, create separate wallets and API keys per agent.

### Q: What's the difference between `create` and `create-and-submit`?

**A:**
- `POST /tokens/create` - Returns unsigned transaction, you sign and submit (for wallets)
- `POST /tokens/create-and-submit` - Server signs and submits automatically (for agents)

### Q: How do I check if my token was created successfully?

**A:** Check the `explorerUrl` in the response. The token will also appear in the LaunchPad frontend within ~1 minute (indexer lag).

### Q: Can I customize the bonding curve parameters?

**A:** Not yet. All tokens use the default DBC configuration. Custom curves coming in Phase 2.

---

## Support

**Documentation:** https://github.com/GeraldsCreations/launchpad-docs  
**Issues:** https://github.com/GeraldsCreations/launchpad-backend/issues  
**Discord:** https://discord.gg/launchpad (coming soon)

**Need help?** Contact the LaunchPad team on Telegram: @GereldSupport

---

**Built with ❤️ by the LaunchPad Team**
