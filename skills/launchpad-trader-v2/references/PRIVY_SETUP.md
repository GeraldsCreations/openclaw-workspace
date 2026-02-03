# Privy Setup Guide

Complete guide to setting up Privy embedded wallets for agentic trading.

## What is Privy?

Privy provides secure embedded wallets using Multi-Party Computation (MPC) with Shamir's secret sharing. For agentic wallets, Privy uses **authorization keys** that allow your application to sign transactions autonomously while maintaining security.

## Why Privy for Agentic Wallets?

✅ **No Single Point of Failure** - MPC key splitting means no single entity holds the full key  
✅ **Autonomous Signing** - Authorization keys enable agents to sign without user interaction  
✅ **Programmable Policies** - Set transaction limits, approved destinations, contract restrictions  
✅ **Production Ready** - Enterprise-grade security and infrastructure  
✅ **No Extension Required** - Works server-side, perfect for CLI/bots  

## Architecture

```
┌─────────────────────────────────────────────┐
│           LaunchPad Trader Agent            │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │   Authorization Key (P-256)        │   │
│  │   - Private key (your app)         │   │
│  │   - Public key (registered)        │   │
│  └────────────────────────────────────┘   │
│                    │                        │
└────────────────────┼────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Privy Secure        │
         │   Enclave (MPC)       │
         │                       │
         │  Wallet Key Shares    │
         │  (Shamir's Secret     │
         │   Sharing)            │
         └───────────────────────┘
                     │
                     ▼
            Solana Blockchain
```

## Setup Steps

### 1. Create Privy Account

1. Go to https://dashboard.privy.io
2. Sign up for an account
3. Create a new app
4. Note your **App ID** and **App Secret**

### 2. Configure LaunchPad Trader

Run the setup wizard:

```bash
node scripts/setup-wizard.js
```

Choose "Privy" when prompted and enter:
- App ID
- App Secret

Or manually create `.env`:

```bash
WALLET_PROVIDER=privy
PRIVY_APP_ID=your-app-id-here
PRIVY_APP_SECRET=your-app-secret-here
```

### 3. Initialize Wallet

The first time you run any operation, LaunchPad will:

1. **Generate authorization key** (P-256 keypair)
   - Private key saved locally at `~/.openclaw/wallets/privy/<agent-id>-auth-key.json`
   - Public key registered with Privy secure enclave

2. **Create Privy wallet**
   - MPC wallet created with your authorization key as owner
   - Wallet address generated
   - Wallet metadata saved locally

```bash
# This will trigger initialization
node scripts/wallet.js balance
```

Output:
```
🔐 Initializing Privy wallet...
🔑 Generating new authorization key...
✅ Authorization key generated and saved
➕ Creating new Privy wallet...
✅ Privy wallet initialized
📍 Address: 7xKXtg2CW87d97TcU27barkeD9fTyiB2ktsiEoULMN4j
🔑 Wallet ID: wlt_abc123...
```

## Authorization Keys

Authorization keys are P-256 (NIST) keypairs that prove your application's identity to Privy.

### Key Generation

```javascript
const { generateP256KeyPair } = require('@privy-io/node');

const { privateKey, publicKey } = await generateP256KeyPair();
```

### Key Storage

- **Private key:** Stored locally at `~/.openclaw/wallets/privy/<agent-id>-auth-key.json`
- **Public key:** Registered with Privy secure enclave
- **Permissions:** File mode 0600 (owner read/write only)

### Key Usage

Every transaction is signed using your authorization key:

```javascript
await privy.wallets().solana().signTransaction(walletId, {
  transaction: serializedTx,
  authorization_context: {
    authorization_private_keys: [privateKey]
  }
});
```

## Security Model

### MPC Key Splitting

Privy uses Shamir's secret sharing to split wallet keys:

