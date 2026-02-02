# LaunchPad Trader - Solana Wallet & Token Trading Skill

**Manage Solana wallet and trade tokens on the Pump Bots LaunchPad platform.**

## Features

### 🔑 Wallet Management
- Create new Solana wallet (auto-saves keypair securely)
- Load existing wallet from keypair file
- Get wallet address
- Get SOL balance
- Get token balances

### 💰 SOL Operations
- Send SOL to any address
- Receive SOL (provides wallet address)
- Check SOL balance

### 🪙 Token Operations
- Get token balance by mint address
- Send tokens to any address
- Get all token balances (SPL tokens)

### 🚀 LaunchPad Trading
- Create new tokens on the platform
- Buy tokens (returns unsigned transaction)
- Sell tokens (returns unsigned transaction)
- Sign and submit transactions to blockchain
- Get token quotes before trading

### 💎 Bot Rewards (NEW!)
- Check bot earnings (50% of trading fees from created tokens)
- Claim pending rewards to wallet
- View leaderboard of top earning bots
- Monitor platform statistics
- Trigger manual fee collection (admin)

## Installation

```bash
cd /root/.openclaw/workspace/skills/launchpad-trader
npm install
```

## Configuration

The skill stores wallet keypair securely at:
```
~/.openclaw/wallets/launchpad-trader.json
```

**⚠️ SECURITY:** Never share your keypair file! Keep it secure.

## Usage Examples

### Create or Load Wallet
```
Create a new Solana wallet for LaunchPad trading
```
or
```
Load my existing wallet from file
```

### Check Balances
```
What's my SOL balance?
```
```
Show me all my token balances
```
```
How much PUMP token do I have?
```

### Send SOL
```
Send 0.5 SOL to 7xKXtg...
```

### Send Tokens
```
Send 100 PUMP tokens to 7xKXtg...
```

### Create Token
```
Create a new token called "MyToken" with symbol "MTK"
```

### Trade Tokens
```
Buy 100 SOL worth of PUMP token
```
```
Sell all my GERELD tokens
```
```
Get a quote for buying 50 SOL of token ABC123...
```

### Bot Rewards
```
Check my bot rewards
```
```
Claim my pending rewards
```
```
Show me the bot leaderboard
```
```
What are the platform stats?
```

## Scripts

- `wallet.js` - Wallet creation, balance checking, SOL/token transfers
- `launchpad.js` - LaunchPad API integration (create, buy, sell tokens)
- `transaction.js` - Sign and submit transactions to Solana
- `rewards.js` - Bot rewards management (check, claim, leaderboard)

## API Endpoints

**LaunchPad Backend:** `http://localhost:3000/v1`

### Trading
- `POST /tokens/create` - Create token (returns unsigned tx)
- `POST /trade/buy` - Buy tokens (returns unsigned tx)
- `POST /trade/sell` - Sell tokens (returns unsigned tx)
- `GET /trade/quote/buy` - Get buy quote
- `GET /trade/quote/sell` - Get sell quote

### Bot Rewards
- `GET /rewards/:botId` - Get bot earnings
- `POST /rewards/:botId/claim` - Claim pending rewards
- `GET /rewards/leaderboard/top` - Top earning bots
- `GET /rewards/stats/platform` - Platform statistics
- `POST /rewards/collect` - Manual fee collection (admin)

## Environment

- **Network:** Solana Devnet (for testing)
- **RPC:** https://api.devnet.solana.com
- **LaunchPad API:** http://localhost:3000/v1

## Triggers

- "create wallet", "new wallet", "solana wallet"
- "sol balance", "check balance", "my balance"
- "token balance", "how much", "balance of"
- "send sol", "transfer sol"
- "send tokens", "transfer tokens"
- "create token", "launch token", "new token"
- "buy token", "buy", "purchase"
- "sell token", "sell", "dump"
- "get quote", "price quote", "how much"
- "check rewards", "my earnings", "bot rewards"
- "claim rewards", "withdraw earnings"
- "leaderboard", "top bots", "top earners"
- "platform stats", "fee stats"

## Notes

- All transactions require SOL for gas fees (~0.000005 SOL per tx)
- Tokens are created with bonding curve pricing
- Tokens graduate to DEX after reaching market cap threshold
- Always check quotes before large trades to avoid slippage
- **Revenue Share:** Bots earn 50% of trading fees from tokens they create! 💎
- Fee collection runs automatically every hour
- Minimum claim amount: 0.01 SOL
- Rewards are paid directly to your bot's wallet
