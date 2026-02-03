# Wallet Security Guide

Comprehensive security architecture and best practices for LaunchPad Trader wallets.

## Security Architecture

### Privy Wallets (MPC)

**Technology:** Multi-Party Computation with Shamir's Secret Sharing

```
Wallet Private Key
       │
       ▼
[Key Split Algorithm]
       │
       ├──► Share 1 (Secure Server A)
       ├──► Share 2 (Secure Server B)
       ├──► Share 3 (Secure Server C)
       └──► Share N (Secure Server N)

Key Reconstruction (only in secure enclave):
    Threshold (T) of N shares required
    Example: 3 of 5 shares needed
```

**Security Properties:**
- ✅ No single point of failure
- ✅ Shares distributed across independent secure infrastructure
- ✅ Key reconstruction only in trusted execution environment
- ✅ Authorization keys provide access control
- ✅ Policies enforce additional guardrails

### Local Encrypted Wallets

**Technology:** AES-256-GCM encryption with scrypt key derivation

```
Password
   │
   ▼
[scrypt KDF]
   │ (salt, N=16384, r=8, p=1)
   ▼
256-bit Key
   │
   ▼
[AES-256-GCM Cipher]
   │ (with random IV + auth tag)
   ▼
Encrypted Keypair
   │
   ▼
Saved to disk (mode 0600)
```

**Security Properties:**
- ✅ Military-grade AES-256 encryption
- ✅ Strong key derivation (scrypt resistant to brute-force)
- ✅ Authenticated encryption (GCM mode prevents tampering)
- ✅ BIP39 recovery phrases for portability
- ✅ Restrictive file permissions

## Encryption Details

### AES-256-GCM

**Algorithm:** Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode

**Parameters:**
- Key size: 256 bits (32 bytes)
- IV size: 128 bits (16 bytes, randomly generated)
- Auth tag: 128 bits (16 bytes)
- Mode: GCM (provides both confidentiality and authenticity)

**Properties:**
- Authenticated encryption (detects tampering)
- Resistant to padding oracle attacks
- NIST approved for classified information
- Industry standard for secure storage

### Scrypt Key Derivation

**Algorithm:** Sequential memory-hard key derivation function

**Parameters:**
- Salt: 256 bits (32 bytes, randomly generated)
- N: 16384 (CPU/memory cost parameter)
- r: 8 (block size parameter)
- p: 1 (parallelization parameter)
- Output: 256 bits (32 bytes)

**Properties:**
- Memory-hard (resists GPU/ASIC attacks)
- Adjustable difficulty
- Slower than bcrypt (better for key derivation)
- NIST recommended

### BIP39 Recovery Phrases

**Standard:** Bitcoin Improvement Proposal 39

**Supported:**
- 12 words (128 bits entropy)
- 24 words (256 bits entropy)

**Derivation Path:** `m/44'/501'/0'/0'` (Solana standard)

**Properties:**
- Human-readable backup
- Checksum included (last word)
- Compatible with Phantom, Solflare, etc.
- Portable across wallets

## Threat Model

### Threats Mitigated

#### 1. Offline Attacks (Encrypted File Stolen)

**Threat:** Attacker gains access to encrypted wallet file

**Mitigations:**
- AES-256-GCM encryption
- Strong password required (minimum 8 characters)
- Scrypt KDF (slow to brute-force)
- File permissions (0600)

**Attack Cost:** ~$1M+ to brute-force 8-character password with scrypt

#### 2. Memory Attacks (Process Dump)

**Threat:** Attacker dumps process memory while wallet is unlocked

**Mitigations:**
- Keys kept in memory only when needed
- No long-term storage of plaintext keys
- Privy: Keys never in client memory

**Note:** If attacker has root access, all local wallets are vulnerable. Use Privy for better protection.

#### 3. Keyloggers

**Threat:** Attacker captures password as it's typed

**Mitigations:**
- Password not echoed to screen
- Environment variable option (`WALLET_PASSWORD`)
- Privy: No password needed

**Best Practice:** Use Privy or secure password manager

#### 4. Malicious Transactions

**Threat:** Malware signs unauthorized transactions

**Mitigations:**
- Transaction review before signing
- Privy policies (limits, whitelists)
- Rate limiting
- Monitoring/alerts

#### 5. Key Loss

**Threat:** Wallet file or password lost/corrupted

**Mitigations:**
- BIP39 recovery phrases (local wallets)
- Secure backup procedures
- Privy: Authorization keys backed up

**Recovery:** See [RECOVERY.md](RECOVERY.md)

### Threats Not Mitigated

#### 1. Compromised Device

If attacker has root/admin access to your device:
- Can read plaintext keys from memory
- Can intercept passwords
- Can modify wallet software

**Mitigation:** Use hardware security module or air-gapped device for high-value operations

#### 2. Phishing

Attacker tricks user into revealing credentials or signing malicious transactions.

**Mitigation:**
- Always verify transaction details
- Never share recovery phrases
- Check URLs carefully
- Use bookmarks for important sites

#### 3. Social Engineering

Attacker manipulates user into compromising security.

**Mitigation:**
- Security awareness training
- Never share credentials
- Verify requests through alternative channels

