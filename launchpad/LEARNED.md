# LaunchPad - Project Learnings

**Project Start:** 2026-02-03  
**Current Sprint:** Phase 1A (COMPLETE)  
**Production Deployment:** 2026-02-06 20:47 UTC  
**Last Updated:** 2026-02-08 21:30 UTC

---

## Project Overview
LaunchPad is a Solana token launchpad using Meteora's Dynamic Bonding Curve (DBC) protocol. AI agents create tokens with progressive pricing, humans trade through bonding curves, and tokens auto-migrate to DLMM pools at maturity.

---

## Phase 1A: AI-First Platform Refactor (2026-02-08)

### Objective
Remove human token creation UI and align platform with "AI creators, human traders" business model.

### Delivered Changes (3 hours)
1. ✅ **Navigation Refactor** - Removed "Create" links, added "AI Tokens"
2. ✅ **Home Page Update** - New hero messaging, featured AI tokens section
3. ✅ **Route Redirect** - /create now redirects to /bot-tokens
4. ✅ **Info Page** - Replaced token creation form with AI-first explanation
5. ✅ **Mobile Nav Update** - "AI Tokens" button with proper styling

### Technical Changes
- **Files Modified:** 4 (app.html, app.routes.ts, home.component.ts, create-token.component.ts, mobile-bottom-nav.component.ts)
- **Lines Changed:** +185, -423 (net reduction: 238 lines)
- **Commits:** 3 with clear messages
- **Build Status:** All passing (0 errors)

### Messaging Updates
- **Hero Title:** "Trade Tokens Created by AI Agents"
- **Subtitle:** "Discover unique tokens created by autonomous AI bots"
- **CTA:** "Explore AI Tokens" (was "Create Token")
- **Featured Section:** 6 most recent AI-created tokens on home

### Key Learnings
1. **Clear Platform Positioning** - Messaging now explicitly states platform purpose
2. **Seamless Redirects** - Users attempting old workflows naturally flow to AI tokens
3. **Featured Content** - Highlighting AI tokens increases discovery
4. **Info Pages Over Errors** - Better UX to explain "why not" than just block access

### Testing Results
- ✅ All navigation flows work correctly
- ✅ Mobile responsive behavior maintained
- ✅ Bot badges render correctly
- ✅ No broken links
- ✅ Build passes with 0 errors

**Completion Report:** `/workspace/launchpad/PHASE_1A_COMPLETION_REPORT.md`

---

## Sprint 1 Summary (2026-02-03 → 2026-02-06)

### Delivered Features (10/5 - 200% of target)
1. ✅ **Portfolio Scroller** - Horizontal token cards with live prices
2. ✅ **Search by Address** - Token/wallet lookup with validation
3. ✅ **Watchlist System** - Star tokens, persistent storage
4. ✅ **Analytics Dashboard** - Market metrics, charts, top performers
5. ✅ **Live Trading Charts** - TradingView integration, real-time
6. ✅ **Quick Trade Actions** - Modal-based buy/sell with presets
7. ✅ **Bot Integration Badges** - Purple badges for AI-created tokens
8. ✅ **Mobile Optimization** - Touch gestures, PWA, responsive
9. ✅ **Token Detail Pages** - Full token info, charts, trading
10. ✅ **Advanced Trading UI** - Slippage settings, position sizing

### Time Investment
- **Duration:** 38+ hours (2026-02-03 01:10 → 2026-02-06 20:47 UTC)
- **Code:** 19,076+ lines across 16+ commits
- **Quality:** All tested before commit, all builds passing

### Deployment
- **Frontend:** https://launchpad-frontend-production-0fce.up.railway.app
- **Backend:** https://launchpad-backend-production-e95b.up.railway.app
- **Status:** ✅ Live & stable (46+ hours uptime)

---

## Critical Learnings

### 1. Memory Leak Incident (2026-02-05)
**Problem:** Backend crashed on startup with "heap out of memory"

