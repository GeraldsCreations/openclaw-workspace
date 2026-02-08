# 🎯 Phase 1B + 1C: Backend Enforcement & Agent Integration - ASSIGNED TO YOU

**Status:** ✅ APPROVED - START NOW  
**Priority:** CRITICAL  
**Estimated Effort:** 14-20 hours  
**Deadline:** 3-4 days

---

## Your Mission

**Phase 1B (2-3h):** Enforce agent-only token creation  
**Phase 1C (12-17h):** Build API key auth + submit endpoint for AI agents

---

## PHASE 1B: Backend Enforcement (START WITH THIS)

### Priority: 🔴 CRITICAL - Do This First

**Goal:** Prevent humans from creating tokens via API

---

### ✅ Task 1B.1: Create Agent-Only Guard (1-1.5h)

**File to create:**

`/launchpad-backend/src/auth/guards/agent-only.guard.ts` (NEW FILE)

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

**File to modify:**

`/launchpad-backend/src/public-api/controllers/tokens.controller.ts`

```typescript
import { AgentOnlyGuard } from '../../auth/guards/agent-only.guard';

// ADD AgentOnlyGuard to create endpoint
@Post('create')
@UseGuards(JwtAuthGuard, AgentOnlyGuard) // <-- ADD THIS
@ApiBearerAuth('JWT')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Create token (AI agents only)' })
async createToken(
  @Body() createTokenDto: CreateTokenDto,
  @Wallet() authenticatedWallet: string,
): Promise<{ ... }> {
  // Existing code stays the same
}
```

**Acceptance Criteria:**
- [ ] Guard file created at correct path
- [ ] Guard applied to token creation endpoint
- [ ] Returns HTTP 403 for `creatorType: 'human'`
- [ ] Returns HTTP 403 for missing `creatorType`
- [ ] Allows `creatorType: 'agent'` to proceed
- [ ] Allows `creatorType: 'clawdbot'` to proceed
- [ ] Error message is clear and helpful

---

### ✅ Task 1B.2: Update API Documentation (0.5-1h)

**File to modify:**

`/launchpad/APIs.md`

Add this to the `POST /tokens/create` section:

```markdown
### POST `/v1/tokens/create`

**⚠️ RESTRICTION:** This endpoint is for AI agents only.

Requests with `creatorType: 'human'` or missing `creatorType` will be rejected with HTTP 403.

**Valid creator types:**
- `agent` - Generic AI agent
- `clawdbot` - ClawdBot agent

**Human users:** Use the web UI to browse and trade tokens. Token creation is not available for human accounts.

**AI agents:** See `AI_AGENT_INTEGRATION_GUIDE.md` for complete integration instructions.

**Error Response (403):**
```json
{
  "statusCode": 403,
  "message": "Token creation is restricted to AI agents only. Human users can trade tokens via the web UI. To create tokens, use the LaunchPad API with an AI agent.",
  "error": "Forbidden"
}
```
```

**Acceptance Criteria:**
- [ ] API docs clearly state restriction
- [ ] Valid creator types documented
- [ ] Error response example provided
- [ ] Link to integration guide added

---

### ✅ Task 1B.3: Write Tests (0.5h)

**File to create:**

`/launchpad-backend/src/auth/guards/agent-only.guard.spec.ts` (NEW FILE)

```typescript
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AgentOnlyGuard } from './agent-only.guard';

describe('AgentOnlyGuard', () => {
  let guard: AgentOnlyGuard;

  beforeEach(() => {
    guard = new AgentOnlyGuard();
  });

  const createContext = (creatorType?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: { creatorType },
        }),
      }),
    } as ExecutionContext;
  };

  it('should block human creators', () => {
    expect(() => guard.canActivate(createContext('human'))).toThrow(ForbiddenException);
  });

  it('should block missing creatorType', () => {
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });

  it('should allow agent creators', () => {
    expect(guard.canActivate(createContext('agent'))).toBe(true);
  });

  it('should allow clawdbot creators', () => {
    expect(guard.canActivate(createContext('clawdbot'))).toBe(true);
  });

  it('should return helpful error message', () => {
    try {
      guard.canActivate(createContext('human'));
    } catch (error) {
      expect(error.message).toContain('AI agents only');
    }
  });
});
```

**Run tests:**
```bash
cd /root/.openclaw/workspace/launchpad-project/launchpad-backend
npm test agent-only.guard.spec.ts
```

**Acceptance Criteria:**
- [ ] All 5 tests passing
- [ ] Guard behavior verified
- [ ] Error messages tested

---

## PHASE 1C: Agent Integration (START AFTER 1B COMPLETE)

