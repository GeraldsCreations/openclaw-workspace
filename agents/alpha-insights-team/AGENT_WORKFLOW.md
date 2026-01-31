# Agent Workflow - MANDATORY PROCESS

## 🚨 CRITICAL: Every Agent Must Follow This

When spawned for ANY task, follow this workflow IN ORDER:

---

## Standard Workflow (ALL AGENTS)

### 1. **Understand the Task** (2 minutes)
- Read the task description carefully
- Read your persona file (in dev-team/ or research-team/)
- Understand deliverables and success criteria
- Ask clarifying questions if needed

### 2. **Do the Work** (variable time)
- Write code / Create analysis / Design UI
- Follow your persona's expertise and style
- Maintain quality standards
- Document as you go

### 3. **Test Your Work** (5 minutes)
- **Devs:** Run build, check for errors
- **Researchers:** Verify output files exist and are complete
- Validate against success criteria
- Fix any issues found

### 4. **Git Commit & Push** ⚠️ **MANDATORY - NEVER SKIP**
```bash
cd /root/.openclaw/workspace/alpha-insights-app  # or appropriate repo
git add -A
git commit -m "feat: [Clear description of what was built]

[Bullet points of major changes]
"
git push
```

**If you skip this step, your work is lost. Always commit and push.**

### 5. **Report Completion**
- Summarize what was accomplished
- List files created/modified
- Note git commit hash
- Mention any blockers or follow-ups needed

---

## Dev Team Specific Workflow

### Frontend Dev
1. Read task + persona file
2. Build features (components, pages, services)
3. **Run:** `npm run build` (verify no errors)
4. **Run:** `ionic serve` (manual smoke test if needed)
5. **Git commit & push** ✅
6. Report back with screenshots/description

### Backend Dev
1. Read task + persona file
2. Build backend (Cloud Functions, Firestore schema, security rules)
3. **Run:** `cd functions && npm run build` (verify no errors)
4. Validate Firestore rules syntax
5. **Git commit & push** ✅
6. Report back with architecture notes

### UI/UX Designer
1. Read task + persona file
2. Create designs (mockups, style guides, component specs)
3. Save design files to repo (Figma links, PNGs, style guides)
4. **Git commit & push** ✅
5. Report back with design decisions and rationale

---

## Research Team Specific Workflow

### All Research Specialists (World Events, Price, News, Technical)
1. Read task + persona file
2. Research the assigned ticker
3. Write analysis to markdown file (200-400 words)
4. **Save to:** `/root/.openclaw/workspace/alpha-insights-app/research-output/`
5. **Git commit & push** ✅
6. Report back with summary

### Report Writer
1. Read all 4 specialist input files
2. Synthesize into cohesive report (800-1200 words)
3. Save to: `research-output/[TICKER]-report.md`
4. **Git commit & push** ✅
5. Report back with key insights

### Verdict Analyst
1. Read synthesized report
2. Generate 7 timeframe verdicts (5min → 1yr)
3. Save to: `research-output/[TICKER]-verdicts.md`
4. **Git commit & push** ✅
5. Report back with verdict summary

### Research Coordinator
1. Select tickers (daily batch or custom request)
2. Spawn research pipeline agents
3. Monitor progress
4. **After all complete:** Commit batch results
5. **Git commit & push** ✅
6. Report metrics (tickers processed, time taken, errors)

---

## Git Commit Message Standards

### Format:
```
<type>: <short description>

<detailed explanation with bullet points>
```

### Types:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation only
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Examples:

**Good:**
```
feat: Add custom request form with quota display

- Created /request-analysis page
- Implemented CustomRequestService
- Added quota validation and UI
- Integrated with Cloud Functions
```

**Bad:**
```
update stuff
```

---

## Quality Checklist (Before Committing)

### Devs:
- [ ] Code builds without errors
- [ ] No console warnings (or documented if unavoidable)
- [ ] TypeScript strict mode passing
- [ ] Files organized logically
- [ ] README/docs updated if needed

### Researchers:
- [ ] Output file exists in correct location
- [ ] Word count within target range
- [ ] All required sections present
- [ ] Markdown formatting valid
- [ ] Data sources cited where appropriate

---

## What Happens If You Don't Push?

**BAD THINGS:**
- Your work is lost when session ends
- Chadizzle can't see or use your code
- Other agents can't build on your work
- Deployment is blocked
- You wasted time and tokens

**ALWAYS PUSH YOUR WORK!** 🚨

---

## Emergency: "I Forgot to Push!"

If you realize you didn't push:
1. **Immediately** navigate to the repo
2. Run `git add -A && git commit -m "feat: [description]" && git push`
3. Notify main agent/Gereld that you fixed it
4. Add a note to your completion report

---

## Dashboard Updates

When you complete work, the main agent (Gereld) will update the dashboard. But you can help by including this in your completion report:

```
**Dashboard Update:**
- Agent: [Your role name]
- Status: idle
- Task: Completed [brief description]
```

---

## Summary

**The workflow is simple:**
1. **Read** your task + persona
2. **Do** the work with quality
3. **Test** that it works
4. **Commit & Push** to git ✅ ← NEVER SKIP
5. **Report** what you accomplished

**Remember:** Code that isn't pushed doesn't exist. Always commit and push!

---

*This workflow is mandatory for all agents. If you have questions, ask Gereld (main agent) before starting work.*
