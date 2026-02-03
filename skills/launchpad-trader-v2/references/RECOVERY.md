# Recovery Guide

Complete guide to recovering wallets and troubleshooting common issues.

## Wallet Recovery

### Local Encrypted Wallet Recovery

#### Scenario 1: Lost Password (Have Recovery Phrase)

If you have your 12 or 24-word recovery phrase:

1. **Run setup wizard:**
```bash
node scripts/setup-wizard.js
```

2. **Choose "Import Wallet"**

3. **Select "Recovery Phrase"**

4. **Enter your 12 or 24 words**

5. **Create new password**

6. **Verify recovery:**
```bash
node scripts/wallet.js address
```

Your wallet will be restored with the same address.

#### Scenario 2: Lost Recovery Phrase (Have Password)

If you still have your password and can access the wallet:

**Immediately:**

1. **Create new wallet with new recovery phrase**
2. **Transfer all funds to new wallet**
3. **Secure new recovery phrase properly**

**There is NO WAY to view your recovery phrase after initial creation.**

#### Scenario 3: Lost Both Password and Recovery Phrase

**Unfortunately, your funds are permanently inaccessible.**

This is by design - non-custodial means no one else can recover your wallet either.

**Prevention:**
- Write down recovery phrase immediately
- Store in fireproof safe
- Consider metal backup
- Never store digitally

### Privy Wallet Recovery

#### Scenario 1: Lost Authorization Key

If your authorization key file is lost or corrupted:

**Option A: Restore from backup**
```bash
# If you have an encrypted backup
openssl enc -d -aes-256-cbc -in auth-key-backup.tar.gz.enc -out auth-key-backup.tar.gz
tar -xzf auth-key-backup.tar.gz -C ~/
```

**Option B: Create new wallet and transfer**

1. **Generate new authorization key:**
```bash
# Setup wizard will create new auth key
node scripts/setup-wizard.js
```

2. **Create new Privy wallet**

3. **Transfer funds from old wallet** (if you have access elsewhere)

**Note:** You cannot recover a Privy wallet without the authorization key. Back up your auth keys!

#### Scenario 2: Lost Privy Account Access

If you lost access to your Privy dashboard account:

1. **Contact Privy support:** https://privy.io/slack
2. **Verify ownership** of the account
3. **Follow Privy's account recovery process**

Your wallets will remain secure - Privy cannot access them without your authorization keys.

## Troubleshooting

### Wallet Not Found

**Error:** `No wallet found. Create one first with setup wizard.`

**Solution:**
```bash
# Run setup wizard
node scripts/setup-wizard.js
```

Choose to create new wallet or import existing one.

### Invalid Password

**Error:** `Invalid password`

**Solutions:**

1. **Check for typos** - passwords are case-sensitive

2. **Check caps lock** is off

3. **Try environment variable:**
```bash
export WALLET_PASSWORD="your-password"
node scripts/wallet.js balance
```

4. **If truly forgotten:**
   - Use recovery phrase to restore wallet
   - See "Lost Password" section above

### Transaction Failed

**Error:** `Transaction failed` or `Transaction simulation failed`

**Common causes:**

1. **Insufficient balance:**
```bash
# Check balance
node scripts/wallet.js balance

# Fund wallet on devnet
solana airdrop 1 YOUR_ADDRESS --url devnet
```

2. **RPC rate limiting:**
   - Switch to private RPC
   - Wait and retry
   - Check RPC status

3. **Slippage too low:**
```bash
# Increase slippage for volatile tokens
node scripts/launchpad.js buy TOKEN_MINT 1 --slippage 10
```

4. **Network congestion:**
   - Wait for better conditions
   - Increase priority fees (advanced)

### RPC Connection Issues

**Error:** `Failed to connect to RPC`

**Solutions:**

1. **Check RPC URL in .env:**
```bash
# View config
node scripts/wallet.js config
```

2. **Test RPC manually:**
```bash
curl YOUR_RPC_URL -X POST -H "Content-Type: application/json" -d '
{
  "jsonrpc":"2.0",
  "id":1,
  "method":"getHealth"
}'
```

3. **Switch RPC providers:**
   - Try public RPC first: `https://api.devnet.solana.com`
   - Get private RPC from Helius/QuickNode/Alchemy

4. **Check network status:**
   - https://status.solana.com
   - Your RPC provider's status page

### Privy API Errors

**Error:** `Invalid App ID or Secret`

**Solutions:**

1. **Verify credentials:**
   - Login to https://dashboard.privy.io
   - Check App ID matches
   - Regenerate secret if needed

2. **Check .env file:**
```bash
cat .env | grep PRIVY
```

3. **No spaces or quotes:**
```bash
# Wrong
PRIVY_APP_ID="clpka_abc123"

# Right
PRIVY_APP_ID=clpka_abc123
```

### LaunchPad API Unreachable

**Error:** `LaunchPad API unreachable`

**Solutions:**

1. **Check if backend is running:**
```bash
# For local backend
pm2 list
pm2 start backend-api
```

2. **Verify API URL:**
```bash
# Check config
node scripts/wallet.js config

# Test API
curl http://localhost:3000/health
```

3. **Check network/firewall:**
   - Can you access the URL in browser?
   - Is firewall blocking the port?

## File Corruption

### Encrypted Wallet File Corrupted

**Error:** `Error reading wallet file` or `Invalid encryption`

**If you have recovery phrase:**
```bash
# Re-import wallet
node scripts/setup-wizard.js
# Choose "Import Wallet" > "Recovery Phrase"
```