### Goal: Enable AI agents to create tokens autonomously via API

---

### ✅ Task 1C.1: API Key Authentication System (6-8h)

**Files to create:**

1. **`/launchpad-backend/src/database/entities/api-key.entity.ts` (NEW FILE)**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
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

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;
}
```

2. **Create migration:**

```bash
cd /root/.openclaw/workspace/launchpad-project/launchpad-backend
npm run migration:generate -- -n CreateApiKeysTable
```

Edit generated migration to create table with proper schema.

3. **`/launchpad-backend/src/auth/guards/api-key-auth.guard.ts` (NEW FILE)**

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../database/entities/api-key.entity';
import * as crypto from 'crypto';

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
      throw new UnauthorizedException('API key required. Use: Authorization: Bearer YOUR_API_KEY');
    }

    // Hash the provided API key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Find API key in database
    const apiKeyRecord = await this.apiKeyRepository.findOne({
      where: { keyHash, active: true },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Update last used timestamp
    await this.apiKeyRepository.update(apiKeyRecord.id, {
      lastUsedAt: new Date(),
    });

    // Attach wallet to request (for authorization)
    request.user = { 
      walletAddress: apiKeyRecord.walletAddress,
      tier: apiKeyRecord.tier,
    };
    
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

4. **Add endpoint to `auth.controller.ts`:**

```typescript
import { ApiKey } from '../database/entities/api-key.entity';
import * as crypto from 'crypto';
import { randomBytes } from 'crypto';

@Post('create-api-key')
@UseGuards(JwtAuthGuard) // Requires wallet auth first
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Generate API key for AI agent (requires wallet auth)' })
async createApiKey(
  @Request() req,
  @Body('name') name?: string,
): Promise<{ apiKey: string; walletAddress: string; message: string }> {
  // Generate random API key (32 bytes = 64 hex chars)
  const apiKey = randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  // Save to database
  await this.apiKeyRepository.save({
    keyHash,
    walletAddress: req.user.walletAddress,
    tier: 'agent',
    name: name || 'Unnamed Agent',
    active: true,
  });

  return {
    apiKey,
    walletAddress: req.user.walletAddress,
    message: 'API key created successfully. Store this securely - it cannot be recovered if lost.',
  };
}
```

5. **Update auth module to include ApiKey repository:**

```typescript
// auth.module.ts
import { ApiKey } from '../database/entities/api-key.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    // ... existing imports
  ],
  // ...
})
```

**Acceptance Criteria:**
- [ ] ApiKey entity created
- [ ] Database migration runs successfully (`npm run migration:run`)
- [ ] API key guard implemented and tested
- [ ] `/auth/create-api-key` endpoint works
- [ ] API keys are hashed (never stored plaintext)
- [ ] `lastUsedAt` timestamp updates on use
- [ ] Guard attaches wallet address to request

---

### ✅ Task 1C.2: Submit Transaction Endpoint (4-6h)

**File to modify:**

`/launchpad-backend/src/public-api/controllers/tokens.controller.ts`

Add new endpoint:

```typescript
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';

@Post('create-and-submit')
@UseGuards(ApiKeyAuthGuard, AgentOnlyGuard) // API key required
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Create token and submit transaction (AI agents only)' })
@ApiResponse({ status: 200, description: 'Token created and transaction submitted' })
@ApiResponse({ status: 401, description: 'Invalid API key' })
@ApiResponse({ status: 403, description: 'Not an AI agent' })
async createAndSubmitToken(
  @Body() createTokenDto: CreateTokenDto,
  @Request() req,
): Promise<{
  success: boolean;
  tokenMint: string;
  poolAddress: string;
  signature: string;
  explorerUrl: string;
}> {
  // Override creator with authenticated wallet from API key
  const result = await this.tokenService.createAndSubmitToken({
    ...createTokenDto,
    creator: req.user.walletAddress, // From API key guard
  });

  return result;
}
```

**File to modify:**

`/launchpad-backend/src/public-api/services/token.service.ts`

Add method:

```typescript
import { Transaction, Connection } from '@solana/web3.js';
import { loadPlatformWallet } from '../../utils/wallet.util';

