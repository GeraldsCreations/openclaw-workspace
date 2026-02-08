# 🚀 Production Migration Checklist - Devnet → Mainnet

**Date:** 2026-02-05  
**Status:** PENDING APPROVAL  
**Risk Level:** HIGH (Real money operations)

---

## ⚠️ CRITICAL CHANGES REQUIRED

### 1. Backend Environment Variables (.env)

**Current (DEVNET):**
```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Required (MAINNET):**
```bash
# OPTION A: Public RPC (free, rate-limited)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# OPTION B: Paid RPC (recommended for production)
# Helius: https://docs.helius.dev/
# QuickNode: https://www.quicknode.com/
# Alchemy: https://www.alchemy.com/solana
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

**Why:** Backend uses this for ALL Solana operations (DBC, token creation, trading)

---

### 2. Backend Code Changes

#### A. Meteora Program IDs (HARDCODED)

**Files to change:**
- `src/meteora-api/services/transaction-builder.service.ts` (Line 36-37)
- `src/meteora-api/services/auto-pool-creation.service.ts` (Line 32)
- `src/meteora-api/services/pool-creation.service.ts` (Line 37)

**Current:**
```typescript
LBCLMM_PROGRAM_IDS['devnet']
```

**Required:**
```typescript
LBCLMM_PROGRAM_IDS['mainnet-beta']
```

**Impact:** Pool creation will FAIL if using devnet program IDs on mainnet

---

#### B. Transaction Builder Cluster

**File:** `src/meteora-api/services/transaction-builder.service.ts`

**Current:**
```typescript
cluster: 'devnet',
```

**Required:**
```typescript
cluster: 'mainnet-beta',
```

---

#### C. Fallback RPC URLs (Default values)

**Files with hardcoded devnet fallbacks:**
- `src/meteora-api/services/meteora.service.ts`
- `src/indexer/indexer.service.ts`
- `src/public-api/services/blockchain.service.ts`
- `src/public-api/services/holders.service.ts`
- `src/scripts/add-token.ts`

**Current:**
```typescript
const rpcUrl = this.configService.get('SOLANA_RPC_URL') || 'https://api.devnet.solana.com';
```

**Required:**
```typescript
const rpcUrl = this.configService.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
```

**Why:** If .env is missing, app should fail-safe to mainnet, not devnet

---

### 3. Frontend Environment Variables

**Files:**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

**Current:**
```typescript
solanaRpcUrl: 'https://api.devnet.solana.com',
solanaNetwork: 'devnet'
```

**Required:**
```typescript
solanaRpcUrl: 'https://api.mainnet-beta.solana.com', // Or paid RPC
solanaNetwork: 'mainnet-beta'
```

**Impact:** Wallet connection, blockchain queries, explorer links

---

### 4. Frontend Code Changes

#### A. Explorer Links (User-facing)

**Files with Solscan devnet links:**
- `src/app/shared/components/wallet-button.component.ts` (Line ~TBD)
- `src/app/features/token-detail/components/token-info-card.component.ts`
- `src/app/features/token-detail/components/activity-feed.component.ts`

**Current:**
```typescript
https://solscan.io/address/${address}?cluster=devnet
https://solscan.io/token/${tokenAddress}?cluster=devnet
```

**Required:**
```typescript
https://solscan.io/address/${address}
https://solscan.io/token/${tokenAddress}
// (No cluster param = mainnet by default)
```

---

#### B. Airdrop Feature

**File:** `src/app/shared/components/wallet-button.component.ts`

**Current:** Airdrop button visible and functional

**Required:** 
```typescript
// DISABLE or REMOVE airdrop feature (mainnet doesn't support airdrops)
// Option 1: Hide button when network === 'mainnet-beta'
// Option 2: Remove airdrop method entirely
```

---

### 5. Database Changes

#### A. DBC Platform Config

**Current config (DEVNET):**
```
Address: 56JeApcTgcSEE6mNJ5ygv4i7rkzjCiVgpuwPD4UE8r7V
```

**Action Required:**
⚠️ **CREATE NEW CONFIG ON MAINNET** ⚠️

