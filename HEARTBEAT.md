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

**Last Agent Check:** 2026-02-01 20:30 UTC
**Agents Monitored:** No active isolated agents
**Updates Made:** None - all agents idle
**System Status:**
  - ✅ Alpha Insights: https://alpha-insights-84c51.web.app (deployed 19:35 UTC)
  - ✅ Cloud Functions: 13/16 deployed (19:36 UTC)
  - ✅ Collections: All renamed to lowercase_snake_case
  - ✅ Research Orchestrator: LIVE as systemd service (20:30 UTC - RESTARTED)
  - ✅ Real Market Data APIs: CoinGecko + Yahoo Finance - **FIXED 403 errors**
  - ✅ Auto-Processing: Working (BTC + ETH tested)
  - ✅ Git pushed: Commit 9a705d6
**Active Work:**
  - None - all systems operational and automated
**Notes:** Fixed CoinGecko 403 Forbidden errors by adding User-Agent headers to API requests. Service restarted. ETH processing now works. All market data fetching operational.
**Next Check Due:** Next heartbeat cycle (~30-60 min)
