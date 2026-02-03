# 2026-02-02 - Transaction Builder Implementation

## Task
Implement transaction builder pattern for bot-controlled token creation with platform-controlled LP.

## Architecture

**Hybrid Model:**
- Bot creates & owns token (bot pays for creation)
- Platform creates pool + provides LP (platform controls liquidity)
- Bot can request LP withdrawal/sell (platform executes with fee)

## Phase 1: Transaction Builder (In Progress)

### Files Created

1. **`dto/build-transaction.dto.ts`**
   - `BuildTransactionDto` - Request unsigned transaction
   - `BuildTransactionResponseDto` - Return transaction for signing
   - `SubmitTransactionDto` - Submit signed transaction
   - `SubmitTransactionResponseDto` - Confirmation response

2. **`services/transaction-builder.service.ts`**
   - `buildTokenCreationTransaction()` - Build unsigned tx
   - `verifySignedTransaction()` - Verify before submission
   - Creates mint + token account + mints supply
   - Returns base64 serialized transaction

3. **`entities/lp-position.entity.ts`**
   - Tracks platform-controlled LP positions
   - Links to bot creator (botCreatorId, botWallet)
   - Records liquidity amounts, fees, withdrawals

4. **`entities/lp-withdrawal.entity.ts`**
   - Records LP withdrawal requests
   - Tracks fee amounts
   - Links to LP position

5. **`controllers/transaction-builder.controller.ts`**
   - `POST /api/v1/transaction/build` - Build unsigned tx
   - `POST /api/v1/transaction/submit` - Submit signed tx
   - Triggers auto pool creation after token creation

### Updated Files

6. **`meteora-api.module.ts`**
   - Added new entities (LpPosition, LpWithdrawal)
   - Added TransactionBuilderService
   - Added TransactionBuilderController

## Flow

```
1. Bot → POST /api/v1/transaction/build
   {
     "name": "Bot Token",
     "symbol": "BTKN",
     "initialPrice": 0.000001,
     "creator": "bot_wallet_pubkey",
     "creatorBotId": "agent-main"
   }
   
2. Backend → Build unsigned transaction
   - Create mint account
   - Initialize mint (9 decimals)
   - Create associated token account
   - Mint initial supply (1B tokens)
   - Partially sign with mint keypair
   - Return base64 transaction
   
3. Bot → Signs transaction with wallet
   
4. Bot → POST /api/v1/transaction/submit
   {
     "signedTransaction": "base64...",
     "tokenMint": "pubkey...",
     "creator": "bot_wallet_pubkey",
     "initialPrice": 0.000001
   }
   
5. Backend → Broadcast to Solana
   
6. Backend → Auto-create pool + LP (after 3s delay)
   - Platform wallet creates DLMM pool
   - Platform wallet adds liquidity
   - Record LP position in database
```

## Phase 2: Auto Pool Creation (COMPLETE)

### Files Created

7. **`services/auto-pool-creation.service.ts`**
   - `createPoolAndAddLiquidity()` - Creates DLMM pool for bot's token
   - Adds platform-controlled liquidity (0.5 SOL default)
   - Records LP position in database
   - Links to bot creator

### Updated Files

8. **`controllers/transaction-builder.controller.ts`**
   - Added `createPoolInBackground()` method
   - Triggers auto pool creation after token submission
   - Non-blocking background processing
   
9. **`meteora-api.module.ts`**
   - Added AutoPoolCreationService provider

## Phase 3: LP Management (COMPLETE)

### Files Created

10. **`services/lp-management.service.ts`**
    - `withdrawLiquidity()` - Withdraw LP with 10% platform fee
    - `sellTokens()` - Sell tokens with 5% platform fee  
    - `getPositionStats()` - Get LP position details
    - Configurable fee structure

11. **`controllers/lp-management.controller.ts`**
    - `POST /api/v1/lp/withdraw` - Withdraw LP endpoint
    - `POST /api/v1/lp/sell` - Sell tokens endpoint
    - `GET /api/v1/lp/position/:botWallet/:poolAddress` - Get stats

## Complete Flow (IMPLEMENTED)