async createAndSubmitToken(dto: CreateTokenDto): Promise<{
  success: boolean;
  tokenMint: string;
  poolAddress: string;
  signature: string;
  explorerUrl: string;
}> {
  try {
    // Step 1: Build transaction (uses existing DBC service)
    const buildResult = await this.dbcService.buildCreateTokenTransaction({
      name: dto.name,
      symbol: dto.symbol,
      description: dto.description,
      imageUrl: dto.imageUrl,
      creatorWallet: dto.creator,
      creatorBotId: dto.creatorType || 'agent',
      firstBuyAmount: dto.initialBuy,
    });

    // Step 2: Deserialize transaction
    const transaction = Transaction.from(
      Buffer.from(buildResult.transaction, 'base64')
    );

    // Step 3: Sign with agent wallet (for MVP, use platform wallet)
    // TODO: Load agent-specific wallet from secure storage
    const agentWallet = loadPlatformWallet();
    transaction.partialSign(agentWallet);

    // Step 4: Submit to Solana RPC
    const connection = this.dbcService.getConnection();
    const rawTransaction = transaction.serialize();
    
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    // Step 5: Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    // Step 6: Return result
    return {
      success: true,
      tokenMint: buildResult.tokenMint,
      poolAddress: buildResult.poolAddress,
      signature,
      explorerUrl: `https://solscan.io/tx/${signature}?cluster=mainnet`,
    };
  } catch (error) {
    this.logger.error('Failed to create and submit token:', error);
    throw new Error(`Token creation failed: ${error.message}`);
  }
}
```

**Acceptance Criteria:**
- [ ] Endpoint accepts CreateTokenDto with API key auth
- [ ] Builds transaction server-side
- [ ] Signs transaction with agent wallet
- [ ] Submits to Solana blockchain
- [ ] Waits for confirmation
- [ ] Returns signature and explorer link
- [ ] Token saved to database automatically (via existing flow)
- [ ] Error handling for transaction failures
- [ ] Proper logging for debugging

---

### ✅ Task 1C.3: AI Agent Integration Guide (2-3h)

**File to create:**

`/launchpad/AI_AGENT_INTEGRATION_GUIDE.md` (NEW FILE)

Structure:

```markdown
# LaunchPad AI Agent Integration Guide

Complete guide for AI agents to autonomously create and trade tokens.

## Table of Contents
1. Quick Start
2. Authentication
3. Token Creation
4. Trading
5. Error Handling
6. Rate Limits
7. Code Examples

## Quick Start

### Prerequisites
- Solana wallet with SOL balance
- Node.js, Python, or curl installed

### 5-Minute Setup
[Step-by-step walkthrough]

## Authentication

### Step 1: One-Time Wallet Authentication
[How to authenticate with wallet signature]

### Step 2: Generate API Key
[How to create long-lived API key]

### Step 3: Use API Key
[How to use API key in requests]

## Token Creation

### Endpoint: POST /tokens/create-and-submit

**Request:**
[Full example with all fields]

**Response:**
[Expected response format]

**Code Examples:**

#### curl
```bash
[Working curl example]
```

#### TypeScript
```typescript
[Working TypeScript example]
```

#### Python
```python
[Working Python example]
```

## Trading

### Get Quote
[Quote endpoint examples]

### Buy Tokens
[Buy endpoint examples]

### Sell Tokens
[Sell endpoint examples]

## Error Handling

### Common Errors
[List of error codes and meanings]

### Retry Logic
[Recommended retry patterns]

### Rate Limits
[How to handle 429 errors]

## Rate Limits

| Tier | Requests/15min | Notes |
|------|----------------|-------|
| Agent | 5,000 | Default for API key auth |
| Human | 1,000 | Wallet auth only |

## Complete Example

[Full end-to-end example from auth to token creation to trading]

## FAQ

[Common questions and answers]
```

**Acceptance Criteria:**
- [ ] Complete guide with all sections
- [ ] Working code examples (curl, TypeScript, Python)
- [ ] Covers full authentication flow
- [ ] Documents all endpoints
- [ ] Error handling patterns included
- [ ] Rate limit handling explained
- [ ] Examples are copy-paste ready

---

### ✅ Task 1C.4: Update API Documentation (0.5-1h)

**File to modify:**

`/launchpad/APIs.md`

Add these sections:

1. **API Key Authentication section** (after current auth section)
2. **POST /auth/create-api-key endpoint documentation**
3. **POST /tokens/create-and-submit endpoint documentation**
4. **Update rate limits section** to show agent tier
5. **Add link to AI Agent Integration Guide**

**Acceptance Criteria:**
- [ ] All new endpoints documented
- [ ] API key flow clearly explained
- [ ] Rate limits updated
- [ ] Links to integration guide added

---

### ✅ Task 1C.5: End-to-End Testing (1-2h)

**Test Script:**

```bash
#!/bin/bash
# Test complete agent flow

# Setup
API_URL="https://launchpad-backend-production-e95b.up.railway.app"
WALLET_ADDRESS="YOUR_WALLET_ADDRESS"

echo "=== Phase 1C E2E Test ==="

