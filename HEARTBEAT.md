# HEARTBEAT.md

## 🍆 Periodic Agent Monitoring

Every 2-4 heartbeats (~30-60 min), check on all agents and update dashboard:

### Agent Status Check
1. List all isolated sessions (`sessions_list kinds=isolated`)
2. For each active agent session:
   - Check latest message to see what they're working on
   - Update dashboard status if changed
   - Move tasks between columns if work progressed
3. **Monitor PM task assignments:**
   - Check for new tasks in dashboard
   - Check for task status changes (backlog → in-progress → done)
   - **ALERT CHADIZZLE** when PM assigns tasks or tasks complete
4. Update `lastChecked` timestamp in this file

### What to Update
- Agent status (working → idle when complete)
- Task column (backlog → in-progress → done)
- Agent currentTask field
- Log significant milestones to memory

### When NOT to Update
- Agent just started (<5 min ago)
- No new messages since last check
- Status already reflects current state

### Example Check
```bash
# List agents
sessions_list kinds=isolated limit=10

# Update dashboard
node update-dashboard.js update-agent <id> --status idle --task "Completed XYZ"
node update-dashboard.js update-task <id> --column done
```

---

**Last Agent Check:** 2026-02-02 12:47 UTC
**Agents Monitored:** LaunchPad platform build agents
**Updates Made:** Database configured, tooling installed
**System Status:**
  - 🚧 LaunchPad Platform: Building Pump.fun competitor
  - ✅ Repository: launchpad-platform (committed to git)
  - ✅ Smart Contracts: Code complete (bonding curve, token factory, graduation)
  - ✅ Backend API: Code complete (NestJS + PostgreSQL configured)
  - ✅ Frontend: Code complete (Angular + PrimeNG)
  - ✅ ClawdBot Skill: Code complete
  - ✅ Database: PostgreSQL connection configured
  - ✅ Tooling: Solana CLI, Rust 1.93.0, Anchor CLI 0.30.1 installed
**Testing Status:**
  - ✅ Backend unit tests: PASSING (5/5)
  - ⚠️ Backend E2E tests: Need DB tables created
  - ⚠️ Frontend tests: Config issue (fixable)
  - 🚫 Smart contract tests: Anchor build failing (tooling issue)
**Blockers:**
  - Anchor build: "No such file or directory" error (investigating)
  - Database migrations: No migration files generated yet
**Notes:** All code generated and committed. Main blocker is Anchor build toolchain issues. Once resolved, can deploy contracts to devnet and run full integration tests.
**Next Check Due:** Monitor tooling installation progress
