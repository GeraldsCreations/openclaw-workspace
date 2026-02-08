# AGENT_WORKFLOW.md - Agent Lifecycle Standards

## Purpose
This document defines the standard workflow for all AI agents in the OpenClaw system to ensure reliability, cohesion, and accountability.

---

## 🔄 Agent Lifecycle Checklist

### 1. **SPAWN** (Agent Initialization)
**When:** Agent is created via `sessions_send` or similar mechanism

**Actions:**
- [ ] Read assigned task/mission from spawn context
- [ ] Read `AGENTS.md` to understand role and environment
- [ ] Read `TOOLS.md` for environment-specific notes
- [ ] Read `ACTIVE_AGENTS.md` to see current agent activity
- [ ] Read `PROJECT_STATE.md` for current sprint context
- [ ] Update dashboard: Add self as new agent with status "working"
- [ ] Log spawn event in `memory/YYYY-MM-DD.md`

**Example:**
```bash
# Dashboard update at spawn
cd /root/.openclaw/workspace/gereld-project-manager
node update-dashboard.js add-agent "Frontend Dev" --status working --task "Implement login page"
```

### 2. **WORK** (Task Execution)
**During:** Active task execution

**Actions:**
- [ ] Follow retry policy (see below) for all operations
- [ ] Update `ACTIVE_AGENTS.md` every 30 minutes with progress
- [ ] Commit and push after each significant component completion
- [ ] Log progress in `memory/YYYY-MM-DD.md`
- [ ] Report to main session every 30 min if long-running task

**Progress Reporting:**
```bash
# Every 30 minutes during work
sessions_send --label main "🔧 [Agent Name] Progress Update: Completed X, working on Y, ETA Z minutes"
```

### 3. **ERROR** (Error Handling)
**When:** Operation fails or exception occurs

**Actions:**
- [ ] Apply retry policy (3 attempts with exponential backoff)
- [ ] Log error details in `memory/YYYY-MM-DD.md`
- [ ] If retry exhausted, escalate to main session
- [ ] Update dashboard status to "blocked" with error description
- [ ] Document blocker in `PROJECT_STATE.md`

**Escalation Format:**
```bash
sessions_send --label main "❌ [Agent Name] BLOCKED: Failed to X after 3 retries. Error: [details]. Need human intervention."
```

### 4. **COMPLETION** (Task Finalization)
**When:** Task successfully completed or definitively blocked

**Actions:**
- [ ] Final commit and push of all changes
- [ ] Update `COMPLETED_WORK.md` with summary
- [ ] Update dashboard: Change status to "idle", log final task
- [ ] Report completion to main session with deliverables
- [ ] Update `ACTIVE_AGENTS.md` to remove self or mark idle
- [ ] Log completion in `memory/YYYY-MM-DD.md`

**Completion Report Format:**
```markdown
## Task: [Name]
**Status:** ✅ Complete
**Duration:** X minutes
**Deliverables:**
- Commit: abc123
- Files: file1.ts, file2.md
- Tests: Passed
**Notes:** Any important context for future work
```

---

## 📊 Dashboard Update Requirements

### When to Update Dashboard
1. **Agent spawn** → Add agent immediately
2. **Status change** → working → idle → blocked
3. **Task transition** → Starting new task
4. **Completion** → Final status update
5. **Error/blocked** → Update with blocker info

### Update Commands
```bash
# Add new agent
node update-dashboard.js add-agent "<name>" --status working --task "<task>"

# Update status
node update-dashboard.js update-agent <id> --status idle --task "Completed: <summary>"

# List current agents
node update-dashboard.js list-agents
```

### Dashboard Status Values
- `working` - Actively executing task
- `idle` - Available for new tasks
- `blocked` - Waiting on external dependency or error

---

## 🔁 Retry Policies

### Standard Retry Policy
**All operations that can fail should use retry logic:**

```typescript
import { retryWithBackoff } from './utils/retry';

const result = await retryWithBackoff(
  async () => {
    // Your operation here
    return await someOperation();
  },
  {
    maxRetries: 3,
    operation: 'descriptive-name',
  }
);
```

### Retry Schedule
- **Attempt 1:** Immediate
- **Attempt 2:** 1 second delay
- **Attempt 3:** 2 seconds delay
- **Attempt 4:** 4 seconds delay

### What to Retry
✅ **Do retry:**
- Network requests (API calls, git operations)
- File system operations (read/write/delete)
- Database operations
- External tool invocations

❌ **Don't retry:**
- User input requests
- Operations with side effects (sending messages)
- Authentication failures (likely need human intervention)

### Escalation After Retry Exhaustion
If all retries fail:
1. Log full error details to `memory/YYYY-MM-DD.md`
2. Send message to main session with error context
3. Update dashboard to "blocked" status
4. Wait for human intervention

---

## 💬 Communication Protocols

