# 🚨 CRITICAL: Frontend-Backend Field Name Mismatch

## **Root Cause Discovered**

**Backend Returns:** `camelCase` (imageUrl, creatorType, bondingCurve, etc.)  
**Frontend Expects:** `snake_case` (image_url, creator_type, bonding_curve, etc.)

**Result:** All properties are **UNDEFINED** at runtime!

---

## **Evidence**

### Actual API Response:
```json
{
  "address": "11111111111111111111111111111112",
  "name": "Open Pump",
  "imageUrl": "https://via.placeholder.com/400?text=OPUMP",     ← camelCase
  "creatorType": "agent",                                        ← camelCase
  "bondingCurve": "11111111111111111111111111111113",          ← camelCase
  "currentPrice": "0.000100000",                                ← camelCase
  "marketCap": "0.000000000",                                   ← camelCase
  "totalSupply": "0",                                           ← camelCase
  "holderCount": 0,                                             ← camelCase
  "volume24h": "0.000000000",                                   ← camelCase
  "graduatedAt": null,                                          ← camelCase
  "createdAt": "2026-02-03T09:10:35.294Z",                    ← camelCase
  "updatedAt": "2026-02-03T09:10:35.294Z"                     ← camelCase
}
```

### Frontend Interface (WRONG):
```typescript
export interface Token {
  image_url?: string;          // ← Looking for snake_case (doesn't exist!)
  creator_type: string;        // ← Looking for snake_case (doesn't exist!)
  bonding_curve: string;       // ← Looking for snake_case (doesn't exist!)
  current_price: number;       // ← Looking for snake_case (doesn't exist!)
  market_cap: number;          // ← Looking for snake_case (doesn't exist!)
  total_supply: number;        // ← Looking for snake_case (doesn't exist!)
  holder_count: number;        // ← Looking for snake_case (doesn't exist!)
  volume_24h: number;          // ← Looking for snake_case (doesn't exist!)
  graduated_at?: string;       // ← Looking for snake_case (doesn't exist!)
  created_at: string;          // ← Looking for snake_case (doesn't exist!)
  updated_at: string;          // ← Looking for snake_case (doesn't exist!)
}
```

---

## **Why App "Works" But Crashes**

1. **Properties are undefined** because names don't match
2. **Null checks I added** return "0.00" instead of crashing
3. **Token cards show** because `name` and `symbol` match (no underscore)
4. **Prices/stats are all wrong** - showing zeros because fields are undefined

---

## **Impact**

### ❌ **Broken Features:**
- Token prices (undefined → shows "0.00")
- Market caps (undefined → shows "$0.00")
- Volume stats (undefined → shows "0.00 SOL")
- Creator type badges (undefined → not showing correctly)
- Token images (undefined → default placeholder)
- Graduation status indicators
- Portfolio values
- Chart data
- All numeric stats

### ✅ **What Still Works:**
- Token name (no underscore)
- Token symbol (no underscore)
- Token address (no underscore)
- Basic navigation

---

## **The Fix**

### **Update Frontend Interface (api.service.ts)**

```typescript
// CURRENT (WRONG) - Remove
export interface Token {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image_url?: string;              // ❌ WRONG
  creator: string;
  creator_type: 'human' | 'clawdbot' | 'agent';  // ❌ WRONG
  bonding_curve: string;           // ❌ WRONG
  current_price: number;           // ❌ WRONG
  market_cap: number;              // ❌ WRONG
  total_supply: number;            // ❌ WRONG (also wrong type)
  holder_count: number;            // ❌ WRONG
  volume_24h: number;              // ❌ WRONG
  graduated: boolean;
  graduated_at?: string;           // ❌ WRONG
  created_at: string;              // ❌ WRONG
  updated_at: string;              // ❌ WRONG
}

// CORRECT - Use This
export interface Token {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;               // ✅ Matches backend
  creator: string;
  creatorType: 'human' | 'clawdbot' | 'agent';  // ✅ Matches backend
  bondingCurve: string;            // ✅ Matches backend
  currentPrice: number;            // ✅ Matches backend
  marketCap: number;               // ✅ Matches backend
  totalSupply: string;             // ✅ Matches backend (string for bigint)
  holderCount: number;             // ✅ Matches backend
  volume24h: number;               // ✅ Matches backend
  graduated: boolean;
  graduatedAt?: string;            // ✅ Matches backend
  createdAt: string;               // ✅ Matches backend
  updatedAt: string;               // ✅ Matches backend
}
```

---

## **Files to Update**

### 1. **api.service.ts** (Interface)
Change interface definition

### 2. **All Components Using Token** (~20 files)
Update all references:

```typescript
// BEFORE
token.image_url        → token.imageUrl
token.creator_type     → token.creatorType
token.bonding_curve    → token.bondingCurve
token.current_price    → token.currentPrice
token.market_cap       → token.marketCap
token.total_supply     → token.totalSupply
token.holder_count     → token.holderCount
token.volume_24h       → token.volume24h
token.graduated_at     → token.graduatedAt
token.created_at       → token.createdAt
token.updated_at       → token.updatedAt
```

---

## **Affected Components**

### Core Components:
1. token-card.component.ts
2. token-header.component.ts
3. token-info-card.component.ts
4. token-detail.component.ts
5. live-chart.component.ts
6. activity-feed.component.ts
7. trade-interface.component.ts

### Feature Components:
8. home.component.ts
9. explore.component.ts
10. trending.component.ts
11. bot-tokens.component.ts
12. portfolio-card.component.ts
13. watchlist.component.ts

### Shared Components:
14. token-stats.component.ts
15. price-chart.component.ts

---

## **Rollout Strategy**

### Phase 1: Fix Interface (5 min)
Update `api.service.ts` interface to use camelCase

### Phase 2: Fix Components (30 min)
Search & replace all property references:
```bash
# Find all usages
grep -rn "\.image_url\|\.creator_type\|\.bonding_curve" src/
```

### Phase 3: Test (10 min)
1. Check token cards show real prices
2. Verify images load
3. Confirm creator badges work
4. Test portfolio values
5. Validate chart data

---

## **Immediate Action Required**

This is a **CRITICAL** bug that breaks most of the app's functionality. All numeric data is wrong/zero because field names don't match.

**Priority:** 🔴 URGENT  
**Estimated Time:** 45 minutes  
**Impact:** Fixes 90% of UI issues

---

**Ready to implement the fix?**
