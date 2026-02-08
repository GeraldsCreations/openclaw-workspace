# LaunchPad Trader - OpenClaw Skill

**Autonomous token deployment and trading on the LaunchPad platform**

## Overview

The LaunchPad Trader skill enables AI agents to interact with the LaunchPad token platform on Solana. It provides complete functionality for:

- **Token Creation** - Deploy new tokens with bonding curves
- **Trading** - Buy and sell tokens with configurable slippage
- **Wallet Management** - Secure wallet creation, import, and balance checking
- **Market Intelligence** - Browse tokens, get quotes, analyze opportunities
- **Autonomous Trading** - Build trading bots with custom strategies

## Installation

```bash
cd /root/.openclaw/workspace/launchpad-trader
npm install
```

### Dependencies

- `@solana/web3.js` - Solana blockchain interaction
- `tweetnacl` - Cryptographic signing
- `bs58` - Base58 encoding
- `axios` - HTTP client
- `axios-retry` - Automatic retry logic

## Quick Start

### 1. Create a Wallet

```bash
node scripts/wallet.js create my-trading-wallet
```

**Important:** Save the secret key displayed - you'll need it to import the wallet later!

### 2. Fund Your Wallet

Send SOL to the public key address displayed. Minimum recommended: 0.1 SOL for trading.

### 3. Browse Tokens

```bash
node scripts/list-tokens.js --limit 10 --sort volume24h
```

### 4. Get a Price Quote

```bash
node scripts/get-quote.js \
  --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --sol 0.1
```

### 5. Buy a Token

```bash
node scripts/buy-token.js \
  --wallet my-trading-wallet \
  --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --amount 0.1 \
  --slippage 1.0
```

### 6. Sell Your Tokens

```bash
node scripts/sell-token.js \
  --wallet my-trading-wallet \
  --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --all
```

## Command Reference

### Wallet Management (`wallet.js`)

#### Create Wallet
```bash
node scripts/wallet.js create [name]
```

Creates a new Solana wallet and saves it locally.

**Example:**
```bash
node scripts/wallet.js create my-wallet
```

#### Import Wallet
```bash
node scripts/wallet.js import <secret-key> [name]
```

Imports an existing wallet from a Base58 secret key.

**Example:**
```bash
node scripts/wallet.js import 5J7WnK... imported-wallet
```

#### List Wallets
```bash
node scripts/wallet.js list
```

Shows all saved wallets.

#### Check Balance
```bash
node scripts/wallet.js balance <name-or-address>
```

Displays SOL balance for a wallet.

**Example:**
```bash
node scripts/wallet.js balance my-wallet
```

#### List Token Balances
```bash
node scripts/wallet.js tokens <name-or-address>
```

Shows all token holdings.

#### Transaction History
```bash
node scripts/wallet.js history <name-or-address> [limit]
```

Displays recent transactions (default: 10).

#### Sign Message
```bash
node scripts/wallet.js sign <wallet-name> [message]
```

Signs a message for authentication (auto-generates auth message if not provided).

---

### Token Creation (`create-token.js`)

#### Create Token
```bash
node scripts/create-token.js \
  --wallet <wallet-name> \
  --name <token-name> \
  --symbol <symbol> \
  --description <description> \
  --image <image-url> \
  [--initial-mcap <amount>] \
  [--migration-mcap <amount>] \
  [--website <url>] \
  [--twitter <url>] \
  [--telegram <url>] \
  [--save]
```

**Required Parameters:**
- `--wallet, -w` - Wallet to use for creation
- `--name, -n` - Token name (e.g., "My Amazing Token")
- `--symbol, -s` - Token symbol (uppercase, max 10 chars, e.g., "MAT")
- `--description, -d` - Token description
- `--image, -i` - Public image URL

**Optional Parameters:**
- `--initial-mcap` - Initial market cap (default: 10000)
- `--migration-mcap` - Migration threshold (default: 100000)
- `--website` - Project website URL
- `--twitter` - Twitter/X profile URL
- `--telegram` - Telegram group URL
- `--save` - Save token info to JSON file

**Example:**
```bash
node scripts/create-token.js \
  --wallet my-wallet \
  --name "Super Coin" \
  --symbol "SUPER" \
  --description "Revolutionary DeFi token" \
  --image "https://example.com/super.png" \
  --initial-mcap 50000 \
  --migration-mcap 500000 \
  --website "https://supercoin.io" \
  --save
```