## Best Practices

### Password Selection

**Minimum Requirements:**
- 8+ characters
- Mix of letters, numbers, symbols
- Not based on dictionary words
- Unique to this wallet

**Recommendations:**
- Use password manager
- 20+ characters ideal
- Randomly generated
- Different for each wallet

**Example strong password:**
```
cQ8#mPvN!kLrX2$wZbF9@
```

### Recovery Phrase Security

**DO:**
- ✅ Write down on paper immediately
- ✅ Store in fireproof safe
- ✅ Consider metal backup (fireproof/waterproof)
- ✅ Split between multiple secure locations
- ✅ Test recovery periodically

**DON'T:**
- ❌ Take photo with phone
- ❌ Store in email/cloud
- ❌ Share with anyone
- ❌ Store on computer
- ❌ Use for multiple wallets

### File Permissions

Wallet files should have restrictive permissions:

```bash
# Check permissions
ls -la ~/.openclaw/wallets/

# Should show: -rw------- (0600)
# Owner: read/write
# Group: none
# Others: none

# Fix if needed:
chmod 600 ~/.openclaw/wallets/launchpad-trader-v2.enc
```

### Environment Variables

**Secure handling:**

```bash
# Set temporarily (not saved to history)
export WALLET_PASSWORD="your-password"

# Or use secrets manager
export WALLET_PASSWORD=$(vault read -field=password secret/wallet)

# Clear when done
unset WALLET_PASSWORD
```

**Don't:**
- Store in `.bashrc` or `.zshrc`
- Commit to git
- Log to files
- Echo to screen

### Privy Authorization Keys

**Backup:**
```bash
# Backup auth key (encrypted)
tar -czf auth-key-backup.tar.gz ~/.openclaw/wallets/privy/
openssl enc -aes-256-cbc -salt -in auth-key-backup.tar.gz -out auth-key-backup.tar.gz.enc
rm auth-key-backup.tar.gz

# Store encrypted backup in secure location
```

**Rotation:**
```bash
# Generate new auth key
# Create new Privy wallet with new key
# Transfer funds from old wallet
# Delete old auth key

rm ~/.openclaw/wallets/privy/*-auth-key.json
```

## Security Checklist

### Initial Setup

- [ ] Strong password chosen (20+ characters)
- [ ] Recovery phrase written down
- [ ] Recovery phrase stored in safe location
- [ ] Wallet file permissions verified (0600)
- [ ] Test wallet creation/recovery on devnet

### Regular Operations

- [ ] Verify transaction details before signing
- [ ] Monitor wallet activity for anomalies
- [ ] Keep software up to date
- [ ] Review and rotate passwords quarterly
- [ ] Test recovery procedure annually

### Production Deployment

- [ ] Privy account with appropriate plan
- [ ] Private RPC configured
- [ ] Transaction limits/policies configured
- [ ] Monitoring and alerting set up
- [ ] Backup procedures documented
- [ ] Incident response plan defined

## Incident Response

### Suspected Compromise

1. **Immediate Actions:**
   - Stop all operations
   - Transfer funds to new secure wallet
   - Rotate all credentials (passwords, API keys)
   - Review transaction history

2. **Investigation:**
   - Check system logs
   - Review recent access
   - Identify attack vector
   - Document findings

3. **Recovery:**
   - Create new wallet with new credentials
   - Update application configuration
   - Verify security of new setup
   - Resume operations

### Lost Credentials

**Lost Password (with recovery phrase):**
1. Create new wallet via import
2. Use recovery phrase
3. Set new password
4. Verify access
5. Update configuration

**Lost Recovery Phrase:**
- If password still known: Continue using wallet
- If both lost: Funds are permanently inaccessible

**Lost Privy Auth Key:**
- Create new auth key
- Create new wallet
- Transfer funds from old wallet

## Compliance

### Data Protection

**Personal Data:**
- Wallet addresses (public)
- Transaction history (public blockchain)
- No personal information stored

**GDPR:**
- No personal data collected
- User controls all keys/data
- Right to be forgotten: Delete local files

### Financial Regulations

**NOT a custodian:**
- User maintains full control
- No access to user funds
- No financial services provided

**Bot traders:**
- May require money transmitter license (jurisdiction-dependent)
- Consult legal counsel for compliance

## Audit Log

For production deployments, maintain audit logs:

```javascript
{
  "timestamp": "2024-01-15T10:30:00Z",
  "action": "sign_transaction",
  "wallet": "7xKXtg...",
  "transaction_type": "token_buy",
  "amount": "1.5 SOL",
  "status": "success",
  "signature": "5a3f..."
}
```

**Log:**
- All wallet operations
- Transaction details
- Success/failure status
- User actions

**Don't log:**
- Passwords
- Private keys
- Recovery phrases

## Resources

- **NIST Cryptography:** https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines
- **OWASP Secrets Management:** https://owasp.org/www-project-secrets-management-cheat-sheet/
- **Solana Security:** https://docs.solana.com/security
- **Privy Security:** https://docs.privy.io/security

## Updates

This document should be reviewed and updated:
- After security incidents
- When new threats emerge
- After dependency updates
- Quarterly as part of security review