**Root Cause:** TokenSyncService loaded ALL 132,967 Meteora pools at once

**Solution:**
- Added conditional startup sync (requires `PLATFORM_LAUNCHPAD_ID`)
- Implemented batch processing (50 pools per batch + GC pauses)
- Increased Node heap size 512MB → 2GB
- Added safety limits (max 1000 pools per sync)

**Result:** Server starts in 7.8s, memory <500MB, stable

**Lesson:** Always test with production data volumes, batch everything, increase heap proactively

---

### 2. Meteora DBC Implementation (2026-02-02)
**Challenge:** `buildCurveWithMarketCap()` failing with cryptic errors for 60+ minutes

**Root Cause:** Missing `migrationFee` parameter (not shown in TypeScript types)

**Solution:** Read SDK source code in node_modules to find all required fields

**Lesson:** SDK docs can be incomplete - check source code for full parameter requirements

---

### 3. Frontend Build Fix (2026-02-05)
**Problem:** PrimeNG v21 breaking changes incompatible with codebase

**Solution:**
- Downgraded PrimeNG v21 → v17
- Fixed severity type ('warn' → 'warning')
- Build successful: dist/frontend/browser/ (~4.5MB)

**Lesson:** Lock dependency versions, test before upgrading major versions

---

### 4. Chart Rendering (2026-02-05)
**Problem:** Charts not initializing properly on first load

**Solution:** TradingView charts use ResizeObserver API (wait for container dimensions)

**Pattern:** Always show loading skeleton while chart initializes

---

### 5. Performance Optimization (2026-02-05)
**Problem:** Startup loading 132k pools = 7.8s + 500MB memory

**Solution:** Only sync pools for tokens WE created (O(n) not O(132k))

**Result:** Startup 7.8s → 0.2s, Memory 500MB → <100MB

**Lesson:** Filter data at source, don't load everything then filter

---

## Technical Decisions

### Why Angular 21+?
- **Standalone components:** No NgModules overhead
- **Signals:** Built-in reactive state
- **Modern:** Latest features, performance improvements

### Why Ionic 8+?
- **Mobile-first:** Touch gestures, swipe actions
- **PWA-ready:** Installable, offline support
- **Angular integration:** Native support

### Why NestJS 11+?
- **TypeScript native:** Type safety across stack
- **Modular:** Clean architecture
- **Ecosystem:** ORM, WebSocket, middleware built-in

### Why Meteora?
- **Better capital efficiency:** Concentrated liquidity
- **Lower slippage:** Optimized for traders
- **Fee optimization:** Dynamic fee structures

### Why 2 Repos?
- **Independent deployment:** Deploy frontend without backend rebuild
- **Faster CI/CD:** Only rebuild what changed
- **Better permissions:** Separate access control

---

## Common Patterns

### Frontend
```typescript
// Standalone component
@Component({
  selector: 'app-token-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './token-card.component.html'
})

// Signal-based state
export class TokenService {
  tokens = signal<Token[]>([]);
  
  addToken(token: Token) {
    this.tokens.update(current => [...current, token]);
  }
}
```

### Backend
```typescript
// Module structure
@Module({
  imports: [TypeOrmModule.forFeature([Token])],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService]
})

// Service pattern
@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) {}
}
```

---

## Git Repositories

### Frontend
- **Repo:** `chadizzle/launchpad-frontend`
- **Last Commit:** 2026-02-06 (auth improvements)
- **Branch:** main
- **Commits:** 15+ (Sprint 1)

### Backend
- **Repo:** `chadizzle/launchpad-backend`
- **Last Commit:** 2026-02-06 (wallet verification)
- **Branch:** main
- **Commits:** 10+ (Sprint 1)

---

## Known Issues

### Non-Critical
1. ⚠️ CommonJS compatibility warnings (bs58, borsh)
2. ⚠️ Indexer lag (tokens may not appear instantly)
3. ⚠️ Jupiter API rate limits (need fallback)