---

### Trading (`buy-token.js` / `sell-token.js`)

#### Buy Token
```bash
node scripts/buy-token.js \
  --wallet <wallet-name> \
  --token <mint-address> \
  --amount <sol-amount> \
  [--slippage <percent>] \
  [--yes] \
  [--no-quote] \
  [--no-balance]
```

**Parameters:**
- `--wallet, -w` - Wallet to use
- `--token, -t` - Token mint address
- `--amount, -a` - Amount of SOL to spend
- `--slippage, -s` - Slippage tolerance % (default: 0.5)
- `--yes, -y` - Skip confirmation prompt
- `--no-quote` - Skip quote display
- `--no-balance` - Skip balance display after purchase

**Example:**
```bash
node scripts/buy-token.js \
  --wallet my-wallet \
  --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --amount 1.0 \
  --slippage 1.0
```

#### Sell Token
```bash
node scripts/sell-token.js \
  --wallet <wallet-name> \
  --token <mint-address> \
  (--amount <tokens> | --all | --percent <percent>) \
  [--slippage <percent>] \
  [--yes] \
  [--no-quote] \
  [--no-balance]
```

**Amount Options (choose one):**
- `--amount, -a` - Exact number of tokens to sell
- `--all` - Sell entire balance
- `--percent, -p` - Sell percentage of balance

**Example:**
```bash
# Sell specific amount
node scripts/sell-token.js -w my-wallet -t MINT --amount 1000

# Sell all tokens
node scripts/sell-token.js -w my-wallet -t MINT --all

# Sell 50% of holdings
node scripts/sell-token.js -w my-wallet -t MINT --percent 50
```

---

### Market Intelligence

#### Get Quote (`get-quote.js`)
```bash
node scripts/get-quote.js \
  --token <mint-address> \
  (--sol <amount> | --tokens <amount>) \
  [--slippage <percent>]
```

Get price quote without executing trade.

**Example:**
```bash
# Buy quote (how many tokens for X SOL)
node scripts/get-quote.js --token MINT --sol 1.0

# Sell quote (how much SOL for X tokens)
node scripts/get-quote.js --token MINT --tokens 10000
```

#### List Tokens (`list-tokens.js`)
```bash
node scripts/list-tokens.js \
  [--token <mint>] \
  [--search <query>] \
  [--sort <field>] \
  [--order <asc|desc>] \
  [--limit <number>] \
  [--offset <number>] \
  [--min-mcap <amount>] \
  [--max-mcap <amount>] \
  [--min-volume <amount>] \
  [--detailed] \
  [--analytics]
```

**Examples:**
```bash
# List top 20 tokens by market cap
node scripts/list-tokens.js

# Search for tokens
node scripts/list-tokens.js --search "dog"

# Filter by market cap range
node scripts/list-tokens.js --min-mcap 50000 --max-mcap 500000

# Sort by volume
node scripts/list-tokens.js --sort volume24h --limit 10

# Get specific token with analytics
node scripts/list-tokens.js \
  --token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --analytics
```

**Sort Fields:**
- `marketCap` - Market capitalization (default)
- `volume24h` - 24-hour trading volume
- `price` - Current price
- `holders` - Number of holders

---

## Library API

### LaunchPadAPIClient

```javascript
import LaunchPadAPIClient from './lib/api-client.js';

const client = new LaunchPadAPIClient();
```

#### Authentication
```javascript
await client.authenticateWallet(walletAddress, signature, message);
```

#### Tokens
```javascript
// Get all tokens
const { tokens, total } = await client.getTokens({ limit: 100, offset: 0 });

// Get specific token
const { token } = await client.getToken(mintAddress);

// Create token
const result = await client.createToken({
  name: "My Token",
  symbol: "MTK",
  description: "Description",
  imageUrl: "https://...",
  initialMarketCap: 10000,
  migrationMarketCap: 100000,
  metadata: { website: "", twitter: "", telegram: "" }
});
```

#### Trading
```javascript
// Buy tokens
const buyResult = await client.buyToken(tokenMint, amountSol, slippage);

// Sell tokens
const sellResult = await client.sellToken(tokenMint, amountTokens, slippage);

// Get quote
const { quote } = await client.getQuote(tokenMint, { 
  amountSol: 1.0,
  slippage: 0.5 
});
```