**If no recovery phrase:**
Unfortunately, funds are lost. This is why backups are critical.

### Authorization Key File Corrupted

**If you have backup:**
```bash
# Restore from backup
cp backup/agent-auth-key.json ~/.openclaw/wallets/privy/
```

**If no backup:**
Create new wallet and transfer funds (see Privy recovery above).

## Network Issues

### Wrong Network

**Problem:** Trying to use mainnet wallet on devnet (or vice versa)

**Solution:**

1. **Check current network:**
```bash
node scripts/wallet.js config
```

2. **Change network in .env:**
```bash
# For devnet
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# For mainnet
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

3. **Restart application**

**Note:** Same wallet address works on all networks, but balances are different.

### Transaction Not Confirming

**Problem:** Transaction sent but not confirming

**Steps:**

1. **Wait longer** - can take up to 60 seconds

2. **Check transaction on explorer:**
```
https://explorer.solana.com/tx/YOUR_SIGNATURE?cluster=devnet
```

3. **Check status:**
   - ✅ Confirmed - success
   - ❌ Failed - check error message
   - ⏳ Pending - wait or retry

4. **If stuck for >2 minutes:**
   - Transaction likely dropped
   - Safe to retry
   - Solana has no "pending" state for long

## Security Incidents

### Suspected Compromise

If you suspect your wallet is compromised:

**Immediate actions:**

1. **Stop all operations immediately**

2. **Transfer funds to new secure wallet:**
```bash
# Create new wallet
node scripts/setup-wizard.js

# Transfer all SOL
node scripts/wallet.js send-sol NEW_ADDRESS ALL

# Transfer all tokens
node scripts/wallet.js tokens
# Note each mint address
node scripts/wallet.js send-token MINT NEW_ADDRESS AMOUNT
```

3. **Rotate all credentials:**
   - Change wallet password
   - Regenerate Privy auth keys
   - Update API keys
   - Change server credentials

4. **Investigate:**
   - Review transaction history
   - Check system logs
   - Scan for malware
   - Review recent access

### Unauthorized Transactions

If you see unauthorized transactions:

1. **Immediately transfer remaining funds** to new wallet

2. **Document everything:**
   - Transaction signatures
   - Amounts stolen
   - Timing
   - Any suspicious activity before/after

3. **Report to platform** (if applicable)

4. **Learn and improve security:**
   - Review WALLET_SECURITY.md
   - Enable additional authentication
   - Use hardware wallet for large amounts

## Data Migration

### Moving to New Machine

**Local wallet:**

1. **Copy encrypted wallet file:**
```bash
# From old machine
tar -czf wallet-backup.tar.gz ~/.openclaw/wallets/
scp wallet-backup.tar.gz new-machine:~/
```

2. **On new machine:**
```bash
tar -xzf wallet-backup.tar.gz -C ~/
```

3. **Copy .env file:**
```bash
cp /path/to/old/.env /path/to/new/.env
```

4. **Verify:**
```bash
node scripts/wallet.js balance
```

**Privy wallet:**

1. **Copy .env with Privy credentials**

2. **Copy authorization key:**
```bash
cp -r ~/.openclaw/wallets/privy new-machine:~/.openclaw/wallets/
```

3. **Verify:**
```bash
node scripts/wallet.js balance
```

### Upgrading to New Version

1. **Backup current setup:**
```bash
cp -r ~/.openclaw/wallets ~/openclaw-backup-$(date +%Y%m%d)
cp .env .env.backup
```

2. **Install new version:**
```bash
cd launchpad-trader-v2
git pull
npm install
```

3. **Test with small amount first**

4. **If issues, rollback:**
```bash
git checkout v1.0.0
npm install
```

## Getting Help

### Self-Service

1. **Check this document** for common issues

2. **Review configuration:**
```bash
node scripts/wallet.js config
```

3. **Test components:**
```bash
# Test wallet
node scripts/wallet.js info

# Test RPC
curl YOUR_RPC_URL -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Test LaunchPad API
curl http://localhost:3000/health
```

4. **Check logs** for detailed error messages

### Support Resources

**LaunchPad Platform:**
- Documentation: Local reference docs
- GitHub Issues: Platform repository
- Contact: Platform administrators

**Privy Support:**
- Docs: https://docs.privy.io
- Slack: https://privy.io/slack
- Status: https://status.privy.io

**Solana:**
- Docs: https://docs.solana.com
- Discord: https://solana.com/discord
- Status: https://status.solana.com

## Prevention

### Backup Checklist

- [ ] Recovery phrase written down
- [ ] Recovery phrase stored in safe
- [ ] Encrypted wallet file backed up
- [ ] Authorization keys backed up (Privy)
- [ ] .env configuration backed up
- [ ] Test recovery procedure quarterly

### Security Checklist

- [ ] Strong password (20+ characters)
- [ ] Unique password (not reused)
- [ ] File permissions correct (0600)
- [ ] No passwords in git
- [ ] No secrets in logs
- [ ] Regular security reviews

### Operational Checklist

- [ ] Test on devnet first
- [ ] Verify addresses before sending
- [ ] Start with small amounts
- [ ] Monitor transaction confirmations
- [ ] Keep software updated
- [ ] Review transactions regularly

## Emergency Contacts

**Critical security issue:**
1. Transfer funds immediately
2. Document evidence
3. Contact platform security team

**Lost access but not compromised:**
1. Attempt recovery using this guide
2. Contact support with details
3. Be prepared to prove ownership

**Bug or technical issue:**
1. Document error messages
2. Note steps to reproduce
3. Check GitHub issues
4. Create new issue if needed
