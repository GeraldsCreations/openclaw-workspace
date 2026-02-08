# Phase 1 Implementation - Task Breakdown

**Status:** ✅ APPROVED by Chadizzle  
**Start Date:** 2026-02-08  
**Target Completion:** 2-3 days  
**Total Effort:** 18-26 hours

---

## Phase 1A: Frontend Refactor (4-6 hours)

**Assigned to:** Frontend Developer  
**Priority:** HIGH  
**Goal:** Remove human token creation UI, elevate AI token discovery

### Task 1A.1: Remove Token Creation UI (2-3h)

**Files to modify:**
1. `/launchpad-frontend/src/app/app.html`
   - Remove "Create" link from main navigation (line ~48)
   - Keep: Home, Analytics, Wallet
   - Add: "AI Tokens" link to `/bot-tokens`

2. `/launchpad-frontend/src/app/features/home/home.component.ts`
   - Remove "Create Token" CTA button from hero section (line ~52)
   - Replace with "Explore AI Tokens" button → `/bot-tokens`
   - Update hero text: "Trade Tokens Created by AI Agents"

3. `/launchpad-frontend/src/app/components/mobile-bottom-nav/mobile-bottom-nav.component.ts`
   - Remove "Create" button from mobile navigation
   - Replace with "AI Tokens" or adjust layout

4. `/launchpad-frontend/src/app/app.routes.ts`
   - **Option A:** Remove `/create` route entirely
   - **Option B:** Redirect `/create` → `/bot-tokens`
   - **Option C:** Create info page explaining "Agent-only creation"
   - **Recommended:** Option B (graceful redirect)

**Acceptance Criteria:**
- ✅ No "Create Token" button visible anywhere in UI
- ✅ Navigation shows "AI Tokens" instead
- ✅ Mobile nav updated
- ✅ `/create` route handled gracefully

---

### Task 1A.2: Elevate Bot Token Discovery (1-2h)

**Files to modify:**
1. `/launchpad-frontend/src/app/features/home/home.component.ts`
   - Add "AI Tokens" section below hero
   - Feature 4-6 bot-created tokens on home page
   - Add "View All AI Tokens" link

2. `/launchpad-frontend/src/app/features/bot-tokens/bot-tokens.component.ts`
   - Verify component is production-ready
   - Ensure bot badges display correctly
   - Check stats section works

**Acceptance Criteria:**
- ✅ Home page features AI tokens prominently
- ✅ Bot tokens page accessible from main nav
- ✅ Bot badges visible and correct

---

### Task 1A.3: Update Messaging (1h)

**Files to modify:**
1. `/launchpad-frontend/src/app/features/home/home.component.ts`
   - Update hero title: "Trade Tokens Created by AI Agents"
   - Update subtitle: "Discover unique tokens created by autonomous AI bots"
   - Update CTA: "Explore AI Tokens" not "Create Token"

2. `/launchpad-frontend/src/app/app.html`
   - Update footer tagline if needed
   - Verify branding consistency

**Acceptance Criteria:**
- ✅ All copy reflects "AI creator / Human trader" model
- ✅ No references to human token creation
- ✅ Platform purpose is clear

---

### Task 1A.4: Testing & Documentation (0.5-1h)

**Tasks:**
1. Test all navigation flows
2. Verify mobile responsive behavior
3. Check bot badges render correctly
4. Update `STYLE_GUIDE.md` if needed
5. Screenshot before/after for LEARNED.md

**Acceptance Criteria:**
- ✅ All routes work correctly
- ✅ No broken links
- ✅ Mobile navigation functional
- ✅ Documentation updated

---

## Phase 1B: Backend Enforcement (2-3 hours)

**Assigned to:** Backend Developer  
**Priority:** CRITICAL  
**Goal:** Prevent humans from creating tokens via API

### Task 1B.1: Create Agent-Only Guard (1-1.5h)

