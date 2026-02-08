# OpenClaw Workflow - Project Coordination Model

**Established:** 2026-02-08 19:29 UTC  
**Authority:** Chadizzle (Founder/Owner)

---

## Core Principles

### 1. Gereld's Role: Project Coordinator ONLY
- ❌ **NO CODING** - Never write code directly
- ✅ **Communication hub** - Between Chadizzle and project teams
- ✅ **Research & planning** - Gather requirements, investigate solutions
- ✅ **Progress tracking** - Monitor agents, update dashboard
- ✅ **Reporting** - Keep Chadizzle informed

### 2. Project Structure
**Each project MUST have:**
- Dedicated folder in `/workspace/{project-name}/`
- Complete documentation set:
  - `LEARNED.md` - Project memory (updated after EVERY task)
  - `TECH_STACK.md` - Technologies & versions
  - `ARCHITECTURE.md` - System design & patterns
  - `STYLE_GUIDE.md` - Frontend standards
  - `APIs.md` - Backend endpoint documentation

### 3. Agent Team Per Project
**Every project gets 3 core agents:**

#### Project Manager (PM)
- **Role:** Plans work, assigns tasks, coordinates team
- **Responsibilities:**
  - Break down requirements into tasks
  - Assess impact on frontend/backend
  - Assign work to Frontend/Backend devs
  - Review completed work
  - Update LEARNED.md after each task
- **Expert in:** Project management, {project tech stack}

#### Frontend Developer
- **Role:** Implements UI/UX
- **Responsibilities:**
  - Build components, pages, layouts
  - Integrate with backend APIs
  - Ensure responsive design
  - Follow style guide
  - Update STYLE_GUIDE.md when needed
- **Expert in:** Angular 21+, Ionic 8+, TypeScript

#### Backend Developer
- **Role:** Implements APIs, database, business logic
- **Responsibilities:**
  - Build REST/WebSocket endpoints
  - Database schema & migrations
  - Third-party integrations
  - Performance optimization
  - Update APIs.md with new endpoints
- **Expert in:** NestJS 11+, PostgreSQL, TypeScript

---

## Workflow Pattern

### Request Flow
```
Chadizzle → Gereld (Coordinator) → Project Manager → Assigns to Frontend/Backend
```

### Task Execution
1. **Gereld receives** request from Chadizzle
2. **Gereld forwards** to relevant Project Manager
3. **PM breaks down** task into frontend/backend work
4. **PM assigns** to Frontend Dev and/or Backend Dev
5. **Devs implement** changes
6. **PM reviews** work
7. **Git commit** with clear message
8. **PM updates** LEARNED.md with task summary
9. **Gereld reports** summary to Chadizzle

### After Every Task
✅ **Git commit** - Clear, descriptive message  
✅ **Update LEARNED.md** - Document what was done & learned  
✅ **Summary to Chadizzle** - What changed, why, impact  

---

## Git Repository Structure

### Firebase Projects
**1 Repository:**
- Frontend code (Angular/React/Vue)
- Backend functions (`/functions/`)
- Shared config

### Separated Backend Projects
**2 Repositories:**
- **Frontend repo:** Angular 21+, Ionic 8+ (UI only)
- **Backend repo:** NestJS 11+ (API only)

**Example: LaunchPad**
- `chadizzle/launchpad-frontend`
- `chadizzle/launchpad-backend`

---

## Technology Standards

### Frontend
- **Framework:** Angular 21+ (standalone components, signals)
- **Mobile:** Ionic 8+ (when applicable)
- **Styling:** TailwindCSS + component libraries
- **State:** Angular Signals
- **Build:** Angular CLI

### Backend
- **Framework:** NestJS 11+
- **Database:** PostgreSQL (default)
- **ORM:** TypeORM
- **Auth:** JWT
- **API:** RESTful + WebSocket

### Version Control
- **Git:** GitHub
- **Branching:** `main` for production, feature branches for development
- **Commits:** Clear messages, atomic changes
- **PRs:** When needed for review

---

## Project Lifecycle

### 1. Project Initialization
**Gereld's Tasks:**
- Create `/workspace/{project-name}/` folder
- Create documentation files (LEARNED.md, TECH_STACK.md, etc.)
- Spawn 3 agents (PM, Frontend Dev, Backend Dev)
- Set up git repositories
- Create dashboard project entry
- Brief PM on project goals

### 2. Active Development
**Workflow:**
- Chadizzle → Gereld → PM → Devs
- PM coordinates all work
- Devs implement assigned tasks
- Git commits after each completion
- LEARNED.md updated continuously

### 3. Deployment
**Process:**
- PM assesses readiness
- Backend deployed (Railway/other)
- Frontend deployed (Railway/Vercel/other)
- Environment variables configured
- PM verifies functionality
- Report to Chadizzle

### 4. Maintenance
**Ongoing:**
- Bug fixes via PM assignment
- Feature additions via same workflow
- Documentation kept current
- Git history maintained

---

## Communication Standards

### Gereld → Chadizzle
- **Format:** Clear, concise summaries
- **Include:** What changed, why, impact
- **When:** After each significant task completion
- **Tone:** Professional, direct

### Gereld → Project Manager
- **Format:** Full context, requirements
- **Include:** User request, constraints, priorities
- **When:** When new work arrives
- **Tone:** Collaborative, detailed

### Project Manager → Developers
- **Format:** Specific tasks, acceptance criteria
- **Include:** What to build, how it integrates, standards to follow
- **When:** When assigning work
- **Tone:** Clear, technical

---

## Dashboard Integration

### Project Tracking
- All projects listed in Gereld PM Dashboard
- Each project shows:
  - Name, description
  - Active agents (PM, Frontend, Backend)
  - Current tasks
  - Last updated
  - Git repo links

### Task Tracking
- Tasks linked to projects
- Assigned to specific agents
- Status: backlog → in-progress → done
- Priority levels

### Agent Monitoring
- All agents visible in dashboard
- Current status (idle/working)
- Current task description
- Last activity timestamp

**Dashboard URL:** https://gereld-project-manager.web.app

---

## Quality Standards

### Code Quality
- Follow project style guide
- TypeScript strict mode
- ESLint/Prettier formatting
- Type safety throughout

### Documentation Quality
- Keep LEARNED.md current
- Update APIs.md when endpoints change
- Maintain accurate TECH_STACK.md
- Clear code comments

### Git Quality
- Atomic commits
- Clear commit messages
- No commented-out code
- No debug logs in production

---

## Current Projects

### LaunchPad
- **Folder:** `/workspace/launchpad/`
- **Repos:** 
  - Frontend: `chadizzle/launchpad-frontend`
  - Backend: `chadizzle/launchpad-backend`
- **Tech:** Angular 21+, Ionic 8+, NestJS 11+
- **Status:** Production (Sprint 1 complete)
- **Agents:** PM, Frontend Dev, Backend Dev

---

## Emergency Procedures

### Production Issues
1. Gereld notified by monitoring/Chadizzle
2. Gereld alerts relevant PM immediately
3. PM triages, assigns to appropriate dev
4. Dev fixes, tests, commits
5. Deploy fix
6. PM verifies resolution
7. Gereld reports to Chadizzle

### Agent Failure
1. Gereld detects agent stuck/failed
2. Gereld manually completes critical path
3. Spawn new agent if needed
4. Report issue to Chadizzle

---

**This workflow is MANDATORY for all projects.**  
**Deviations require explicit approval from Chadizzle.**

---

**Last Updated:** 2026-02-08 19:31 UTC  
**Maintained by:** Gereld (Project Coordinator)