#### Analytics
```javascript
// Platform overview
const { analytics } = await client.getOverview();

// Token analytics
const { analytics } = await client.getTokenAnalytics(mintAddress);
```

#### Rewards
```javascript
// Check rewards
const { rewards } = await client.checkRewards(walletAddress);

// Claim rewards
const result = await client.claimRewards(tokenMint);
```

---

### WalletManager

```javascript
import WalletManager from './lib/wallet-manager.js';

const wallet = new WalletManager();
```

#### Wallet Operations
```javascript
// Generate new wallet
const { publicKey, secretKey } = wallet.generateWallet();

// Import wallet
wallet.importWallet(secretKey);

// Save/load wallet
await wallet.saveWallet("name", secretKey);
await wallet.loadWallet("name");

// List saved wallets
const wallets = await wallet.listWallets();
```

#### Signing
```javascript
// Generate auth message
const message = wallet.generateAuthMessage();

// Sign message
const { signature, message, publicKey } = wallet.signMessage(message);

// Verify signature
const isValid = wallet.verifySignature(message, signature, publicKey);
```

#### Balances
```javascript
// SOL balance
const solBalance = await wallet.getSolBalance();

// Token balance
const tokenBalance = await wallet.getTokenBalance(mintAddress);

// All token balances
const allTokens = await wallet.getAllTokenBalances();
```

#### Transactions
```javascript
// Recent transactions
const txs = await wallet.getRecentTransactions(publicKey, limit);
```

---

### Utilities

```javascript
import {
  validateTokenParams,
  validateTradeParams,
  formatUsd,
  formatPercentage,
  calculateProfitLoss,
  searchTokens,
  filterTokens,
  sortTokens,
  printToken,
  printTransaction,
} from './lib/utils.js';
```

**Validation:**
- `validateTokenParams(params)` - Validate token creation parameters
- `validateTradeParams(amount, slippage)` - Validate trade parameters
- `isValidSolanaAddress(address)` - Check if valid Solana address

**Formatting:**
- `formatUsd(amount)` - Format as USD currency
- `formatPercentage(value)` - Format as percentage with +/- sign
- `formatSol(lamports)` - Format lamports as SOL
- `shortenAddress(address, chars)` - Shorten address for display

**Calculations:**
- `calculateProfitLoss(buyPrice, sellPrice, amount)` - Calculate P&L
- `calculatePriceImpact(input, output, currentPrice)` - Price impact %
- `calculateMinOutput(expected, slippage)` - Min output with slippage

**Token Operations:**
- `searchTokens(tokens, query)` - Search by name/symbol
- `filterTokens(tokens, filters)` - Filter by criteria
- `sortTokens(tokens, sortBy, order)` - Sort tokens

**Display:**
- `printToken(token)` - Pretty print token details
- `printTransaction(tx, type)` - Pretty print transaction result
- `printError(error)` - Format error output

---

## Autonomous Trading Bot

The `examples/bot-trader.js` demonstrates a fully autonomous trading bot.

### Configuration

Set via environment variables:

```bash
export WALLET_NAME="trading-bot"
export BUY_AMOUNT="0.1"           # SOL per trade
export SLIPPAGE="1.0"             # Slippage tolerance %
export MIN_MCAP="10000"           # Minimum market cap
export MAX_MCAP="100000"          # Maximum market cap
export MIN_VOLUME="1000"          # Minimum 24h volume
export PROFIT_TARGET="20"         # Take profit at 20%
export STOP_LOSS="-10"            # Stop loss at -10%
export CHECK_INTERVAL="60000"     # Check every 60 seconds
export MAX_POSITIONS="3"          # Max concurrent positions
export DRY_RUN="true"             # Test mode (no real trades)
```

### Running the Bot

```bash
# Dry run (simulated trades)
DRY_RUN=true node examples/bot-trader.js

# Live trading
DRY_RUN=false node examples/bot-trader.js
```

### Bot Strategy

1. **Scan** - Find tokens matching criteria (market cap, volume)
2. **Analyze** - Get price quote, check price impact
3. **Enter** - Buy if conditions met
4. **Monitor** - Track P&L on open positions
5. **Exit** - Sell at profit target or stop loss

### Customization

Extend the `TradingBot` class to implement custom strategies:

