---
name: launchpad-trader-v2
description: Production-grade Solana wallet management and LaunchPad token trading with multiple secure wallet options (Privy MPC embedded wallet with authorization keys, encrypted local wallet with recovery phrase, import from seed/key). Comprehensive trading features including token creation, buy/sell operations, bot rewards (50% fee share), SOL/SPL token transfers, and balance checking. Use when: (1) Managing Solana wallets securely, (2) Trading tokens on LaunchPad platform, (3) Creating new tokens with bonding curves, (4) Checking or claiming bot trading rewards, (5) Performing SOL or SPL token operations, (6) Setting up secure agentic wallets for autonomous trading. Triggers: "setup wallet", "create wallet", "import wallet", "privy wallet", "check balance", "sol balance", "token balance", "buy token", "sell token", "create token", "launch token", "check rewards", "claim rewards", "bot earnings", "send sol", "transfer tokens", "trade", "setup launchpad".
---

# LaunchPad Trader v2

Secure Solana wallet management and LaunchPad token trading with production-grade security and multiple wallet options.

## Quick Start

**First time setup:**
```
Run the interactive setup wizard
```

**Check your balance:**
```
What's my SOL balance?
```

**Trade tokens:**
```
Buy 50 SOL worth of token ABC...
```

## Wallet Options

### 🔐 Privy (Recommended)
Secure embedded wallet with MPC key management and authorization keys for autonomous signing.