You CANNOT reuse devnet config on mainnet. You must:
1. Fund platform wallet on mainnet (needs SOL for fees)
2. Call `/v1/dbc/admin/init-config` to create mainnet config
3. Update `platform_config` table with new address

**Cost:** ~0.5 SOL for config creation + ongoing fees

---

#### B. Existing Tokens

**Current:** 2 tokens in DB (UNBAGGED, Clawlancer)

**Action Required:**
- ✅ Clawlancer: Already on mainnet (keep)
- ❌ UNBAGGED: If devnet-only, remove or mark as test data

---

### 6. Wallet & Keys

#### A. Platform Wallet

**Current:** Devnet wallet (has devnet SOL)

**Required:** 
- **NEW mainnet wallet** (separate keypair)
- Fund with real SOL (minimum 2-5 SOL recommended)
- Update `PLATFORM_WALLET_PRIVATE_KEY` in .env

**Security:** 
- ⚠️ Mainnet wallet = REAL MONEY
- Use hardware wallet or secure key management
- NEVER commit mainnet keys to git
- Consider multi-sig for high-value operations

---

#### B. Test/Debug Wallets

**Action:** Remove or disable any test wallet keys from .env

---

### 7. Railway Environment Variables

**Backend service needs:**
```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # Or paid RPC
PLATFORM_WALLET_PRIVATE_KEY=[NEW_MAINNET_WALLET]
DBC_PLATFORM_CONFIG_KEY=[WILL_BE_SET_AFTER_INIT]
```

**Frontend service needs:**
```bash
# (Built into compiled code from environment.ts)
# No runtime env vars needed
```

---

## 📊 IMPACT ANALYSIS

### High Risk Changes:
1. **Wallet keypair** - Wrong network = lost funds
2. **Program IDs** - Wrong network = failed transactions
3. **DBC config** - Must recreate on mainnet
4. **RPC URL** - Devnet RPC on mainnet = no data

### Medium Risk Changes:
1. **Explorer links** - Wrong cluster = user confusion
2. **Airdrop feature** - Doesn't work on mainnet
3. **Fallback URLs** - Could default to wrong network

### Low Risk Changes:
1. **Test scripts** - Don't affect production
2. **Comments** - No functional impact

---

## ✅ TESTING CHECKLIST (BEFORE DEPLOY)

**Pre-deployment:**
- [ ] Create and fund mainnet platform wallet
- [ ] Update all .env variables (both local and Railway)
- [ ] Update hardcoded program IDs in code
- [ ] Fix explorer links (remove ?cluster=devnet)
- [ ] Disable/remove airdrop feature
- [ ] Rebuild frontend (verify mainnet URLs in bundle)
- [ ] Rebuild backend (verify mainnet program IDs)

**Post-deployment:**
- [ ] Call `/v1/dbc/admin/init-config` to create mainnet config
- [ ] Verify backend connects to mainnet RPC
- [ ] Test wallet connection (should show mainnet)
- [ ] Check explorer links open to mainnet
- [ ] Verify token creation uses mainnet program IDs
- [ ] Test small transaction (0.001 SOL) before full launch

---

## 💰 COST ESTIMATE

**One-time:**
- DBC platform config creation: ~0.5 SOL ($50-100)
- Test transactions: ~0.01 SOL ($1-2)

**Ongoing:**
- Transaction fees: 0.000005 SOL per tx
- Token creation: 0.002 SOL + liquidity
- RPC service (if paid): $50-500/month depending on usage

---

## 🚨 ROLLBACK PLAN

If mainnet deployment fails:

1. **Revert environment variables** to devnet
2. **Redeploy previous commit** (before mainnet changes)
3. **Database:** Config table still has devnet config
4. **No data loss** - mainnet and devnet are separate

**Rollback time:** ~5 minutes

---

## 📝 NOTES

- **Do NOT deploy during high network congestion**
- **Monitor first 24h closely** (watch for failed txs)
- **Keep devnet environment** as staging/testing
- **Consider gradual rollout** (limited user access first)

---

**Status:** READY FOR REVIEW  
**Approver:** Chadizzle  
**Estimated Time:** 2-3 hours for full migration