### Resolved
- ✅ Memory leak (batch processing)
- ✅ PrimeNG compatibility (downgrade)
- ✅ Chart rendering (ResizeObserver)
- ✅ DBC config (migrationFee)

---

## Architecture Review: AI Creator / Human Trader Model (2026-02-08 21:00 UTC)

### Critical Clarification from Chadizzle
**Updated Business Model:**
- **AI Agents** = Token creators (supply side) via API
- **Humans** = Token traders (demand side) via UI
- **Key Change:** Humans CANNOT create tokens, only AI agents can

### Architecture Audit Results
**Current State:** Platform designed for both humans and agents to create tokens
**Problem:** Frontend has prominent "Create Token" UI that encourages human creation
**Impact:** Contradicts the AI-creator-only business model

### What Works ✅
- Bot badge system (production ready)
- Trading infrastructure (UI + API)
- Creator type tracking (`creatorType` field exists)
- LaunchPad Trader skill (already agent-focused)
- Dedicated `/bot-tokens` page (built but not prominent)

### What Needs Changes ❌
1. **Frontend:** Remove human token creation UI (home hero, navigation, mobile nav)
2. **Backend:** Enforce agent-only creation (add guard to reject `creatorType: 'human'`)
3. **Messaging:** Update copy to "Trade AI Tokens" not "Create Tokens"
4. **Navigation:** Replace "Create" with "AI Tokens" or "Bot Tokens"

### Updated Implementation Plan
**Phase 1A: Frontend Refactor** (NEW - 4-6 hours)
- Remove all token creation UI for humans
- Redesign home page hero (trade focus, not create focus)
- Update navigation ("AI Tokens" replaces "Create")
- Feature bot tokens prominently

**Phase 1B: Backend Enforcement** (NEW - 2-3 hours)
- Add `AgentOnlyGuard` to `/tokens/create` endpoint
- Reject requests with `creatorType: 'human'`
- Update API documentation

**Phase 1C: Agent Integration** (ORIGINAL - 12-17 hours)
- API key authentication for agents
- Submit transaction endpoint
- AI Agent Integration Guide

**Total Updated Phase 1:** 18-26 hours (was 12-17 hours)

### Key Decisions
1. **Should frontend have token creation UI?** NO - Completely remove it
2. **How do humans authenticate?** Wallet signature (no change needed)
3. **Different auth for agents vs humans?** YES - API keys for agents, wallet for humans
4. **Analytics focus?** YES - Highlight AI creators as primary metric
5. **LaunchPad Trader skill updates?** NO - Already agent-focused, minor docs update only

### Documentation Created
- `ARCHITECTURE_REVIEW_AI_CREATOR_MODEL.md` - Comprehensive 22-page review
- Detailed UI/UX mockups
- Phase-by-phase implementation plan
- Success metrics defined

---

## AI Agent Audit (2026-02-08 20:15 UTC)

### Task (SUPERSEDED by Architecture Review above)
**Objective:** Audit platform for AI agent autonomous operation (token creation + trading)

### Findings
**Status:** ⚠️ **PARTIALLY BLOCKED** - Agents can technically use platform but with significant friction

**Critical Blockers (2):**
1. **No headless authentication** - Requires browser wallet signature for JWT tokens
2. **Partially signed transactions** - Multi-step flow (server signs mint, agent must sign + submit)

**Major Issues (5):**
- JWT token expiration (24h, no refresh)
- Trading requires authenticated wallet match
- Transaction signing incomplete in production
- Private key storage security risks (trader skill uses plaintext JSON)
- No SDK available (agents must use raw curl)

**Minor Issues (3):**
- No bot-specific rate limit tier
- Missing API docs for headless usage
- No multi-wallet support

### Recommended Solution
**Phase 1 (MVP - 12-17 hours):**
1. **API Key Authentication** (6-8h) - Allow headless auth with API keys
2. **Submit Transaction Endpoint** (4-6h) - Server-side signing + submission
3. **AI Agent Integration Guide** (2-3h) - Documentation + examples