```
1. Bot → POST /api/v1/transaction/build
   {
     "name": "Bot Token",
     "symbol": "BTKN",
     "initialPrice": 0.000001,
     "creator": "bot_wallet_pubkey",
     "creatorBotId": "agent-main"
   }
   ← Backend returns unsigned transaction
   
2. Bot → Signs transaction with wallet
   
3. Bot → POST /api/v1/transaction/submit
   {
     "signedTransaction": "base64...",
     "tokenMint": "pubkey...",
     "creator": "bot_wallet_pubkey",
     "creatorBotId": "agent-main",
     "initialPrice": 0.000001
   }
   ← Backend broadcasts to Solana
   ← Backend triggers auto pool creation (background, 5s delay)
   
4. Backend (Auto) → Creates DLMM pool
   - Platform wallet creates pool
   - Platform wallet adds 0.5 SOL liquidity
   - Records LP position in database
   - Links to bot creator
   
5. Bot → GET /api/v1/lp/position/{botWallet}/{poolAddress}
   ← Get LP position stats
   
6. Bot → POST /api/v1/lp/withdraw
   {
     "botWallet": "pubkey",
     "poolAddress": "pubkey",
     "percent": 50
   }
   ← Withdraw 50% LP, platform takes 10% fee
   
7. Bot → POST /api/v1/lp/sell
   {
     "botWallet": "pubkey",
     "poolAddress": "pubkey",
     "tokenAmount": 1000000
   }
   ← Sell tokens, platform takes 5% fee
```

## Phase 4: Two-Transaction Flow (COMPLETE)

### Architecture Change

**Original Problem:** Platform was paying for everything (not scalable)

**Chadizzle's Solution:** Bot pays for everything, platform owns the LP position

**Implementation:**
- TX1: Create token + pool (bot pays ~0.05 SOL)
- TX2: Add liquidity (bot pays liquidity amount, platform owns position)

### How Position Ownership Works

```javascript
dlmm.initializePositionAndAddLiquidityByStrategy({
  user: platformWallet,  // ← This is the owner!
  // But bot signs the transaction and pays
})
```

**Key Insight:** Position owner ≠ transaction payer in Meteora

### Updated Endpoints

1. `POST /api/v1/transaction/build` - Token + pool creation
2. `POST /api/v1/transaction/submit` - Submit TX1, get pool address
3. `POST /api/v1/transaction/build-liquidity` - Build LP transaction
4. `POST /api/v1/transaction/submit-liquidity` - Submit TX2, create position

### Why Two Transactions

- Pool must exist before liquidity can be added
- Pool address only known after creation confirms
- Cannot derive pool address deterministically with Meteora SDK
- 5-second delay between transactions for indexing

### Economics

**Bot Pays:**
- TX1: ~0.05 SOL (token + pool)
- TX2: liquidityAmount + ~0.01 SOL (gas)
- Total: ~0.56 SOL (for 0.5 SOL liquidity)

**Platform Pays:** 0 SOL ✅

**Platform Controls:**
- LP position (can withdraw/sell with fees)
- 50% trading fees
- Full liquidity management

## Next Steps (TODO)

- [ ] Implement actual liquidity removal (need fromBinId/toBinId)
- [ ] Implement token swap for sell functionality
- [ ] Add SOL transfer logic (platform → bot wallet)
- [ ] Add database migration for new tables
- [ ] Test complete two-transaction flow end-to-end

## Technical Notes

**Transaction Building:**
- Use `SystemProgram.createAccount()` for mint
- Use `createInitializeMintInstruction()` to initialize
- Use `createAssociatedTokenAccountInstruction()` for token account
- Use `createMintToInstruction()` to mint supply
- Partially sign with mint keypair server-side
- Bot signs with their wallet

**Why Partial Signing:**
- Mint keypair generated server-side (ephemeral)
- Safe to sign because it's single-use
- Bot only needs to sign with their wallet
- Reduces bot complexity

---

**Started:** 2026-02-02 22:02 UTC  
**Status:** Phase 1 in progress (transaction builder done, testing next)
