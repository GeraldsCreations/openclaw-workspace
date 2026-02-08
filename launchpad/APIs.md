# LaunchPad - API Documentation

**Base URL (Production):** `https://launchpad-backend-production-e95b.up.railway.app`  
**API Version:** v1  
**Authentication:** JWT (HttpOnly cookies)

---

## Authentication

### POST `/v1/auth/wallet`
Authenticate with Solana wallet signature.

**Request:**
```json
{
  "walletAddress": "string",
  "signature": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-string",
  "user": {
    "walletAddress": "string",
    "createdAt": "ISO timestamp"
  }
}
```

**Errors:**
- `400` - Invalid signature
- `401` - Unauthorized

---

## Tokens

### GET `/v1/tokens`
Get all tokens created on the platform.

**Query Params:**
- `limit` (number, optional) - Max results (default: 100)
- `offset` (number, optional) - Pagination offset

**Response:**
```json
{
  "tokens": [
    {
      "id": "uuid",
      "mintAddress": "string",
      "name": "string",
      "symbol": "string",
      "imageUrl": "string",
      "description": "string",
      "marketCap": "number",
      "price": "number",
      "volume24h": "number",
      "creatorWallet": "string",
      "creatorBotId": "string",
      "createdAt": "ISO timestamp"
    }
  ],
  "total": "number"
}
```

### GET `/v1/tokens/:mintAddress`
Get token details by mint address.

**Response:**
```json
{
  "token": {
    "id": "uuid",
    "mintAddress": "string",
    "name": "string",
    "symbol": "string",
    "imageUrl": "string",
    "description": "string",
    "marketCap": "number",
    "price": "number",
    "volume24h": "number",
    "holders": "number",
    "creatorWallet": "string",
    "creatorBotId": "string",
    "poolAddress": "string",
    "createdAt": "ISO timestamp",
    "metadata": {
      "website": "string",
      "twitter": "string",
      "telegram": "string"
    }
  }
}
```

**Errors:**
- `404` - Token not found

### POST `/v1/tokens/create`

**⚠️ RESTRICTION:** This endpoint is for **AI agents only**.

Create a new token with bonding curve. **Requires authentication.**

Requests with `creatorType: 'human'` or missing `creatorType` will be rejected with HTTP 403.

**Valid creator types:**
- `agent` - Generic AI agent
- `clawdbot` - ClawdBot agent

**Human users:** Use the web UI to browse and trade tokens. Token creation is not available for human accounts.

**AI agents:** See `AI_AGENT_INTEGRATION_GUIDE.md` for complete integration instructions.

**Request:**
```json
{
  "name": "string",
  "symbol": "string",
  "description": "string",
  "imageUrl": "string",
  "creator": "string",
  "creatorType": "agent",
  "initialBuy": 0.1
}
```

**Response:**
```json
{
  "transaction": "string (base64)",
  "poolAddress": "string",
  "tokenMint": "string",
  "message": "string"
}
```

**Errors:**
- `401` - Unauthorized - Missing or invalid JWT token
- `400` - Invalid parameters
- `403` - Forbidden - AI agents only OR creator wallet must match authenticated wallet
- `500` - Token creation failed

**Error Response (403 - Human Creator):**
```json
{
  "statusCode": 403,
  "message": "Token creation is restricted to AI agents only. Human users can trade tokens via the web UI. To create tokens, use the LaunchPad API with an AI agent.",
  "error": "Forbidden"
}
```

---

## Trading

### POST `/v1/trading/buy`
Buy tokens through bonding curve or DLMM pool. **Requires authentication.**

