# 🎯 Phase 1A: Frontend Refactor - ASSIGNED TO YOU

**Status:** ✅ APPROVED - START NOW  
**Priority:** HIGH  
**Estimated Effort:** 4-6 hours  
**Deadline:** 1-2 days

---

## Your Mission

Remove all human token creation UI and elevate AI token discovery.

**Goal:** Align frontend with "AI creators, human traders" business model.

---

## Task List

### ✅ Task 1: Remove Token Creation UI (2-3h)

**Files to modify:**

1. **`/launchpad-frontend/src/app/app.html` (line ~48)**
   - ❌ REMOVE: `<a routerLink="/create" class="nav-link">Create</a>`
   - ✅ ADD: `<a routerLink="/bot-tokens" class="nav-link">AI Tokens</a>`

2. **`/launchpad-frontend/src/app/features/home/home.component.ts` (line ~52)**
   - ❌ REMOVE: "Create Token" CTA button
   - ✅ REPLACE WITH: "Explore AI Tokens" button → `/bot-tokens`
   - ✅ UPDATE hero text: "Trade Tokens Created by AI Agents"
   - ✅ UPDATE subtitle: "Discover unique tokens created by autonomous AI bots"

3. **`/launchpad-frontend/src/app/components/mobile-bottom-nav/mobile-bottom-nav.component.ts`**
   - ❌ REMOVE: "Create" button from mobile nav
   - ✅ REPLACE WITH: "AI Tokens" button OR adjust layout

4. **`/launchpad-frontend/src/app/app.routes.ts`**
   - ✅ REDIRECT: `/create` route → `/bot-tokens`
   - Alternative: Show info page "Token creation is for AI agents only"

**Acceptance Criteria:**
- [ ] No "Create Token" button visible anywhere
- [ ] "AI Tokens" in main navigation
- [ ] Mobile nav updated
- [ ] `/create` redirects gracefully
- [ ] Home hero focuses on trading, not creating

---

### ✅ Task 2: Elevate Bot Token Discovery (1-2h)

**Files to modify:**

1. **`/launchpad-frontend/src/app/features/home/home.component.ts`**
   - ✅ ADD: "AI Tokens" section below hero
   - ✅ FEATURE: 4-6 bot-created tokens on home page
   - ✅ ADD: "View All AI Tokens" link → `/bot-tokens`

2. **`/launchpad-frontend/src/app/features/bot-tokens/bot-tokens.component.ts`**
   - ✅ VERIFY: Component is production-ready
   - ✅ CHECK: Bot badges display correctly
   - ✅ CHECK: Stats section works

**Acceptance Criteria:**
- [ ] Home page features AI tokens prominently
- [ ] Bot tokens page accessible from main nav
- [ ] Bot badges visible and correct
- [ ] "View All AI Tokens" link works

---

### ✅ Task 3: Update Messaging (1h)

**Files to modify:**

1. **`/launchpad-frontend/src/app/features/home/home.component.ts`**
   - ✅ UPDATE hero title: "Trade Tokens Created by AI Agents"
   - ✅ UPDATE subtitle: "Discover unique tokens created by autonomous AI bots"
   - ✅ UPDATE CTA text: "Explore AI Tokens" (not "Create Token")

2. **`/launchpad-frontend/src/app/app.html`**
   - ✅ CHECK footer tagline
   - ✅ VERIFY branding consistency

**Acceptance Criteria:**
- [ ] All copy reflects "AI creator / Human trader" model
- [ ] No references to human token creation
- [ ] Platform purpose is clear from messaging

---

### ✅ Task 4: Testing & Documentation (0.5-1h)

**Tasks:**
1. [ ] Test all navigation flows work correctly
2. [ ] Verify mobile responsive behavior
3. [ ] Check bot badges render correctly on all pages
4. [ ] Take screenshots (before/after) for documentation
5. [ ] Update `STYLE_GUIDE.md` if component changes made

**Acceptance Criteria:**
- [ ] All routes work correctly
- [ ] No broken links
- [ ] Mobile navigation functional
- [ ] Screenshots captured

---

## Git Commit Guidelines

**Commit Message Format:**
```
[Phase 1A] Brief description

- Specific change 1
- Specific change 2
- Specific change 3
```

**Example Commits:**

```
[Phase 1A] Remove human token creation UI

- Removed "Create Token" button from home hero
- Removed "Create" link from main navigation
- Redirected /create route to /bot-tokens
```

```
[Phase 1A] Add AI Tokens to navigation

- Added "AI Tokens" link to main nav
- Updated mobile bottom nav layout
- Featured bot tokens on home page
```

---

## Testing Checklist

Before marking complete:

### Desktop
- [ ] Navigate to home page → No "Create" button
- [ ] Click "AI Tokens" in nav → Goes to bot tokens page
- [ ] Verify bot badges show on token cards
- [ ] Check all links work

### Mobile
- [ ] Open on mobile view
- [ ] Check bottom nav → No "Create" button
- [ ] Verify "AI Tokens" button works
- [ ] Test touch interactions

### Routes
- [ ] Visit `/` → Works
- [ ] Visit `/bot-tokens` → Works
- [ ] Visit `/create` → Redirects or shows info page
- [ ] Visit `/token/:address` → Works

---

## Reference Files

**Review these before starting:**
- `/workspace/launchpad/PHASE_1_TASK_BREAKDOWN.md` - Full breakdown
- `/workspace/launchpad/ARCHITECTURE_REVIEW_AI_CREATOR_MODEL.md` - Context
- `/workspace/launchpad/STYLE_GUIDE.md` - Frontend standards

**Current files to modify:**
- All files located in `/root/.openclaw/workspace/launchpad-project/launchpad-frontend/`

---

## Questions?

If you encounter issues or need clarification:
1. Review the architecture review document
2. Check existing bot-tokens component implementation
3. Ask Project Manager for guidance

---

## When Complete

1. **Test thoroughly** (use checklist above)
2. **Commit changes** with clear messages
3. **Update Project Manager** with completion status
4. **Report blockers** if any issues arise

**Project Manager will review before final approval.**

---

**Start now and report progress!** 🚀

**Estimated completion:** 1-2 days (4-6 hours of work)
