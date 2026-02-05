# Workspace Structure

**Last Updated:** 2026-02-05 19:35 UTC

---

## 📁 Current Structure

```
/root/.openclaw/workspace/
├── agents/                           # Agent definitions
│   ├── launchpad-pm.md              # LaunchPad Project Manager
│   ├── launchpad-frontend-dev.md    # Frontend Developer
│   └── launchpad-backend-dev.md     # Backend Developer
│
├── launchpad-project/               # Main LaunchPad project
│   ├── launchpad-backend/           # NestJS API (separate git repo)
│   ├── launchpad-frontend/          # Angular UI (separate git repo)
│   └── launchpad-trader-skill/      # Trading bot skill
│
├── gereld-project-manager/          # PM Dashboard
│   └── update-dashboard.js          # Dashboard update script
│
├── skills/                          # Installed skills
│   ├── weather/
│   ├── github/
│   └── ...
│
├── memory/                          # Daily memory logs
│   ├── 2026-02-05.md
│   └── ...
│
├── AGENTS.md                        # Agent system guide
├── SOUL.md                          # Agent personality
├── USER.md                          # User info
├── MEMORY.md                        # Long-term memory
├── HEARTBEAT.md                     # Heartbeat checklist
├── AGENT_SYSTEM_GUIDE.md            # How to use the agent team
└── WORKSPACE_STRUCTURE.md           # This file
```

---

## 🎯 LaunchPad Project Structure

### Backend (`launchpad-project/launchpad-backend/`)

**Git Repo:** https://github.com/GeraldsCreations/launchpad-backend  
**Tech:** NestJS, TypeScript, PostgreSQL, Solana  
**Status:** ✅ Production-ready, fully documented

**Key Files:**
- `README.md` - Project overview
- `PROJECT_STATUS.md` - Current state
- `ARCHITECTURE.md` - System design
- `GETTING_STARTED.md` - Developer guide
- `src/` - Source code

### Frontend (`launchpad-project/launchpad-frontend/`)

**Git Repo:** https://github.com/GeraldsCreations/launchpad-frontend  
**Tech:** Angular 17+, TypeScript, Tailwind CSS  
**Status:** ✅ Built, needs documentation

**Key Files:**
- `src/app/` - Angular application
- `src/assets/` - Static assets
- `angular.json` - Angular config

---

## 🤖 Agent Team

### LaunchPad PM
- **File:** `agents/launchpad-pm.md`
- **Role:** Coordinates feature development
- **Spawns:** Frontend Dev + Backend Dev

### Frontend Developer
- **File:** `agents/launchpad-frontend-dev.md`
- **Workspace:** `launchpad-project/launchpad-frontend/`
- **Stack:** Angular, TypeScript, Tailwind CSS

### Backend Developer
- **File:** `agents/launchpad-backend-dev.md`
- **Workspace:** `launchpad-project/launchpad-backend/`
- **Stack:** NestJS, PostgreSQL, Solana

---

## 📊 Dashboard

**URL:** https://gereld-project-manager.web.app  
**Script:** `gereld-project-manager/update-dashboard.js`

**Usage:**
```bash
cd /root/.openclaw/workspace/gereld-project-manager

# Add agent
node update-dashboard.js add-agent "Agent Name" --status working

# Add task
node update-dashboard.js add-task "Task Name" --agent <id> --priority high

# Update status
node update-dashboard.js update-agent <id> --status idle
```

---

## 🗑️ Removed (2026-02-05)

**launchpad-platform/** - Old monorepo (removed to prevent confusion)
- Contained both frontend and backend in one repo
- Split into separate repos (launchpad-backend, launchpad-frontend)
- All documentation recreated and improved in new repos
- Removed to ensure agents work in correct directories

---

## 🔄 Git Repositories

**Workspace Repo:**
- https://github.com/GeraldsCreations/openclaw-workspace
- Contains: agents/, memory/, config files

**LaunchPad Backend:**
- https://github.com/GeraldsCreations/launchpad-backend
- Standalone repo with API code

**LaunchPad Frontend:**
- https://github.com/GeraldsCreations/launchpad-frontend
- Standalone repo with UI code

---

## 📝 Important Paths for Agents

**Frontend Dev should work in:**
```bash
/root/.openclaw/workspace/launchpad-project/launchpad-frontend/
```

**Backend Dev should work in:**
```bash
/root/.openclaw/workspace/launchpad-project/launchpad-backend/
```

**PM should reference:**
```bash
/root/.openclaw/workspace/agents/launchpad-pm.md
```

---

## ✅ Quality Checklist

When spawning agents, ensure:
- [ ] Correct working directory specified
- [ ] Agent file path correct
- [ ] Task clearly defined
- [ ] Dependencies noted
- [ ] Dashboard updated

---

**Maintained by:** Gereld 🍆  
**For questions:** Check AGENT_SYSTEM_GUIDE.md
