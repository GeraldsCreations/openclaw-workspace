# 🍆 Frontend → Database Audit Report

**Date:** 2026-02-03 09:48 UTC  
**Objective:** Comprehensive audit of frontend-backend alignment

---

## 🚨 Critical Issues Found

### 1. **Field Name Mismatch: Snake Case vs Camel Case**

**Problem:** Frontend uses `snake_case` but database/backend uses `camelCase`

#### Token Interface Mismatches:

| Frontend (api.service.ts) | Backend (token.entity.ts) | Status |
|---------------------------|---------------------------|--------|
| `image_url` | `imageUrl` | ❌ MISMATCH |
| `creator_type` | `creatorType` | ❌ MISMATCH |
| `bonding_curve` | `bondingCurve` | ❌ MISMATCH |
| `current_price` | `currentPrice` | ❌ MISMATCH |
| `market_cap` | `marketCap` | ❌ MISMATCH |
| `total_supply` | `totalSupply` | ❌ MISMATCH |
| `holder_count` | `holderCount` | ❌ MISMATCH |
| `volume_24h` | `volume24h` | ❌ MISMATCH |
| `graduated_at` | `graduatedAt` | ❌ MISMATCH |
| `created_at` | `createdAt` | ❌ MISMATCH |
| `updated_at` | `updatedAt` | ❌ MISMATCH |

**Impact:** HIGH - API responses won't map correctly to frontend interfaces

---

### 2. **Type Mismatch: totalSupply**

| Field | Backend Type | Frontend Type | Issue |
|-------|--------------|---------------|-------|
| `totalSupply` | `string` (bigint) | `number` | ❌ Data loss for large numbers |

**Reason:** Backend stores as `bigint` (string in JS) for precision, frontend expects number

**Risk:** Token supplies > 2^53 will lose precision

---

### 3. **Missing Fields**

#### Fields in Backend but NOT in Frontend:

**None identified** - Frontend has all backend fields (but with wrong names)

#### Fields in Frontend but NOT in Backend:

**None identified** - All frontend fields exist in backend

---

## 📋 Compilation Errors Fixed

### Error 1: `parseFloat(this.token.total_supply)` ✅

**Location:** `token-detail.component.ts:401`  
**Issue:** `total_supply` is already `number`, not `string`  
**Fix:** Changed to `this.token.total_supply || totalSupply`

### Error 2: `BotBadgeComponent` unused import ✅

**Location:** `bot-tokens.component.ts:37`  
**Issue:** Imported but not used in template  
**Fix:** Removed import and from imports array

---

## 🔧 Required Fixes

### Fix Option A: Change Frontend to Match Backend (RECOMMENDED)

**Change frontend interfaces to use camelCase:**

```typescript
// BEFORE (current - WRONG)
export interface Token {
  image_url?: string;
  creator_type: 'human' | 'clawdbot' | 'agent';
  bonding_curve: string;
  current_price: number;
  market_cap: number;
  total_supply: number;
  holder_count: number;
  volume_24h: number;
  graduated_at?: string;
  created_at: string;
  updated_at: string;
}

// AFTER (should be)
export interface Token {
  imageUrl?: string;
  creatorType: 'human' | 'clawdbot' | 'agent';
  bondingCurve: string;
  currentPrice: number;
  marketCap: number;
  totalSupply: string; // Keep as string for bigint precision
  holderCount: number;
  volume24h: number;
  graduatedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Then update all component references:**
- `token.image_url` → `token.imageUrl`
- `token.creator_type` → `token.creatorType`
- `token.bonding_curve` → `token.bondingCurve`
- `token.current_price` → `token.currentPrice`
- `token.market_cap` → `token.marketCap`
- `token.total_supply` → `token.totalSupply`
- `token.holder_count` → `token.holderCount`
- `token.volume_24h` → `token.volume24h`
- `token.graduated_at` → `token.graduatedAt`
- `token.created_at` → `token.createdAt`
- `token.updated_at` → `token.updatedAt`

**Files to Update:** ~15-20 component files

---

### Fix Option B: Add Backend Transformation Layer

**Add a @Transform decorator or serialization interceptor in backend:**

```typescript
// In backend controllers/services
@SerializeOptions({
  strategy: 'exposeAll',
  transform: (value) => snakeCaseTransform(value)
})
```

**Pros:**
- Don't have to change frontend
- Consistent API responses

**Cons:**
- Backend complexity
- Non-standard (most Node.js APIs use camelCase)

---

## 📊 Current Status

### ✅ Working Despite Mismatches?

**Possible reasons:**
1. Backend might be transforming responses to snake_case already
2. Frontend might be doing case conversion somewhere
3. Data is flowing but type checking is just wrong

**Need to verify:** Check actual API response format

---

## 🔍 Recommended Investigation

### Step 1: Check Actual API Response

```bash
curl http://localhost:3000/v1/tokens/trending | jq '.[0]'
```

**Look for:** Are fields `camelCase` or `snake_case`?

### Step 2: Check for Existing Transformers

**Search for:**
- `@Transform` decorators in backend
- Case conversion utilities
- Interceptors in frontend/backend

### Step 3: Check NestJS ClassTransform Config

**File:** `backend/src/main.ts`  
**Look for:** `transform: true` in ValidationPipe

---

## 🎯 Action Plan

### Immediate (Fix Compilation):
- ✅ Remove `parseFloat()` on `total_supply`
- ✅ Remove unused `BotBadgeComponent` import

### Short Term (Fix Type Safety):
1. Verify actual API response format (camelCase vs snake_case)
2. If backend returns camelCase: Update frontend interfaces
3. If backend returns snake_case: Add type conversion layer

### Long Term (Best Practices):
1. Use DTOs with class-transformer in backend
2. Add API response validation in frontend
3. Generate TypeScript types from backend (e.g., swagger codegen)
4. Add E2E tests to catch type mismatches

---

## 📈 Impact Assessment

**Current Risk Level:** 🟡 MEDIUM

**Why it might be working:**
- TypeScript types are compile-time only
- Runtime JavaScript doesn't care about types
- If backend is transforming to snake_case, it works
- If frontend has case conversion utility, it works

**Potential Issues:**
- Type safety is broken (false sense of security)
- Refactoring will be error-prone
- New developers will be confused
- Runtime bugs possible if transformation breaks

---

## 🔥 Hot Fix Priority

1. **HIGH:** Verify API response format (5 min)
2. **HIGH:** Fix totalSupply type (number → string for precision)
3. **MEDIUM:** Align field names (frontend ↔ backend)
4. **LOW:** Add API contract tests

---

**Next Step:** Check actual API response to determine which fix to apply.
