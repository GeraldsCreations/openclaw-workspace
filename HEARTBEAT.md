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

**Last Agent Check:** 2026-02-02 20:09 UTC
**Agents Monitored:** 0 active isolated sessions
**Updates Made:** None (no agents currently running)
**Active Work:**
  - **Main session:** Solana wallet integration complete (Reown AppKit)
  - **LaunchPad Trader Skill:** Created (complete wallet management + API integration)
**System Status:**
  - ✅ LaunchPad Platform: OPERATIONAL (frontend + backend running)
  - ✅ Solana Wallet Integration: COMPLETE (Reown AppKit + multi-wallet support)
  - ✅ LaunchPad Trader Skill: DEPLOYED (OpenClaw skill for wallet management)
  - ✅ Backend API: LIVE on http://localhost:3000/v1
  - ✅ Frontend UI: LIVE on http://localhost:4200
  - ✅ Database: Connected (7 tables created)
**Latest Deliverables:**
  - Reown AppKit integration (Phantom, Solflare, Backpack, Glow support)
  - SolanaWalletService with full wallet connectivity
  - Transaction signing & sending via user's wallet
  - LaunchPad Trader skill (wallet.js + launchpad.js)
  - Comprehensive wallet setup documentation
**Blockers:** None currently
**Notes:** All recent work completed and pushed to GitHub. No active sub-agents. System fully operational.
**Next Check Due:** ~30 min