### Inter-Agent Communication
Agents should NOT communicate directly. All coordination goes through shared files:

**Read-Only:**
- `AGENTS.md` - System knowledge
- `TOOLS.md` - Environment config
- `PROJECT_STATE.md` - Current sprint status

**Read-Write:**
- `ACTIVE_AGENTS.md` - Real-time agent status
- `COMPLETED_WORK.md` - Work log
- `memory/YYYY-MM-DD.md` - Daily event log

### Reporting to Main Session
```bash
# Progress update (every 30 min for long tasks)
sessions_send --label main "🔧 [Agent] Update: [what you did] [what's next]"

# Completion
sessions_send --label main "✅ [Agent] Complete: [summary] Deliverables: [list]"

# Error/Blocked
sessions_send --label main "❌ [Agent] BLOCKED: [issue] Need: [what's needed]"

# Question (when decision needed)
sessions_send --label main "❓ [Agent] Question: [context] Options: A) X B) Y"
```

### Message Formatting
- Use emoji prefixes: 🔧 (working), ✅ (done), ❌ (error), ❓ (question)
- Be concise but informative
- Include ETA when possible
- Link to commit hashes for code changes

---

## 📝 Memory Logging Standards

### Daily Log Format: `memory/YYYY-MM-DD.md`

```markdown
# YYYY-MM-DD - Agent Activity Log

## [HH:MM] Agent: [Name]
**Action:** Spawned
**Task:** [Description]
**Status:** Working

## [HH:MM] Agent: [Name]
**Action:** Progress
**Completed:** [What was done]
**Next:** [What's next]

## [HH:MM] Agent: [Name]
**Action:** Error
**Operation:** [What failed]
**Error:** [Error message]
**Retry:** 1/3

## [HH:MM] Agent: [Name]
**Action:** Complete
**Task:** [Description]
**Duration:** X minutes
**Deliverables:** [List]
**Commit:** abc123
```

### What to Log
**Always log:**
- Agent spawn
- Task start/completion
- Errors and retries
- Dashboard updates
- Commits pushed

**Optionally log:**
- Significant progress milestones
- Decision points
- Interesting discoveries

### Log Entry Template
```markdown
## [HH:MM] Agent: [Your Name]
**Action:** [Spawn|Progress|Error|Complete]
**Task:** [Brief description]
**Status:** [Working|Idle|Blocked]
**Details:** [Relevant information]
**Next:** [What happens next]
```

---

## 🎯 Best Practices

### Do's ✅
- **Update dashboard at every state transition**
- **Commit after each completed component**
- **Report progress every 30 min for long tasks**
- **Use retry utility for all fallible operations**
- **Log all significant events**
- **Read shared context files before major decisions**

### Don'ts ❌
- **Don't skip dashboard updates**
- **Don't commit broken code**
- **Don't go silent for >45 minutes**
- **Don't retry indefinitely**
- **Don't make assumptions - read PROJECT_STATE.md**
- **Don't communicate directly between agents**

---

## 🚀 Quick Start Example

```bash
# 1. Spawn - Read context
cat AGENTS.md TOOLS.md ACTIVE_AGENTS.md PROJECT_STATE.md

# 2. Spawn - Update dashboard
cd /root/.openclaw/workspace/gereld-project-manager
node update-dashboard.js add-agent "My Agent" --status working --task "Build feature X"

# 3. Work - Execute with retries
# (Use retry utility in code)

# 4. Work - Commit progress
git add . && git commit -m "feat: implement component A" && git push

# 5. Work - Report progress
sessions_send --label main "🔧 My Agent: Completed component A (commit abc123), starting component B, ETA 20 min"

# 6. Complete - Final commit
git add . && git commit -m "feat: complete feature X" && git push

# 7. Complete - Update files
echo "Feature X complete" >> COMPLETED_WORK.md

# 8. Complete - Update dashboard
node update-dashboard.js update-agent <id> --status idle --task "Completed: Feature X"

# 9. Complete - Report
sessions_send --label main "✅ My Agent Complete: Feature X delivered. Commit: abc123. Tests passing."
```

---

## 🔍 Health Monitoring

Agents are monitored by an automated health check system that runs every 30 minutes:

- **Silent >45 min:** Agent receives ping
- **Silent >2 hours:** Alert sent to main coordinator
- **Dashboard drift:** Dashboard updated with actual status

If you're working on a long task, report progress at least every 30 minutes to avoid false alerts.

---

## 📚 Related Documents
- `AGENTS.md` - Your role and environment
- `ACTIVE_AGENTS.md` - Current agent activity
- `PROJECT_STATE.md` - Sprint context and blockers
- `COMPLETED_WORK.md` - Historical work log
- `utils/retry.ts` - Retry utility implementation

---

**Last Updated:** 2026-02-08
**Version:** 1.0