**Files to create:**
1. `/launchpad-backend/src/auth/guards/agent-only.guard.ts` (NEW FILE)

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AgentOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const creatorType = request.body.creatorType;
    
    // Allow: 'agent' | 'clawdbot'
    // Block: 'human' | undefined | null
    if (!creatorType || creatorType === 'human') {
      throw new ForbiddenException(
        'Token creation is restricted to AI agents only. ' +
        'Human users can trade tokens via the web UI. ' +
        'To create tokens, use the LaunchPad API with an AI agent.'
      );
    }
    
    return true;
  }
}
```

**Files to modify:**
2. `/launchpad-backend/src/public-api/controllers/tokens.controller.ts`
   - Add `@UseGuards(AgentOnlyGuard)` to `@Post('create')` endpoint
   - Import the new guard

```typescript
import { AgentOnlyGuard } from '../../auth/guards/agent-only.guard';

@Post('create')
@UseGuards(JwtAuthGuard, AgentOnlyGuard) // ADD AgentOnlyGuard
@ApiBearerAuth('JWT')
async createToken(@Body() dto: CreateTokenDto) {
  // Existing code...
}
```

**Acceptance Criteria:**
- ✅ Guard created and tested
- ✅ Applied to token creation endpoint
- ✅ Returns clear error message for humans
- ✅ Allows agent creation to proceed

---

### Task 1B.2: Update API Documentation (0.5-1h)

**Files to modify:**
1. `/launchpad/APIs.md`
   - Add warning to `POST /tokens/create` section
   - Document `creatorType` requirement
   - Explain agent-only restriction

```markdown
### POST `/v1/tokens/create`

**RESTRICTION:** This endpoint is for AI agents only.

Requests with `creatorType: 'human'` or missing `creatorType` will be rejected with HTTP 403.

**Valid creator types:**
- `agent` - Generic AI agent
- `clawdbot` - ClawdBot agent

**Human users:** Use the web UI to trade tokens. Token creation is not available for human accounts.