**Result:** Agents can autonomously create + trade tokens without browser interaction

### What Worked Well ✅
- Image URLs (no file uploads needed)
- Quote endpoints (public, no auth)
- Error handling (JSON formatted, clear codes)
- No CAPTCHA/bot detection
- Agent-friendly metadata (creatorType field exists)

### What Needs Work ❌
- Authentication flow designed for browsers only
- Transaction signing requires manual steps
- No bot tier for rate limits
- Private key management risky

### Documentation
- Created comprehensive audit report: `AI_AGENT_AUDIT_REPORT.md`
- Identified 10 issues with severity, effort estimates, and solutions
- Prioritized into 3 phases (MVP, Enhanced, Hardening)

### Next Steps
- Present audit to Gereld for Chadizzle approval
- If approved, assign Phase 1 tasks to Backend Developer
- Estimated completion: 2-3 days
- Update dashboard with new tasks

### Lesson Learned
**Design principle:** Build APIs for both human and machine users from day 1. Retrofitting headless support adds complexity. Future projects should include:
- API key auth alongside wallet auth
- SDK from launch
- Documented bot integration examples
- Bot tier rate limits from start

---

## Current Status (2026-02-08)

### Production
- ✅ **Uptime:** 46+ hours (stable)
- ✅ **Features:** 10/10 deployed
- ✅ **Performance:** All green
- ✅ **Errors:** None reported

### Next Phase
- 🟡 **Awaiting approval** for AI Agent Integration (Phase 1)
- 🟡 **Collecting analytics** (when users arrive)
- 🟡 **Monitoring stability** (24-48h minimum)

### Sprint 2 Planning
**On Hold** - Depends on Chadizzle decision:
- Option A: Implement AI agent support (2-3 days)
- Option B: Wait for user feedback before next sprint

---

## Style Guide Reference
See `STYLE_GUIDE.md` for frontend styling standards.

## API Documentation
See `APIs.md` for backend endpoint specifications.

## AI Agent Integration
See `AI_AGENT_AUDIT_REPORT.md` for comprehensive audit findings.

---

---

## Phase 1 Implementation - KICKOFF (2026-02-08 21:30 UTC)

### Status
**✅ APPROVED by Chadizzle** - Implementation begins NOW

### Work Breakdown Created
**Total Effort:** 18-26 hours over 3-4 days

**Phase 1A: Frontend Refactor** (4-6h)
- Remove human token creation UI
- Elevate AI token discovery
- Update navigation and messaging
- **Assigned to:** Frontend Developer

**Phase 1B: Backend Enforcement** (2-3h)
- Add agent-only guard
- Update API documentation
- Write tests
- **Assigned to:** Backend Developer

**Phase 1C: Agent Integration** (12-17h)
- API key authentication system
- Submit transaction endpoint
- AI Agent Integration Guide
- **Assigned to:** Backend Developer

### Task Assignments Ready
- ✅ `TASK_ASSIGNMENT_FRONTEND.md` - 5 pages, detailed tasks
- ✅ `TASK_ASSIGNMENT_BACKEND.md` - 20 pages, detailed tasks
- ✅ `PHASE_1_TASK_BREAKDOWN.md` - 15 pages, master plan

### Success Criteria
- ✅ Humans CANNOT create tokens via UI
- ✅ AI agents CAN create tokens via API
- ✅ All users CAN trade tokens
- ✅ Clear error messages
- ✅ Documentation complete
- ✅ Bot badges working

### Timeline
- **Start:** 2026-02-08
- **Target:** 2026-02-11 or 2026-02-12
- **Days:** 3-4 days

### Next Steps
1. Spawn Frontend Developer agent
2. Spawn Backend Developer agent
3. Monitor progress daily
4. Review work before commits
5. Report completion to Chadizzle

---

**Maintained by:** LaunchPad Project Manager  
**Updated:** After every task completion
