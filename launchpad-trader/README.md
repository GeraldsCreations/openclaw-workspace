# LaunchPad Trader - OpenClaw Skill

**Autonomous token deployment and trading on Solana's LaunchPad platform.**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create wallet
node scripts/wallet.js create my-wallet

# Browse tokens
node scripts/list-tokens.js --limit 10

# Get price quote
node scripts/get-quote.js --token <MINT> --sol 0.1

# Buy token
node scripts/buy-token.js --wallet my-wallet --token <MINT> --amount 0.1

# Sell token
node scripts/sell-token.js --wallet my-wallet --token <MINT> --all
```

## 📚 Full Documentation

See [SKILL.md](./SKILL.md) for complete documentation including:
- Command reference
- Library API
- Trading bot setup
- Security best practices
- Troubleshooting guide

## 🤖 Trading Bot

Run autonomous trading bot:

```bash
# Test mode (no real trades)
DRY_RUN=true node examples/bot-trader.js

# Live trading
DRY_RUN=false WALLET_NAME=my-wallet node examples/bot-trader.js
```

## 🔧 Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key settings:
- `WALLET_NAME` - Your trading wallet
- `BUY_AMOUNT` - SOL per trade
- `PROFIT_TARGET` - Take profit %
- `STOP_LOSS` - Stop loss %

## 📦 What's Included

- **Scripts** - CLI tools for wallet, trading, and market analysis
- **Library** - Reusable API client, wallet manager, utilities
- **Examples** - Autonomous trading bot template
- **Documentation** - Complete skill reference

## 🛡️ Security

- Wallets stored in `~/.openclaw/wallets/`
- Never commit secret keys
- Use separate trading wallets
- Start with small amounts

## 📄 License

MIT License

---

**Built for OpenClaw** | See [SKILL.md](./SKILL.md) for details
