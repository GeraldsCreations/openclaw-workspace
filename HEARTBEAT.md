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

**Last Agent Check:** 2026-02-01 23:10 UTC
**Agents Monitored:** All TSLA research agents completed successfully
**Updates Made:** None - monitoring only
**System Status:**
  - ✅ Alpha Insights: https://alpha-insights-84c51.web.app (deployed 22:43 UTC with WSJ enhancements)
  - ✅ WSJ-Quality Agents: All 4 enhanced role files deployed (news, technical, price, verdicts)
  - ✅ TSLA Analysis: Complete - 6/6 agents succeeded (23:10 UTC)
  - ✅ AAPL Analysis: Complete - 6/6 agents succeeded (22:41 UTC)
  - ✅ Schema Redesign: Deployed - ZERO "UNKNOWN" verdicts
  - ✅ Git pushed: Commit c2540ba (WSJ improvements documented)
**Active Work:**
  - None - all research complete, agents idle
**Notes:** Major quality upgrade deployed - all agents now produce WSJ-level analysis with tables, historical context, exact numbers, confidence scores, and risk quantification. TSLA & AAPL analyses demonstrate improvements working perfectly.
**Next Check Due:** Next heartbeat cycle (~30-60 min)