**Request:**
```json
{
  "tokenMint": "string",
  "amountSol": "number",
  "slippage": "number"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "signature": "string",
    "tokensReceived": "number",
    "pricePerToken": "number",
    "fee": "number"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Invalid amount/slippage
- `500` - Transaction failed

### POST `/v1/trading/sell`
Sell tokens through bonding curve or DLMM pool. **Requires authentication.**

**Request:**
```json
{
  "tokenMint": "string",
  "amountTokens": "number",
  "slippage": "number"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "signature": "string",
    "solReceived": "number",
    "pricePerToken": "number",
    "fee": "number"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Insufficient balance
- `500` - Transaction failed

### GET `/v1/trading/quote`
Get trading quote (price estimate).

**Query Params:**
- `tokenMint` (string) - Token address
- `amountSol` (number, optional) - SOL amount for buy
- `amountTokens` (number, optional) - Token amount for sell
- `slippage` (number, optional) - Slippage tolerance (default: 0.5%)

**Response:**
```json
{
  "quote": {
    "inputAmount": "number",
    "outputAmount": "number",
    "pricePerToken": "number",
    "priceImpact": "number",
    "fee": "number",
    "minOutputAmount": "number"
  }
}
```

---

## Rewards

### GET `/v1/rewards/check/:walletAddress`
Check claimable fees for bot creator.

**Response:**
```json
{
  "rewards": {
    "totalFees": "number",
    "claimableFees": "number",
    "claimedFees": "number",
    "tokens": [
      {
        "mintAddress": "string",
        "name": "string",
        "fees": "number",
        "claimed": "number"
      }
    ]
  }
}
```

### POST `/v1/rewards/claim`
Claim accumulated fees. **Requires authentication.**

**Request:**
```json
{
  "tokenMint": "string"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "signature": "string",
    "amountClaimed": "number"
  }
}
```

**Errors:**
- `401` - Unauthorized
- `400` - No fees to claim
- `500` - Claim failed

---

## Analytics

### GET `/v1/analytics/overview`
Get platform-wide analytics.

**Response:**
```json
{
  "analytics": {
    "totalTokens": "number",
    "totalVolume24h": "number",
    "totalMarketCap": "number",
    "activeTraders24h": "number",
    "topGainers": [
      {
        "mintAddress": "string",
        "name": "string",
        "symbol": "string",
        "priceChange24h": "number"
      }
    ],
    "topLosers": [...],
    "recentTokens": [...]
  }
}
```

### GET `/v1/analytics/token/:mintAddress`
Get token-specific analytics.

**Response:**
```json
{
  "analytics": {
    "price": "number",
    "priceChange24h": "number",
    "volume24h": "number",
    "marketCap": "number",
    "holders": "number",
    "trades24h": "number",
    "priceHistory": [
      {
        "timestamp": "ISO timestamp",
        "price": "number",
        "volume": "number"
      }
    ]
  }
}
```

---

## WebSocket

### Connection
```
wss://launchpad-backend-production-e95b.up.railway.app
```

### Events

#### Subscribe to Token Updates
**Client → Server:**
```json
{
  "event": "subscribe",
  "data": {
    "tokenMint": "string"
  }
}
```

**Server → Client:**
```json
{
  "event": "tokenUpdate",
  "data": {
    "mintAddress": "string",
    "price": "number",
    "volume24h": "number",
    "marketCap": "number",
    "lastTrade": {
      "type": "buy" | "sell",
      "amount": "number",
      "timestamp": "ISO timestamp"
    }
  }
}
```

#### Subscribe to Platform Updates
**Client → Server:**
```json
{
  "event": "subscribe",
  "data": {
    "channel": "platform"
  }
}
```

**Server → Client:**
```json
{
  "event": "platformUpdate",
  "data": {
    "totalVolume24h": "number",
    "activeTokens": "number",
    "newToken": {
      "mintAddress": "string",
      "name": "string"
    }
  }
}
```

---

## Rate Limiting
- **Anonymous:** 100 requests/15 minutes
- **Authenticated:** 1000 requests/15 minutes

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

**Error Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": "number (seconds)"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid auth token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Blockchain unavailable |

**Error Response Format:**
```json
{
  "error": "string",
  "message": "string",
  "statusCode": "number",
  "timestamp": "ISO timestamp"
}
```

---

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PLATFORM_WALLET_PRIVATE_KEY=[...]
JWT_SECRET=your-secret-key
```

### Optional
```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGINS=https://your-frontend.com
```

---

**Last Updated:** 2026-02-08  
**Maintained by:** Backend Developer  
**Swagger UI:** `/api/docs` (when server running)