- **Best for:** Production use, agentic wallets, autonomous trading
- **Security:** MPC (Shamir's secret sharing), authorization keys for signing
- **Setup:** Requires Privy account (App ID + Secret from dashboard.privy.io)
- **Features:** No single point of failure, programmable policies, autonomous operation
- **Trigger:** "setup privy wallet", "use privy"

**Details:** See [PRIVY_SETUP.md](references/PRIVY_SETUP.md)

### ➕ Create New Wallet
Generate fresh encrypted keypair with 12 or 24-word recovery phrase.

- **Best for:** New users, testing, development
- **Security:** AES-256-GCM encryption, recovery phrase backup
- **Setup:** Password-protected, mnemonic phrase for recovery
- **Features:** Full control, portable via recovery phrase
- **Trigger:** "create new wallet", "generate wallet"

### 📥 Import Existing Wallet
Import from seed phrase, private key, or keypair file.

- **Best for:** Migrating existing wallets
- **Supported formats:**
  - 12 or 24-word recovery phrase
  - Base58 private key
  - JSON keypair file
  - Secret key array
- **Trigger:** "import wallet", "load wallet"

## Commands

### Wallet Management
- **Balance:** "What's my SOL balance?" | "Check balance"
- **Address:** "Show my wallet address" | "What's my address?"
- **Token balance:** "How much PUMP do I have?" | "Token balance for [mint]"
- **All tokens:** "Show all my tokens" | "List my token balances"

### Trading
- **Buy tokens:** "Buy 100 SOL of token ABC..." | "Purchase [amount] SOL of [token]"
- **Sell tokens:** "Sell all my GERELD tokens" | "Dump [amount] of [token]"
- **Get quote:** "Quote for buying 50 SOL of [token]" | "How much for [amount]?"
- **Create token:** "Create token MyToken (MTK)" | "Launch new token [name]"

### Transfers
- **Send SOL:** "Send 0.5 SOL to [address]" | "Transfer [amount] SOL"
- **Send tokens:** "Send 100 PUMP to [address]" | "Transfer [amount] tokens"

### Bot Rewards
- **Check earnings:** "Check my bot rewards" | "How much have I earned?"
- **Claim rewards:** "Claim my rewards" | "Withdraw earnings"
- **Leaderboard:** "Show top earning bots" | "Bot leaderboard"
- **Stats:** "Platform stats" | "Fee statistics"

## Setup

Run the interactive setup wizard:

```bash
cd /root/.openclaw/workspace/skills/launchpad-trader-v2
node scripts/setup-wizard.js
```

The wizard guides you through:

1. **Wallet provider selection** (Privy or local)
2. **Wallet creation/import**
3. **Network configuration** (devnet/mainnet + RPC)
4. **LaunchPad API setup**
5. **Agent ID configuration**
6. **Validation & testing**

Configuration is saved to `.env` file.

## Configuration

**Environment variables:**

```bash
# Wallet Provider
WALLET_PROVIDER=privy  # or 'local'

# Privy (if using Privy)
PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-secret

# Solana Network
SOLANA_NETWORK=devnet  # or 'mainnet-beta'
SOLANA_RPC_URL=https://your-rpc-url

# LaunchPad API
LAUNCHPAD_API_URL=http://localhost:3000/v1

# Agent ID
OPENCLAW_AGENT_ID=your-agent-id

# Local wallet password (if using local)
WALLET_PASSWORD=your-password
```

**Manual configuration:**

Create `.env` file or set environment variables. See `.env.example` for template.

## Architecture

```
lib/
├── privy-wallet.js      - Privy integration with authorization keys
├── local-wallet.js      - Encrypted local wallet with recovery
├── wallet-manager.js    - Unified wallet interface
└── config.js            - Configuration management

scripts/
├── setup-wizard.js      - Interactive setup
├── wallet.js            - Wallet operations
├── launchpad.js         - Trading operations
└── rewards.js           - Bot rewards management
```

## Security Features

### Privy Wallets
- MPC key splitting (Shamir's secret sharing)
- Authorization keys for autonomous signing
- No single point of failure
- Programmable policies and guardrails
- Secure enclave execution

### Local Wallets
- AES-256-GCM encryption
- Scrypt key derivation from password
- 12 or 24-word BIP39 recovery phrases
- File permissions (0600)
- No plaintext secrets

**Details:** See [WALLET_SECURITY.md](references/WALLET_SECURITY.md)

## Trading

### Token Creation
Creates tokens with bonding curve pricing on LaunchPad platform.

**Process:**
1. Request token creation with name/symbol
2. Get unsigned transaction from API
3. Sign transaction with wallet
4. Submit to blockchain
5. Token is live with bonding curve

### Buy/Sell Operations
Trade tokens through LaunchPad's bonding curve mechanism.

**Process:**
1. Request quote (optional but recommended)
2. Submit buy/sell order
3. Get unsigned transaction
4. Sign and submit
5. Receive tokens (buy) or SOL (sell)

**Details:** See [TRADING_GUIDE.md](references/TRADING_GUIDE.md)

## Bot Rewards

Bots earn **50% of trading fees** from tokens they create.

- Fees accumulate automatically
- Claim anytime (minimum 0.01 SOL)
- View earnings and leaderboard
- Track platform statistics

**Revenue share:** Bot creators get 50%, platform gets 50%

**Details:** See [API_REFERENCE.md](references/API_REFERENCE.md)

## Recovery & Troubleshooting

### Lost Password (Local Wallet)
If you have your recovery phrase:
1. Re-run setup wizard
2. Choose "Import Wallet"
3. Enter recovery phrase
4. Create new password

### Wallet Not Found
Run setup wizard to create or import wallet.

### RPC Connection Issues
- Switch to private RPC (Helius, QuickNode, Alchemy)
- Verify network matches RPC URL
- Check rate limits on public RPCs

**Details:** See [RECOVERY.md](references/RECOVERY.md)

## Detailed Documentation

- **Privy Setup:** [PRIVY_SETUP.md](references/PRIVY_SETUP.md) - Complete integration guide
- **Wallet Security:** [WALLET_SECURITY.md](references/WALLET_SECURITY.md) - Security architecture
- **Trading Guide:** [TRADING_GUIDE.md](references/TRADING_GUIDE.md) - Detailed trading instructions
- **API Reference:** [API_REFERENCE.md](references/API_REFERENCE.md) - Complete API documentation
- **Recovery:** [RECOVERY.md](references/RECOVERY.md) - Recovery procedures

## Requirements

- Node.js 18 or higher
- Privy account (if using Privy provider)
- SOL for gas fees (~0.000005 SOL per transaction)
- LaunchPad backend running (for trading operations)

## Example Usage

**Setup:**
```
node scripts/setup-wizard.js
```

**Check balance:**
```
node scripts/wallet.js balance
```

**View tokens:**
```
node scripts/wallet.js tokens
```

**Buy token:**
```
node scripts/launchpad.js buy <token-mint> <amount-in-sol>
```

**Check rewards:**
```
node scripts/rewards.js check
```

## Network Support

- **Devnet:** Testing and development
- **Testnet:** Pre-production testing
- **Mainnet Beta:** Production use

Always test on devnet before deploying to mainnet.

## Rate Limits

- **Privy:** Subject to Privy API rate limits
- **Solana RPC:** Depends on provider (public RPCs are rate limited)
- **LaunchPad API:** No published limits

**Recommendation:** Use private RPC for production to avoid rate limiting.

## Support

For issues or questions:
1. Check [RECOVERY.md](references/RECOVERY.md) for troubleshooting
2. Review reference documentation
3. Verify configuration with `node lib/config.js`
4. Check wallet status with `node scripts/wallet.js status`

---

**Version:** 2.0.0  
**License:** MIT  
**Author:** OpenClaw
