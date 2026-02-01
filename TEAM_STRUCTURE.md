# Alpha Insights - Core Team Structure

**Created:** 2026-02-01 20:42 UTC  
**Purpose:** Lean, expert team for Alpha Insights development

---

## 🎯 Core Team (5 Members)

### 1. **Senior Dev (Apex)** 
**ID:** j2Q9otLjnDCEHN7rlv7T  
**Persona:** `/root/.openclaw/workspace/agents/senior-dev.md`  
**Role:** Full-stack expert - handles ALL development tasks  
**Tech Stack:** Angular 18+, Ionic 8+, TypeScript, Firebase, Capacitor  
**Responsibilities:**
- Build new features (frontend + backend)
- Fix bugs and technical issues
- Deploy to Firebase (Hosting + Functions)
- Optimize performance and code quality
- Test locally before handoff to QA

---

### 2. **Senior UI/UX Designer (Pixel)**
**ID:** 3dlF5OZ7eda4ONurYuVb  
**Persona:** `/root/.openclaw/workspace/agents/senior-designer.md`  
**Role:** Fintech design specialist  
**Style:** Modern, clean - inspired by Coinbase/Uniswap  
**Responsibilities:**
- Design new features and screens
- Create UI/UX improvements
- Provide CSS/layout specs for dev
- Maintain design consistency
- Review implemented designs

---

### 3. **Project Manager (Atlas)**
**ID:** viVNONqCMZAq5luxPhkB  
**Persona:** `/root/.openclaw/workspace/agents/project-manager.md`  
**Role:** Task orchestrator and strategic planner  
**Responsibilities:**
- Create new tasks, bug fixes, improvements
- Prioritize work (P0-P3)
- Assign tasks to dev/designer/QA
- Track progress on dashboard
- Report status to Chadizzle
- Make trade-off decisions

---

### 4. **QA Tester (Scout)**
**ID:** CCkCgM82N3C8bqJISZ8B  
**Persona:** `/root/.openclaw/workspace/agents/qa-tester.md`  
**Role:** End-to-end browser testing specialist  
**Responsibilities:**
- Test features after dev completes work
- Use actual browser (via `ionic serve`)
- Find bugs and edge cases
- Report issues to PM with detailed reproduction steps
- Verify fixes after dev addresses bugs
- Test responsive behavior (mobile/tablet/desktop)

---

### 5. **Research Team (Collective)**
**ID:** XhFbKsD6CoGeeQeKwfPb  
**Persona:** `/root/.openclaw/workspace/agents/research-team.md`  
**Role:** Coordinated research pipeline (5 specialists)  
**Status:** **WORKING** (automated orchestrator running 24/7)  
**Members:**
- News Analyst
- Technical Analyst
- World Events Analyst
- Verdict Analyst
- Report Writer

**Automation:**
- Systemd service: `alpha-insights-orchestrator.service`
- Monitors: `research_triggers` Firestore collection
- Processes: Daily scheduled + custom user requests
- Output: Full research reports with multi-timeframe verdicts

---

## 📊 Project

**Alpha Insights Core Team**  
**Project ID:** Lda2QsCxOVKMHNUuwRyp  
**Dashboard:** https://gereld-project-manager.web.app

---

## 🔄 Workflow

### Feature Development Flow
1. **PM (Atlas)** creates task with clear requirements
2. **PM** assigns to **Designer (Pixel)** for UI/UX specs
3. **Designer** provides layout/CSS specs
4. **PM** assigns to **Dev (Apex)** for implementation
5. **Dev** builds feature, tests locally with `ionic serve`
6. **Dev** reports completion to **PM**
7. **PM** assigns to **QA (Scout)** for testing
8. **QA** tests in browser, reports bugs to **PM**
9. **PM** assigns bug fixes back to **Dev**
10. Repeat 7-9 until QA approves
11. **Dev** deploys to production
12. **PM** marks task complete

### Research Pipeline Flow
1. User requests research OR daily scheduler triggers
2. Cloud Function creates `research_trigger` document
3. **Research Team (Collective)** orchestrator picks up trigger
4. Parallel analysis (news, technical, world events)
5. Verdict synthesis across timeframes
6. Report generation and storage
7. User sees report in app
8. Status updated to 'complete'

---

## 🗑️ Legacy Cleanup

**Previous Team:** 47 agents (too many, unfocused)  
**New Team:** 5 core agents (lean, expert, coordinated)

**Legacy agents status:** Idle (available for reference, but not actively used)

**Benefits of new structure:**
- Clear roles and responsibilities
- No confusion about who handles what
- Better coordination and handoffs
- Faster iteration cycles
- Higher quality output

---

## 📝 Next Steps

1. **PM (Atlas):** Create initial task backlog
2. **QA (Scout):** Perform full app audit, report bugs
3. **PM:** Prioritize bug fixes and improvements
4. **Dev (Apex):** Start tackling P0/P1 items
5. **Designer (Pixel):** Review current UI, propose enhancements

---

## 📞 Escalation

**For Chadizzle approval:**
- Major feature decisions
- Budget/resource allocation
- Strategic direction changes
- Tech stack modifications

**Team autonomy:**
- Daily task execution
- Bug fixes
- UI/UX refinements
- Code optimizations
- Research pipeline tuning
