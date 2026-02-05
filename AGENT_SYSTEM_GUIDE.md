# LaunchPad Agent System Guide

**For:** Chadizzle  
**Purpose:** How to use the new PM + Dev team structure

---

## 🎯 What Changed?

You now have a **3-agent team** that handles LaunchPad development:

1. **📋 LaunchPad PM** - Coordinates everything
2. **🎨 Frontend Dev** - Builds UI (Angular)
3. **⚙️ Backend Dev** - Builds API (NestJS)

---

## 🚀 How to Request Features

### Before (Old Way):
```
You: "Add a trending tokens section to the homepage"
Gereld: *builds it all himself*
```

### Now (New Way):
```
You: "Add a trending tokens section to the homepage"
Gereld: *spawns PM agent*
PM: *analyzes requirement*
PM: *spawns backend dev* - "Create GET /v1/tokens/trending endpoint"
PM: *spawns frontend dev* - "Create TrendingTokensComponent"
PM: *monitors both agents*
PM: *reports when complete*
```

---

## 📝 How to Use It

### Simple Request:

**You say:**
> "Add a button to buy tokens"

**What happens:**
1. Gereld spawns the **PM agent**
2. PM analyzes: This needs frontend work
3. PM spawns **Frontend Dev** with task
4. Frontend Dev builds the button
5. PM reports back when done

### Complex Request:

**You say:**
> "Add a leaderboard showing top token creators"

**What happens:**
1. Gereld spawns the **PM agent**
2. PM analyzes:
   - Backend needs: `GET /v1/creators/leaderboard` endpoint
   - Frontend needs: LeaderboardComponent
   - Backend must finish first (dependency)
3. PM spawns **Backend Dev** first
4. When backend completes, PM spawns **Frontend Dev**
5. PM reports progress at each step
6. PM reports final completion

---

## 🎭 Meet Your Team

### 📋 LaunchPad PM
- **Name:** PM LaunchPad
- **Job:** Break down your requests, assign work
- **When spawned:** Whenever you request a LaunchPad feature
- **What they do:**
  - Analyze your requirement
  - Split into frontend/backend tasks
  - Spawn dev agents with clear instructions
  - Monitor progress
  - Report back to you

### 🎨 Frontend Developer
- **Name:** Frontend Dev
- **Repo:** `launchpad-frontend/` ONLY
- **Stack:** Angular, TypeScript, Tailwind CSS
- **What they build:**
  - UI components
  - Pages
  - Routing
  - API integration
  - Mobile-responsive designs

### ⚙️ Backend Developer
- **Name:** Backend Dev
- **Repo:** `launchpad-backend/` ONLY
- **Stack:** NestJS, PostgreSQL, Solana
- **What they build:**
  - API endpoints
  - Database changes
  - Blockchain integration
  - Background jobs

---

## 📊 Dashboard Integration

All agents automatically update the **Gereld PM Dashboard**:
- When spawned → Added to dashboard
- When working → Status shows "working"
- When done → Status shows "idle"
- Tasks → Tracked in kanban board

**View dashboard:** https://gereld-project-manager.web.app

---

## 💬 Example Conversations

### Example 1: Simple UI Change

**You:**
> Make the token cards bigger

**Gereld:**
> Spawning PM to handle this...

**PM:**
> This is a frontend-only change. Spawning Frontend Dev...

**Frontend Dev:**
> ✅ Task complete: Increased token card size from 320px to 400px  
> Commit: abc123f  
> Tested on mobile and desktop

**PM:**
> ✅ Feature complete! Token cards are now bigger.

**You:**
> Perfect, thanks!

---

### Example 2: New Feature (Full-Stack)

**You:**
> Add a watchlist feature where users can save favorite tokens

**Gereld:**
> Spawning PM to coordinate this feature...

**PM:**
> Analyzing requirement...
> 
> **Backend Tasks:**
> 1. Create watchlist table
> 2. Add POST /v1/watchlist/add endpoint
> 3. Add DELETE /v1/watchlist/remove endpoint
> 4. Add GET /v1/watchlist endpoint
> 
> **Frontend Tasks:**
> 1. Add star icon to token cards
> 2. Create WatchlistPage component
> 3. Integrate watchlist API
> 4. Add to navigation
> 
> **Dependencies:**
> - Backend must complete first
> 
> Spawning Backend Dev...