**AI agents:** See `AI_AGENT_GUIDE.md` for integration instructions.
```

**Acceptance Criteria:**
- ✅ API docs clearly state restriction
- ✅ Error response documented
- ✅ Alternative actions for humans documented

---

### Task 1B.3: Write Tests (0.5h)

**Files to create:**
1. `/launchpad-backend/src/auth/guards/agent-only.guard.spec.ts` (NEW FILE)

**Test cases:**
- ✅ Blocks `creatorType: 'human'`
- ✅ Blocks missing `creatorType`
- ✅ Allows `creatorType: 'agent'`
- ✅ Allows `creatorType: 'clawdbot'`
- ✅ Returns correct error message

**Acceptance Criteria:**
- ✅ All tests passing
- ✅ Guard behavior verified

---

## Phase 1C: Agent Integration (12-17 hours)

**Assigned to:** Backend Developer  
**Priority:** HIGH  
**Goal:** Enable autonomous AI agent token creation

### Task 1C.1: API Key Authentication System (6-8h)

**Files to create:**

1. `/launchpad-backend/src/database/entities/api-key.entity.ts` (NEW FILE)
```typescript
@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  keyHash: string; // SHA-256 hash of API key

  @Column()
  walletAddress: string; // Associated wallet

  @Column({ default: 'agent' })
  tier: 'agent' | 'bot' | 'pro'; // Rate limit tier

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  name: string; // Agent name/description

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  lastUsedAt: Date;
}
```

2. `/launchpad-backend/src/database/migrations/YYYYMMDDHHMMSS-create-api-keys-table.ts` (NEW FILE)
   - Create migration for api_keys table

3. `/launchpad-backend/src/auth/guards/api-key-auth.guard.ts` (NEW FILE)
```typescript
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);
    
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const apiKeyRecord = await this.apiKeyRepository.findOne({
      where: { keyHash, active: true },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Update last used timestamp
    await this.apiKeyRepository.update(apiKeyRecord.id, {
      lastUsedAt: new Date(),
    });

    // Attach wallet to request
    request.user = { walletAddress: apiKeyRecord.walletAddress };
    
    return true;
  }

  private extractApiKey(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    
    const [type, key] = authHeader.split(' ');
    return type === 'Bearer' ? key : null;
  }
}
```

4. `/launchpad-backend/src/auth/auth.controller.ts`
   - Add new endpoint: `POST /auth/create-api-key`

```typescript
@Post('create-api-key')
@UseGuards(JwtAuthGuard) // Requires wallet auth first
@HttpCode(HttpStatus.OK)
async createApiKey(
  @Request() req,
  @Body('name') name?: string,
): Promise<{ apiKey: string; walletAddress: string }> {
  const apiKey = this.authService.generateApiKey();
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  await this.apiKeyRepository.save({
    keyHash,
    walletAddress: req.user.walletAddress,
    tier: 'agent',
    name: name || 'Unnamed Agent',
  });

  return {
    apiKey,
    walletAddress: req.user.walletAddress,
    message: 'API key created. Store this securely - it cannot be recovered.',
  };
}
```

**Acceptance Criteria:**
- ✅ API key entity created
- ✅ Database migration runs successfully
- ✅ API key guard implemented
- ✅ Creation endpoint works
- ✅ Keys are hashed (never stored plaintext)
- ✅ Rate limiting respects tier

---

### Task 1C.2: Submit Transaction Endpoint (4-6h)

**Files to create:**

1. `/launchpad-backend/src/public-api/controllers/tokens.controller.ts`
   - Add new endpoint: `POST /tokens/create-and-submit`

```typescript
@Post('create-and-submit')
@UseGuards(ApiKeyAuthGuard, AgentOnlyGuard) // API key required
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Create token and submit transaction (AI agents only)' })
async createAndSubmitToken(
  @Body() dto: CreateTokenDto,
  @Request() req,
): Promise<{
  success: boolean;
  tokenMint: string;
  poolAddress: string;
  signature: string;
  explorerUrl: string;
}> {
  // Build transaction with agent's wallet from API key
  const result = await this.tokenService.createAndSubmitToken({
    ...dto,
    creator: req.user.walletAddress, // From API key guard
  });

  return result;
}
```

2. `/launchpad-backend/src/public-api/services/token.service.ts`
   - Add method: `createAndSubmitToken()`

```typescript
async createAndSubmitToken(dto: CreateTokenDto): Promise<any> {
  // Get agent wallet keypair from secure storage
  const agentWallet = await this.loadAgentWallet(dto.creator);
  
  // Build transaction (existing logic from buildCreateTokenTransaction)
  const tx = await this.dbcService.buildCreateTokenTransaction(dto);
  
  // Sign with mint keypair (already done by DBC service)
  // Sign with agent wallet
  const transaction = Transaction.from(Buffer.from(tx.transaction, 'base64'));
  transaction.partialSign(agentWallet);
  
  // Submit to Solana RPC
  const signature = await this.connection.sendRawTransaction(
    transaction.serialize(),
    { skipPreflight: false, commitment: 'confirmed' }
  );
  
  // Wait for confirmation
  await this.connection.confirmTransaction(signature, 'confirmed');
  
  return {
    success: true,
    tokenMint: tx.tokenMint,
    poolAddress: tx.poolAddress,
    signature,
    explorerUrl: `https://solscan.io/tx/${signature}`,
  };
}

private async loadAgentWallet(walletAddress: string): Promise<Keypair> {
  // Load agent's keypair from secure storage
  // Options:
  // 1. Environment variable per agent
  // 2. Database (encrypted)
  // 3. Cloud key management (AWS KMS, etc.)
  
  // For MVP: Use platform wallet as fallback
  return loadPlatformWallet();
}
```

**Acceptance Criteria:**
- ✅ Endpoint accepts CreateTokenDto
- ✅ Builds transaction server-side
- ✅ Signs with agent wallet
- ✅ Submits to blockchain
- ✅ Returns signature and explorer link
- ✅ Error handling for failures
- ✅ Token saved to database

---

### Task 1C.3: AI Agent Integration Guide (2-3h)

**Files to create:**

1. `/launchpad/AI_AGENT_INTEGRATION_GUIDE.md` (NEW FILE)

```markdown
# LaunchPad AI Agent Integration Guide

Complete guide for AI agents to create and trade tokens autonomously.

## Quick Start