```javascript
import TradingBot from './examples/bot-trader.js';

class MyCustomBot extends TradingBot {
  async scanForOpportunities() {
    // Your custom scanning logic
  }
  
  async shouldBuy(token, quote) {
    // Your custom entry criteria
    return true;
  }
  
  async shouldSell(position, currentPrice) {
    // Your custom exit criteria
    return false;
  }
}
```

---

## Error Handling

All errors include helpful context:

```javascript
try {
  await client.buyToken(mint, amount, slippage);
} catch (error) {
  console.error(error.message);      // Human-readable message
  console.error(error.statusCode);   // HTTP status code (if API error)
  console.error(error.retryAfter);   // Retry delay (if rate limited)
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Authentication required` | No auth token | Call `authenticateWallet()` first |
| `Insufficient balance` | Not enough SOL/tokens | Fund wallet or reduce amount |
| `Rate limit exceeded` | Too many requests | Wait `retryAfter` seconds |
| `Invalid signature` | Wrong wallet/key | Verify wallet and signature |
| `Price impact too high` | Trade too large | Reduce amount or increase slippage |

---

## Security Best Practices

### Wallet Security
- **Never commit secret keys** to version control
- **Use environment variables** for sensitive data
- **Encrypt wallet files** in production (not implemented in basic version)
- **Use dedicated trading wallets** with limited funds

### Trading Safety
- **Start with small amounts** to test
- **Use stop losses** to limit downside
- **Monitor price impact** before trading
- **Set max position sizes** to manage risk
- **Enable dry-run mode** for testing strategies

### API Security
- **Respect rate limits** (built-in retry logic)
- **Validate all inputs** before sending to API
- **Handle errors gracefully** with fallbacks
- **Log important events** for audit trail

---

## Configuration

### Environment Variables

```bash
# Wallet (optional, if not using saved wallets)
SOLANA_PRIVATE_KEY=base58-encoded-secret-key

# RPC endpoint (optional, defaults to mainnet)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# API endpoint (optional, defaults to production)
LAUNCHPAD_API_URL=https://launchpad-backend-production-e95b.up.railway.app

# Trading bot config (see Autonomous Trading Bot section)
WALLET_NAME=trading-bot
BUY_AMOUNT=0.1
# ... etc
```

### Wallet Storage

Wallets are stored in: `~/.openclaw/wallets/`

Each wallet is a JSON file:
```json
{
  "name": "my-wallet",
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "secretKey": "base58-encoded-secret",
  "createdAt": "2024-02-08T12:00:00.000Z"
}
```

**⚠️ Security Warning:** In production, encrypt these files!

---

## Troubleshooting

### "Failed to load wallet"
- Check wallet name is correct
- Verify wallet file exists in `~/.openclaw/wallets/`
- Try: `node scripts/wallet.js list`

### "Insufficient balance"
- Check balance: `node scripts/wallet.js balance my-wallet`
- Fund wallet with SOL from an exchange
- Reduce trade amount

### "Authentication failed"
- Wallet signature may be invalid
- Try re-authenticating
- Check system clock is synchronized

### "Rate limit exceeded"
- Wait for cooldown period
- Reduce request frequency
- Implement exponential backoff (built-in for retries)

### "Token not found"
- Verify mint address is correct
- Token may not be on LaunchPad platform
- Check: `node scripts/list-tokens.js --search SYMBOL`

### "Transaction failed"
- Increase slippage tolerance
- Check network status
- Verify sufficient balance for fees
- Try again (transient network issues)

---

## Roadmap / Future Enhancements

- [ ] WebSocket support for real-time price feeds
- [ ] Advanced bot strategies (technical indicators, sentiment analysis)
- [ ] Portfolio management and rebalancing
- [ ] Multi-wallet support in bot
- [ ] Encrypted wallet storage
- [ ] GUI/web interface
- [ ] Backtesting framework
- [ ] Telegram/Discord notifications
- [ ] Auto-compounding rewards

---

## Support

**LaunchPad Platform:** https://launchpad-backend-production-e95b.up.railway.app  
**API Documentation:** See `/workspace/launchpad/APIs.md`  
**Architecture:** See `/workspace/launchpad/ARCHITECTURE.md`

---

## License

MIT License - See LICENSE file for details

---

**Made with ❤️ for OpenClaw**