# Step 1: Create API key (requires JWT token first)
echo "1. Creating API key..."
JWT_TOKEN="YOUR_JWT_TOKEN"  # Get from wallet auth
API_KEY=$(curl -s -X POST "$API_URL/v1/auth/create-api-key" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Agent"}' | jq -r '.apiKey')

echo "   API Key: ${API_KEY:0:16}..."

# Step 2: Create token using API key
echo "2. Creating token..."
RESULT=$(curl -s -X POST "$API_URL/v1/tokens/create-and-submit" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent Token",
    "symbol": "TEST",
    "description": "Test token created by AI agent",
    "creatorType": "agent",
    "creator": "'$WALLET_ADDRESS'",
    "initialBuy": 0.1
  }')

echo "$RESULT" | jq .

# Step 3: Extract token details
TOKEN_MINT=$(echo "$RESULT" | jq -r '.tokenMint')
SIGNATURE=$(echo "$RESULT" | jq -r '.signature')
EXPLORER_URL=$(echo "$RESULT" | jq -r '.explorerUrl')

echo "3. Token created!"
echo "   Mint: $TOKEN_MINT"
echo "   Signature: $SIGNATURE"
echo "   Explorer: $EXPLORER_URL"

# Step 4: Verify token in database
echo "4. Verifying token in database..."
curl -s "$API_URL/v1/tokens/$TOKEN_MINT" | jq .

# Step 5: Check frontend
echo "5. Check frontend at: https://launchpad-frontend-production-0fce.up.railway.app/token/$TOKEN_MINT"

echo "=== Test Complete ==="
```

**Manual Checks:**
1. [ ] API key creation works
2. [ ] API key authentication works
3. [ ] Token creation succeeds
4. [ ] Transaction appears on Solscan
5. [ ] Token appears in database
6. [ ] Token shows in frontend with bot badge
7. [ ] `creatorType` is set to 'agent'

**Acceptance Criteria:**
- [ ] Complete end-to-end flow works
- [ ] Token visible on Solscan
- [ ] Token in database with correct fields
- [ ] Frontend shows token with bot badge
- [ ] No errors in backend logs

---

## Git Commit Guidelines

**Commit Format:**
```
[Phase 1B/1C] Brief description

- Change 1
- Change 2
- Change 3
```

**Example Commits:**

```
[Phase 1B] Add agent-only guard to token creation

- Created AgentOnlyGuard to enforce agent-only creation
- Applied guard to POST /tokens/create endpoint
- Returns 403 for human creators with clear error message
- Added tests for guard behavior
```

```
[Phase 1C] Implement API key authentication system

- Created ApiKey entity and database migration
- Implemented ApiKeyAuthGuard for API key validation
- Added POST /auth/create-api-key endpoint
- API keys hashed with SHA-256 before storage
- Added lastUsedAt timestamp tracking
```

```
[Phase 1C] Add submit transaction endpoint for agents

- Created POST /tokens/create-and-submit endpoint
- Server-side transaction signing and submission
- Returns transaction signature and explorer link
- Added error handling and logging
```

---

## Timeline

**Day 1-2: Phase 1B** (2-3h)
- Task 1B.1: Agent-only guard (1-1.5h)
- Task 1B.2: API docs update (0.5-1h)
- Task 1B.3: Tests (0.5h)

**Day 2-4: Phase 1C** (12-17h)
- Task 1C.1: API key auth (6-8h)
- Task 1C.2: Submit endpoint (4-6h)
- Task 1C.3: Integration guide (2-3h)
- Task 1C.4: API docs (0.5-1h)
- Task 1C.5: E2E testing (1-2h)

---

## Reference Files

**Review before starting:**
- `/workspace/launchpad/PHASE_1_TASK_BREAKDOWN.md` - Full breakdown
- `/workspace/launchpad/ARCHITECTURE_REVIEW_AI_CREATOR_MODEL.md` - Context
- `/workspace/launchpad/AI_AGENT_AUDIT_REPORT.md` - Original audit

**Working directory:**
- `/root/.openclaw/workspace/launchpad-project/launchpad-backend/`

---

## Questions?

If you encounter issues:
1. Review the audit report for context
2. Check existing auth implementation patterns
3. Ask Project Manager for clarification

---

## When Complete

1. **Test thoroughly** (use E2E test script)
2. **Run migration** (`npm run migration:run`)
3. **Commit with clear messages**
4. **Update Project Manager** with status
5. **Report blockers** immediately

**Project Manager will review before final approval.**

---

**Start with Phase 1B (critical), then proceed to Phase 1C.** 🚀

**Estimated completion:** 3-4 days (14-20 hours total work)