1. **Key Generation:** Wallet key created in secure enclave
2. **Splitting:** Key split into multiple shares
3. **Distribution:** Shares distributed across secure infrastructure
4. **Reconstitution:** Key reconstituted only in secure environment for signing

**Result:** No single entity (including Privy) ever has access to the full private key.

### Authorization Context

Your authorization key proves:
- ✅ Identity (you are the authorized app)
- ✅ Intent (you want to perform this specific action)
- ✅ Ownership (you own this wallet)

Privy validates the signature before executing actions in the secure enclave.

## Policies (Advanced)

Privy supports programmable policies for additional security:

### Transaction Limits

```javascript
// Set maximum transaction amount
await privy.policies().create({
  wallet_id: walletId,
  rules: [
    {
      type: 'transfer_limit',
      max_amount: '1000000000', // 1 SOL in lamports
      time_window: '24h'
    }
  ]
});
```

### Approved Destinations

```javascript
// Whitelist specific addresses
await privy.policies().create({
  wallet_id: walletId,
  rules: [
    {
      type: 'destination_allowlist',
      addresses: [
        '7xKXtg2CW87d97TcU27barkeD9fTyiB2ktsiEoULMN4j',
        'ABC123...'
      ]
    }
  ]
});
```

### Contract Restrictions

```javascript
// Limit which programs can be called
await privy.policies().create({
  wallet_id: walletId,
  rules: [
    {
      type: 'program_allowlist',
      programs: [
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
        'YOUR_LAUNCHPAD_PROGRAM_ID'
      ]
    }
  ]
});
```

**Note:** Policies are optional but recommended for production deployments.

## Troubleshooting

### "Invalid App ID or Secret"

- Verify credentials at https://dashboard.privy.io
- Check for typos in `.env` file
- Ensure no extra spaces or quotes

### "Authorization key not found"

- Run any command to trigger initialization
- Check `~/.openclaw/wallets/privy/` directory exists
- Verify file permissions (should be 0600)

### "Wallet creation failed"

- Check network connectivity
- Verify Privy account is active
- Check Privy API status at https://status.privy.io

### "Rate limit exceeded"

- Privy has rate limits on API calls
- Contact Privy support for increased limits
- Implement backoff/retry logic

## Best Practices

### Production Deployment

1. **Secure Credentials**
   - Never commit App Secret to git
   - Use environment variables or secrets manager
   - Rotate secrets periodically

2. **Authorization Keys**
   - Back up auth keys securely (encrypted)
   - One auth key per agent/bot
   - Rotate keys if compromised

3. **Policies**
   - Set transaction limits appropriate for use case
   - Whitelist known addresses when possible
   - Review and update policies regularly

4. **Monitoring**
   - Log all wallet operations
   - Monitor for unusual activity
   - Set up alerts for large transactions

### Development vs Production

**Development:**
- Use devnet
- Public RPC acceptable
- Relaxed policies
- Single auth key

**Production:**
- Use mainnet-beta
- Private RPC (Helius/QuickNode)
- Strict policies
- Multiple auth keys with different permissions
- Multi-signature for high-value operations

## Cost

Privy pricing varies by plan:

- **Free Tier:** Limited wallets, testing only
- **Growth:** More wallets, production use
- **Enterprise:** Custom limits, dedicated support

Check current pricing at https://privy.io/pricing

## Resources

- **Privy Docs:** https://docs.privy.io
- **Agentic Wallets:** https://docs.privy.io/recipes/wallets/agentic-wallets
- **Dashboard:** https://dashboard.privy.io
- **Status:** https://status.privy.io
- **Support:** https://privy.io/slack

## Migration from Local Wallet

To migrate from local encrypted wallet to Privy:

1. **Export private key** from local wallet
2. **Create Privy wallet** (new address)
3. **Transfer funds** from old to new address
4. **Update .env** to use Privy provider
5. **Delete old wallet** (after verifying transfer)

**Note:** Privy wallets have different addresses than imported keys. You cannot import an existing key into Privy's MPC system.