**Backend Dev:**
> Working on watchlist endpoints...
> 
> ✅ Created watchlist table (migration)  
> ✅ Added POST /watchlist/add  
> ✅ Added DELETE /watchlist/remove  
> ✅ Added GET /watchlist  
> ✅ All endpoints tested  
> ✅ Swagger docs updated  
> 
> Commit: def456g  
> Ready for frontend integration

**PM:**
> Backend complete! Spawning Frontend Dev...

**Frontend Dev:**
> Working on watchlist UI...
> 
> ✅ Added star icon to token cards  
> ✅ Created WatchlistPage component  
> ✅ Integrated with watchlist API  
> ✅ Added to navigation menu  
> ✅ Mobile responsive  
> ✅ Loading/error states handled  
> 
> Commit: hij789k  
> Feature ready for testing

**PM:**
> ✅ Feature Complete: Watchlist System
> 
> **Backend:**
> - ✅ 3 endpoints created
> - ✅ Database migration
> - ✅ Committed: def456g
> 
> **Frontend:**
> - ✅ Watchlist page created
> - ✅ Star icons added
> - ✅ Committed: hij789k
> 
> **Next:** Ready for testing / deployment

**You:**
> Awesome! Let's test it.

---

## 🎨 What You Can Request

### UI Changes (Frontend Only)
- "Make the header sticky"
- "Change color scheme to purple"
- "Add loading animations"
- "Improve mobile layout"

### API Changes (Backend Only)
- "Add pagination to token list"
- "Optimize trending query"
- "Add caching to expensive endpoints"
- "Fix bug in buy endpoint"

### Full Features (Both)
- "Add user profiles"
- "Add token comments"
- "Add trading history"
- "Add price alerts"

---

## 🔍 Monitoring Progress

### Ask Gereld:
> "What are the agents working on?"

**Gereld will:**
- List all active agents
- Show what each is doing
- Show progress status
- Show completion estimates

### Check Dashboard:
Visit: https://gereld-project-manager.web.app
- See all agents (working/idle)
- See all tasks (backlog/in-progress/done)
- See recent activity

---

## ⚠️ Important Notes

### Agents Work Independently
- Each agent ONLY touches their repo
- Frontend Dev never edits backend
- Backend Dev never edits frontend
- PM coordinates between them

### Clear Communication
- PM asks questions if requirements unclear
- Agents report progress regularly
- You get updates at each milestone
- Final report when complete

### Quality First
- Agents test before committing
- No broken code pushed
- Mobile-responsive designs
- Proper error handling

---

## 🎯 Best Practices

### Be Specific
**❌ Vague:** "Make it better"  
**✅ Clear:** "Make token cards show 24h price change percentage"

### Provide Context
**❌ Missing context:** "Add a button"  
**✅ With context:** "Add a buy button to each token card that opens the buy modal"

### Ask Questions
If you're unsure what's possible, just ask:
- "Can we add [feature]?"
- "How hard would it be to [change]?"
- "What would it take to [implement]?"

PM will analyze and tell you the scope.

---

## 🚀 Getting Started

### Try It Now:

**You say:**
> "PM, add a simple counter showing total tokens on the homepage"

**What will happen:**
1. Gereld spawns PM
2. PM analyzes (frontend-only change)
3. PM spawns Frontend Dev
4. Frontend Dev adds counter
5. PM reports completion
6. You see the result!

---

## 📞 Support

### If Something Goes Wrong:

**Agent stuck:**
- Ask Gereld: "What's blocking the [agent]?"
- Gereld will check and resolve

**Build failing:**
- PM will detect and report
- Assign fix as priority task

**Not what you wanted:**
- Just say: "That's not quite right, I wanted [clarification]"
- PM will adjust and reassign

---

## 🎉 Benefits

**For You:**
- ✅ Just describe what you want
- ✅ PM figures out how to build it
- ✅ Specialists handle each part
- ✅ Regular progress updates
- ✅ High-quality results

**For The Platform:**
- ✅ Faster development
- ✅ Better code quality
- ✅ Clear separation of concerns
- ✅ Easier to maintain

---

## 📚 More Info

**Agent Definitions:**
- `agents/launchpad-pm.md` - PM instructions
- `agents/launchpad-frontend-dev.md` - Frontend dev guide
- `agents/launchpad-backend-dev.md` - Backend dev guide

**Platform Docs:**
- `launchpad-backend/README.md` - Backend overview
- `launchpad-frontend/README.md` - Frontend overview (to be created)

---

**Ready to build? Just tell me what you want to add! 🚀**
