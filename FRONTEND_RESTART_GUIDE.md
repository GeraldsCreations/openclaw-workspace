# 🍆 Frontend Restart Guide - Complete Cache Clear

## The Problem

Angular's build system caches compiled files. After major interface changes (snake_case → camelCase), you MUST clear all caches or the dev server will use old compiled code.

---

## ✅ Step-by-Step Restart Procedure

### 1. Stop Current Dev Server
```bash
# Press Ctrl+C in the terminal running ng serve
```

### 2. Navigate to Frontend Directory
```bash
cd /root/.openclaw/workspace/launchpad-platform/frontend
```

### 3. Pull Latest Changes
```bash
git pull origin master
```

### 4. Clear ALL Caches
```bash
# Remove Angular build cache
rm -rf .angular/cache

# Remove dist output
rm -rf dist

# Remove node_modules cache
rm -rf node_modules/.cache

# (Optional) Nuclear option - reinstall all packages
# npm ci
```

### 5. Start Fresh Dev Server
```bash
npm run start
```

### 6. Wait for Compilation
Watch the terminal output. You should see:
```
✔ Browser application bundle generation complete.
✔ Compiled successfully.

** Angular Live Development Server is listening on localhost:4200 **
```

If you see errors, they should be NEW errors (not the snake_case ones).

### 7. Hard Refresh Browser
Once server is running:
- **Chrome/Edge:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Firefox:** Ctrl+F5 or Cmd+Shift+R
- Or: Open DevTools → Network tab → Check "Disable cache" → Refresh

---

## 🔍 Verification

After restart, verify:

1. **No TypeScript Errors**
   - Check terminal for compilation errors
   - Should say "Compiled successfully"

2. **Real Data Loads**
   - Open http://localhost:4200
   - Token prices should show actual numbers (not $0.00)
   - Images should load
   - Market caps should be real

3. **Trading Works**
   - Click on a token
   - Get quote button should work
   - Buy/Sell should calculate correctly

---

## 🐛 Troubleshooting

### Still Seeing snake_case Errors?

**1. Check git status:**
```bash
git log --oneline -1
# Should show: 0074f81 Fix: Type compatibility for WebSocket events...
```

**2. Verify files are updated:**
```bash
grep -c "currentPrice" src/app/core/services/api.service.ts
# Should return: 2 or more
```

**3. Check browser cache:**
- Open DevTools (F12)
- Application tab → Storage → Clear site data
- Hard refresh (Ctrl+Shift+R)

### Compilation Still Failing?

**1. Nuclear cache clear:**
```bash
cd /root/.openclaw/workspace/launchpad-platform/frontend
rm -rf .angular dist node_modules/.cache
npm ci  # Reinstall all packages
npm run start
```

**2. Check for conflicting processes:**
```bash
lsof -ti:4200  # Check if port 4200 is in use
kill -9 $(lsof -ti:4200)  # Kill old process if needed
```

**3. Verify Node/npm versions:**
```bash
node --version  # Should be 14+ 
npm --version   # Should be 6+
```

### Getting Different Errors?

If you see NEW errors (not snake_case related), that's progress! Share the new error messages and we'll fix them.

Common new errors:
- Missing dependencies → `npm install`
- Port in use → Kill old process or use different port
- TypeScript version issues → Check package.json

---

## 📊 Current Status (After All Fixes)

**Commits Applied:** 6 total
1. `c5f3035` - Token interface camelCase
2. `3b8ad51` - Request/response interfaces
3. `ca31c3e` - Dashboard interface
4. `85516e6` - HTML templates
5. `0074f81` - Type compatibility fixes

**Files Fixed:** 22 total
- 16 component files (.ts)
- 4 service files (.ts)
- 2 template files (.html)

**Snake Case References:** ZERO in frontend code

**Backward Compatibility:** WebSocket events support both formats

---

## ✅ Expected Result

After following this guide:
- ✅ Dev server compiles successfully
- ✅ No TypeScript errors
- ✅ Real data displays (prices, volumes, market caps)
- ✅ Images load correctly
- ✅ Trading calculations work
- ✅ Statistics show real numbers
- ✅ Charts display live data

---

## 🚀 Quick Restart Command

For future restarts (after cache is clear):
```bash
cd /root/.openclaw/workspace/launchpad-platform/frontend
git pull origin master
npm run start
```

---

**Last Updated:** 2026-02-03 10:05 UTC  
**Commit:** 0074f81
