# LaunchPad Trader Skill

Complete Solana wallet management and LaunchPad token trading for OpenClaw.

## Quick Start

```bash
# Install dependencies
npm install

# Create wallet
node wallet.js create

# Fund wallet (devnet)
solana airdrop 1 <YOUR_ADDRESS> --url devnet

# Check balance
node wallet.js balance

# Get all token balances
node wallet.js all-tokens

# Create a token on LaunchPad
node launchpad.js create "MyToken" "MTK" "A cool token"

# Buy tokens
node launchpad.js buy <TOKEN_ADDRESS> 0.5

# Sell tokens
node launchpad.js sell <TOKEN_ADDRESS> 100

# Get trending tokens
node launchpad.js trending
```

## Wallet Commands

```bash
# Create new wallet (saved to ~/.openclaw/wallets/launchpad-trader.json)
node wallet.js create

# Get your wallet address
node wallet.js address

# Check SOL balance
node wallet.js balance

# Check token balance
node wallet.js token-balance <MINT_ADDRESS>

# Get all token balances
node wallet.js all-tokens

# Send SOL
node wallet.js send-sol <TO_ADDRESS> <AMOUNT>

# Send tokens
node wallet.js send-tokens <MINT_ADDRESS> <TO_ADDRESS> <AMOUNT>
```

## LaunchPad Commands

```bash
# Create token
node launchpad.js create <NAME> <SYMBOL> [DESCRIPTION] [IMAGE_URL] [INITIAL_BUY_SOL]

# Example:
node launchpad.js create "GERELD" "GER" "The best AI token" "" 1.0

# Buy tokens
node launchpad.js buy <TOKEN_ADDRESS> <AMOUNT_SOL> [SLIPPAGE]

# Example (buy 0.5 SOL worth with 1% slippage):
node launchpad.js buy Abc123... 0.5 0.01

# Sell tokens
node launchpad.js sell <TOKEN_ADDRESS> <AMOUNT_TOKENS> [SLIPPAGE]

# Get buy quote
node launchpad.js quote-buy <TOKEN_ADDRESS> <AMOUNT_SOL>

# Get sell quote
node launchpad.js quote-sell <TOKEN_ADDRESS> <AMOUNT_TOKENS>

# Get token details
node launchpad.js token <TOKEN_ADDRESS>

# Get trending tokens
node launchpad.js trending [LIMIT]
```

## OpenClaw Integration

Ask your OpenClaw instance:

```
"Create a Solana wallet for me"
"What's my SOL balance?"
"Show me all my tokens"
"Create a token called PUMP"
"Buy 1 SOL of GERELD token"
"Sell all my PUMP tokens"
"What are the trending tokens?"
```

## Security

- Keypair stored at: `~/.openclaw/wallets/launchpad-trader.json`
- File permissions: `600` (owner read/write only)
- **Never share your keypair file!**
- **Back it up securely!**

## Environment Variables

```bash
# Solana RPC URL (default: devnet)
export SOLANA_RPC_URL="https://api.devnet.solana.com"

# LaunchPad API URL
export LAUNCHPAD_API_URL="http://localhost:3000/v1"
```

## Network

- **Default:** Solana Devnet
- **RPC:** https://api.devnet.solana.com
- **Explorer:** https://explorer.solana.com/?cluster=devnet

## Notes

- All prices in SOL
- Token amounts assume 9 decimals
- Gas fees: ~0.000005 SOL per transaction
- Slippage default: 1%
- LaunchPad backend must be running: `http://localhost:3000`
