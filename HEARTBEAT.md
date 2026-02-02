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

**Last Agent Check:** 2026-02-02 11:44 UTC
**Agents Monitored:** LaunchPad platform build agents
**Updates Made:** 4 new agents spawned for full platform build
**System Status:**
  - 🚧 LaunchPad Platform: Building Pump.fun competitor
  - ✅ Repository: launchpad-platform (initialized, documented)
  - 🚧 Smart Contracts: Agent building Solana programs (bonding curve, token factory)
  - 🚧 Backend API: Agent building NestJS server (public/private API, indexer)
  - 🚧 Frontend: Agent building Angular + PrimeNG web UI
  - 🚧 ClawdBot Skill: Agent building trading skill
**Active Work:**
  - Smart Contracts Dev (2 week timeline)
  - Backend API Dev (2 week timeline)
  - Frontend Dev (2 week timeline)
  - ClawdBot Skill Dev (1 week timeline)
**Notes:** Major new platform - LaunchPad token launch platform for AI agents + humans. Hybrid Pump.fun competitor with API-first design. 4 specialized agents building components simultaneously. Target: Production launch in 6 weeks (March 15, 2026).
**Next Check Due:** Monitor agent progress daily
