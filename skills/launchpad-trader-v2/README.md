# LaunchPad Trader v2

Production-grade Solana wallet management and LaunchPad token trading skill for OpenClaw.

## Features

✅ **Multiple Wallet Options**
- 🔐 Privy (MPC embedded wallet with authorization keys)
- ➕ Create new encrypted wallet with recovery phrase
- 📥 Import from seed/private key/keypair file

✅ **Enterprise Security**
- AES-256-GCM encryption for local wallets
- Privy MPC (no single point of failure)
- BIP39 recovery phrases
- Scrypt key derivation
- Authorization keys for autonomous signing

✅ **Complete Trading Features**
- Create tokens with bonding curves
- Buy/sell operations
- Price quotes
- Slippage protection
- Bot rewards (50% fee share)

✅ **Professional UX**
- Interactive setup wizard
- CLI commands for all operations
- Comprehensive error handling
- Detailed logging

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Setup Wizard

```bash
node scripts/setup-wizard.js
```

The wizard will guide you through:
- Wallet provider selection
- Wallet creation/import
- Network configuration
- API setup
- Testing

### 3. Verify Setup

```bash
# Check configuration
node scripts/wallet.js config

# View wallet info
node scripts/wallet.js info

# Check balance
node scripts/wallet.js balance
```

## Usage

### Wallet Operations

```bash
# Check SOL balance
node scripts/wallet.js balance

# Get wallet address
node scripts/wallet.js address

# Check token balance
node scripts/wallet.js token <mint-address>

# List all tokens
node scripts/wallet.js tokens

# Send SOL
node scripts/wallet.js send-sol <to-address> <amount>

# Send tokens
node scripts/wallet.js send-token <mint> <to-address> <amount>

# View wallet info
node scripts/wallet.js info
```

### Trading Operations

```bash
# Create token
node scripts/launchpad.js create "MyToken" "MTK"

# Buy tokens
node scripts/launchpad.js buy <mint> <sol-amount>

# Sell tokens
node scripts/launchpad.js sell <mint> <token-amount>

# Sell all tokens
node scripts/launchpad.js sell <mint> 0 --all

# Get quotes
node scripts/launchpad.js quote <mint> --buy 1.5
node scripts/launchpad.js quote <mint> --sell 100
```

### Bot Rewards

```bash
# Check earnings
node scripts/rewards.js check

# Claim rewards
node scripts/rewards.js claim

# View leaderboard
node scripts/rewards.js leaderboard

# Platform stats
node scripts/rewards.js stats
```

## Configuration

Configuration is managed in `.env` file (created by setup wizard).

**Manual configuration:**

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

**Environment variables:**

- `WALLET_PROVIDER` - privy or local
- `PRIVY_APP_ID` - Privy app ID (if using Privy)
- `PRIVY_APP_SECRET` - Privy app secret (if using Privy)
- `SOLANA_NETWORK` - devnet, testnet, or mainnet-beta
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `LAUNCHPAD_API_URL` - LaunchPad backend API
- `OPENCLAW_AGENT_ID` - Your agent/bot ID

## Documentation

Comprehensive documentation in `references/`:

- **[PRIVY_SETUP.md](references/PRIVY_SETUP.md)** - Complete Privy integration guide
- **[WALLET_SECURITY.md](references/WALLET_SECURITY.md)** - Security architecture & best practices
- **[RECOVERY.md](references/RECOVERY.md)** - Wallet recovery & troubleshooting

## Architecture

```
launchpad-trader-v2/
├── lib/
│   ├── config.js           - Configuration management
│   ├── privy-wallet.js     - Privy integration
│   ├── local-wallet.js     - Encrypted local wallet
│   └── wallet-manager.js   - Unified wallet interface
│
├── scripts/
│   ├── setup-wizard.js     - Interactive setup
│   ├── wallet.js           - Wallet operations
│   ├── launchpad.js        - Trading operations
│   └── rewards.js          - Bot rewards
│
├── references/
│   ├── PRIVY_SETUP.md      - Privy guide
│   ├── WALLET_SECURITY.md  - Security docs
│   └── RECOVERY.md         - Recovery guide
│
├── SKILL.md                - OpenClaw skill definition
├── package.json            - Dependencies
└── .env.example            - Configuration template
```

## Security

**Privy Wallets:**
- MPC key splitting (Shamir's secret sharing)
- Authorization keys for autonomous signing
- No single point of failure
- Programmable policies

**Local Wallets:**
- AES-256-GCM encryption
- Scrypt key derivation
- BIP39 recovery phrases
- Restrictive file permissions (0600)

**See [WALLET_SECURITY.md](references/WALLET_SECURITY.md) for complete security architecture.**

## Requirements

- Node.js 18+
- Privy account (if using Privy provider)
- SOL for gas fees (~0.000005 SOL per transaction)
- LaunchPad backend (for trading operations)

## Testing

**Test on devnet first:**

```bash
# .env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Fund devnet wallet:**

```bash
# Get your address
node scripts/wallet.js address

# Airdrop SOL
solana airdrop 1 YOUR_ADDRESS --url devnet
```

**Test operations:**

```bash
# Check balance
node scripts/wallet.js balance

# Create test token
node scripts/launchpad.js create "TestToken" "TEST"

# Try buying
node scripts/launchpad.js quote TEST_MINT --buy 0.1
```

## Troubleshooting

**Wallet not found:**
```bash
node scripts/setup-wizard.js
```

**Invalid password:**
- Check for typos
- Recover with seed phrase
- See [RECOVERY.md](references/RECOVERY.md)

**RPC errors:**
- Switch to private RPC
- Check network status
- Verify RPC URL matches network

**Transaction failed:**
- Check balance
- Increase slippage
- Wait for better network conditions

**See [RECOVERY.md](references/RECOVERY.md) for complete troubleshooting guide.**

## Support

- **Documentation:** See `references/` folder
- **Configuration:** `node scripts/wallet.js config`
- **Status:** `node scripts/wallet.js info`

## License

MIT

## Version

2.0.0 - Production Release