### 1. Register Your Agent
### 2. Generate API Key
### 3. Create Your First Token
### 4. Trade Tokens
### 5. Claim Rewards

## Authentication

### One-Time Setup (Wallet Signature)
### Long-Lived API Key

## Token Creation

### Endpoint: POST /tokens/create-and-submit
### Example Request (curl)
### Example Request (TypeScript)
### Example Request (Python)

## Trading

### Buy Tokens
### Sell Tokens
### Check Quotes

## Error Handling

### Common Errors
### Retry Logic
### Rate Limits

## Rate Limits

### Agent Tier: 5,000 requests/15 min
### Human Tier: 1,000 requests/15 min

## Examples

### Full workflow example
### Error handling example
### Rate limit handling
```

**Acceptance Criteria:**
- ✅ Complete guide with code examples
- ✅ Covers authentication flow
- ✅ Documents all endpoints
- ✅ Error handling patterns
- ✅ Working code samples (curl, TypeScript, Python)

---

### Task 1C.4: Update Existing Documentation (0.5-1h)

**Files to modify:**

1. `/launchpad/APIs.md`
   - Add API key authentication section
   - Document `/auth/create-api-key` endpoint
   - Document `/tokens/create-and-submit` endpoint
   - Update authentication examples

2. `/launchpad/README.md` (if exists)
   - Link to AI Agent Integration Guide
   - Update quickstart for agents

**Acceptance Criteria:**
- ✅ All new endpoints documented
- ✅ API key flow documented
- ✅ Links to integration guide added

---

### Task 1C.5: Testing (1-2h)

**Tasks:**
1. Test API key creation flow
2. Test API key authentication
3. Test token creation with API key
4. Test submit transaction endpoint
5. Verify token appears in database
6. Verify token shows in frontend with bot badge
7. Test with real Solana keypair

**Test Script:**
```bash
# 1. Create API key (requires wallet signature first)
API_KEY=$(curl -X POST /auth/create-api-key \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"name": "Test Agent"}' | jq -r '.apiKey')

# 2. Create token with API key
curl -X POST /tokens/create-and-submit \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST",
    "description": "Test from API",
    "creatorType": "agent",
    "creator": "WALLET_ADDRESS"
  }'

# 3. Verify token in database
# 4. Check frontend shows token with bot badge
```

**Acceptance Criteria:**
- ✅ End-to-end flow works
- ✅ API key persists across requests
- ✅ Token creation succeeds
- ✅ Token visible in frontend
- ✅ Bot badge displays

---

## Timeline

**Day 1:**
- Frontend Dev: Task 1A.1, 1A.2 (3-4h)
- Backend Dev: Task 1B.1, 1B.2 (1.5-2.5h)

**Day 2:**
- Frontend Dev: Task 1A.3, 1A.4 (1.5-2h) → Complete Phase 1A
- Backend Dev: Task 1B.3 (0.5h) → Complete Phase 1B
- Backend Dev: Start Task 1C.1 (4-5h progress)

**Day 3:**
- Backend Dev: Complete Task 1C.1 (2-3h remaining)
- Backend Dev: Task 1C.2 (4-6h)

**Day 4:**
- Backend Dev: Task 1C.3, 1C.4, 1C.5 (3.5-6h) → Complete Phase 1C

**Total:** 18-26 hours across 3-4 days

---

## Success Criteria (Overall)

✅ **Frontend:**
- No "Create Token" UI visible
- "AI Tokens" in main navigation
- Home page focuses on trading/discovery
- Bot tokens featured prominently

✅ **Backend:**
- Agent-only guard prevents human creation
- API key authentication works
- Submit transaction endpoint works
- Clear error messages

✅ **Integration:**
- AI Agent Integration Guide complete
- End-to-end agent creation flow works
- At least 1 test agent successfully creates token

✅ **Documentation:**
- LEARNED.md updated
- All API docs updated
- Code comments clear

✅ **Git:**
- All commits have descriptive messages
- Code reviewed before merge
- No broken builds

---

**Created by:** LaunchPad Project Manager  
**Date:** 2026-02-08 21:30 UTC  
**Status:** Ready for assignment
