# LaunchPad Trader - Quick Reference

**Fast lookup for common tasks**

## 🔑 Wallet Commands

```bash
# Create wallet
node scripts/wallet.js create <name>

# Import wallet
node scripts/wallet.js import <secret-key> <name>

# List wallets
node scripts/wallet.js list

# Check balance
node scripts/wallet.js balance <name>

# Check token holdings
node scripts/wallet.js tokens <name>

# Transaction history
node scripts/wallet.js history <name>
```

## 📊 Market Research

```bash
# List top tokens
node scripts/list-tokens.js --limit 20

# Search tokens
node scripts/list-tokens.js --search "keyword"

# Filter by market cap
node scripts/list-tokens.js --min-mcap 10000 --max-mcap 100000

# Sort by volume
node scripts/list-tokens.js --sort volume24h --order desc

# Get token details
node scripts/list-tokens.js --token <MINT> --analytics

# Get price quote (buy)
node scripts/get-quote.js --token <MINT> --sol 0.1

# Get price quote (sell)
node scripts/get-quote.js --token <MINT> --tokens 1000
```

## 💰 Trading

```bash
# Buy token
node scripts/buy-token.js -w <wallet> -t <MINT> -a <SOL>

# Buy with custom slippage
node scripts/buy-token.js -w <wallet> -t <MINT> -a <SOL> -s 1.0

# Buy without confirmation
node scripts/buy-token.js -w <wallet> -t <MINT> -a <SOL> -y

# Sell specific amount
node scripts/sell-token.js -w <wallet> -t <MINT> -a <AMOUNT>

# Sell all
node scripts/sell-token.js -w <wallet> -t <MINT> --all

# Sell 50%
node scripts/sell-token.js -w <wallet> -t <MINT> -p 50
```

## 🚀 Token Creation

```bash
node scripts/create-token.js \
  -w <wallet> \
  -n "Token Name" \
  -s "SYMBOL" \
  -d "Description" \
  -i "https://image-url.com/token.png" \
  --initial-mcap 50000 \
  --migration-mcap 500000 \
  --website "https://..." \
  --save
```

## 🤖 Trading Bot

```bash
# Test mode
DRY_RUN=true WALLET_NAME=my-wallet node examples/bot-trader.js

# Live trading
DRY_RUN=false \
WALLET_NAME=my-wallet \
BUY_AMOUNT=0.1 \
PROFIT_TARGET=20 \
STOP_LOSS=-10 \
MAX_POSITIONS=3 \
node examples/bot-trader.js
```

## 💻 Programmatic Usage

```javascript
import LaunchPadAPIClient from './lib/api-client.js';
import WalletManager from './lib/wallet-manager.js';

// Setup
const wallet = new WalletManager();
await wallet.loadWallet('my-wallet');

const api = new LaunchPadAPIClient();

// Authenticate
const authMsg = wallet.generateAuthMessage();
const signed = wallet.signMessage(authMsg);
await api.authenticateWallet(signed.publicKey, signed.signature, signed.message);

// Get tokens
const { tokens } = await api.getTokens({ limit: 100 });

// Get quote
const { quote } = await api.getQuote(tokenMint, { amountSol: 0.1 });

// Buy
const result = await api.buyToken(tokenMint, 0.1, 0.5);

// Sell
const result = await api.sellToken(tokenMint, 1000, 0.5);
```

## ⚙️ Configuration

```bash
# Copy template
cp .env.example .env

# Edit configuration
nano .env
```

**Key Settings:**
- `WALLET_NAME` - Your wallet
- `BUY_AMOUNT` - SOL per trade
- `SLIPPAGE` - Slippage %
- `PROFIT_TARGET` - Take profit %
- `STOP_LOSS` - Stop loss %
- `DRY_RUN` - Test mode

## 🛡️ Safety Checklist

- [ ] Start with test wallet
- [ ] Use small amounts first
- [ ] Enable dry-run mode for bots
- [ ] Set stop losses
- [ ] Never commit secret keys
- [ ] Keep wallets backed up
- [ ] Check quotes before large trades
- [ ] Monitor price impact

## 🆘 Troubleshooting

**Wallet not found:**
```bash
node scripts/wallet.js list
```

**Check balance:**
```bash
node scripts/wallet.js balance <name>
```

**Test API connection:**
```bash
node test-skill.js
```

**View help:**
```bash
node scripts/wallet.js --help
node scripts/buy-token.js --help
# etc...
```

---

**See SKILL.md for complete documentation**
