# Alpha Insights Research Workflow

## Overview
Multi-stage pipeline that transforms a ticker symbol into a comprehensive, multi-timeframe analysis report published to the Alpha Insights app.

---

## Pipeline Stages

### Stage 0: Ticker Selection
**Owner:** Research Coordinator  
**Duration:** ~5 minutes  
**Input:** Market data, user requests, trending topics  
**Output:** Selected ticker + priority level  

**Actions:**
1. Review market conditions and trending tickers
2. Check user watchlists and alert requests
3. Prioritize based on: demand, timeliness, coverage gaps
4. Create research task in Firestore `ResearchQueue` collection
5. Assign to Stage 1 (World Events Analyst)

---

### Stage 1: World Events Analysis
**Owner:** World Events Analyst  
**Duration:** ~30 minutes  
**Input:** Ticker symbol  
**Output:** Macro context summary (200-300 words)  

**Focus:**
- Federal Reserve policy, interest rates, inflation
- Geopolitical events (trade, sanctions, conflicts)
- Market sentiment (risk-on/risk-off)
- Sector-specific trends
- Impact assessment on ticker

**Deliverable:** Markdown summary → hands off to Stage 2

---

### Stage 2: Price Analysis
**Owner:** Price Analysis Specialist  
**Duration:** ~20 minutes  
**Input:** Ticker symbol  
**Output:** Current price action summary (200-300 words)  

**Focus:**
- Current price and recent movement (1-7 days)
- Volume analysis (accumulation/distribution)
- Momentum indicators (RSI, MACD)
- Key support/resistance levels
- Unusual activity (whale moves, institutional flows)

**Deliverable:** Markdown summary → hands off to Stage 3

---

### Stage 3: News Analysis
**Owner:** News Analyst  
**Duration:** ~25 minutes  
**Input:** Ticker symbol  
**Output:** News & developments summary (200-300 words)  

**Focus:**
- Recent headlines (1-7 days)
- Earnings reports and analyst reactions
- Upcoming catalysts (product launches, FDA approvals)
- Social media sentiment
- Analyst upgrades/downgrades

**Deliverable:** Markdown summary → hands off to Stage 4

---

### Stage 4: Technical Analysis
**Owner:** Technical Analysis Specialist  
**Duration:** ~30 minutes  
**Input:** Ticker symbol  
**Output:** Technical analysis summary (300-400 words)  

**Focus:**
- Multi-timeframe trend alignment (daily, 4H, 1H)
- Chart patterns (triangles, H&S, flags)
- Indicator analysis (MA, RSI, MACD, Bollinger Bands)
- Fibonacci levels
- Trade setup (entry, stop, targets)

**Deliverable:** Markdown summary → hands off to Stage 5

---

### Stage 5: Report Writing
**Owner:** Report Writer  
**Duration:** ~30 minutes  
**Input:** 4 specialist summaries (World Events, Price, News, Technical)  
**Output:** Synthesized research report (800-1200 words)  

**Actions:**
1. Read all 4 specialist inputs
2. Synthesize into cohesive narrative
3. Resolve conflicting signals
4. Structure for mobile consumption
5. Add visual formatting (emojis, headings, bullets)
6. Include key takeaways and risk considerations

**Deliverable:** Full report → hands off to Stage 6

---

### Stage 6: Verdict Generation
**Owner:** Verdict Analyst  
**Duration:** ~20 minutes  
**Input:** Synthesized report from Report Writer  
**Output:** Multi-timeframe verdicts (7 timeframes)  

**Actions:**
1. Analyze report through 7 timeframe lenses
2. Generate BUY/SELL/HOLD verdicts for:
   - 5 minute, 1 hour, 4 hour, 24 hour, 1 week, 1 month, 1 year
3. Assign confidence levels (High/Medium/Low)
4. Provide reasoning for each verdict
5. Add position sizing and risk management guidance
6. Identify key price levels to watch

**Deliverable:** Complete analysis report → hands off to Stage 7

---

### Stage 7: Publication
**Owner:** Research Coordinator  
**Duration:** ~5 minutes  
**Input:** Complete report with verdicts  
**Output:** Published to Firestore  

**Actions:**
1. Quick QA review (formatting, accuracy)
2. Add metadata (timestamp, tickers, asset type, verdicts)
3. Publish to Firestore `AnalysisPosts` collection
4. Update research queue status to "PUBLISHED"
5. Notify users with relevant price alerts/watchlists (via Cloud Functions)
6. Log metrics (time to publish, specialist performance)

**Result:** Report live in Alpha Insights app! 🎉

---

## Total Pipeline Time
**Target:** 2.5 hours (per ticker)  
**Realistic:** 3 hours (accounting for coordination overhead)  

**Daily Capacity:**
- 1 Research Team = ~3-4 reports/day (if sequential)
- Multiple specialists working in parallel = higher throughput

---

## Firestore Data Structure

### ResearchQueue Collection
```typescript
{
  id: string;                    // Auto-generated
  ticker: string;                // "AAPL", "BTC", etc.
  assetType: 'stock' | 'crypto';
  priority: 'high' | 'medium' | 'low';
  status: 'QUEUED' | 'EVENTS' | 'PRICE' | 'NEWS' | 'TECHNICAL' | 'WRITING' | 'VERDICT' | 'REVIEW' | 'PUBLISHED';
  assignedTo: string | null;     // Current specialist working on it
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stages: {
    worldEvents?: string;        // Markdown summary
    priceAnalysis?: string;      // Markdown summary
    newsAnalysis?: string;       // Markdown summary
    technicalAnalysis?: string;  // Markdown summary
    reportDraft?: string;        // Full report
    verdicts?: VerdictData;      // Multi-timeframe verdicts
  };
}
```

### AnalysisPosts Collection (Published Reports)
```typescript
{
  id: string;
  ticker: string;
  assetType: 'stock' | 'crypto';
  currentPrice: number;
  priceChange24h: number;
  
  // Full report sections
  globalContext: string;         // World Events summary
  priceAction: string;           // Price Analysis summary
  newsAndDevelopments: string;   // News Analysis summary
  technicalAnalysis: string;     // Technical Analysis summary
  keyTakeaways: string[];
  risksAndConsiderations: string[];
  bottomLine: string;
  
  // Verdicts
  verdicts: {
    '5min': VerdictEntry;
    '1hr': VerdictEntry;
    '4hr': VerdictEntry;
    '24hr': VerdictEntry;
    '1wk': VerdictEntry;
    '1mo': VerdictEntry;
    '1yr': VerdictEntry;
  };
  
  // Metadata
  publishedAt: Timestamp;
  researchTeam: string[];        // List of analyst IDs
  version: number;
  
  // Engagement
  views: number;
  bookmarks: number;
  shares: number;
}

interface VerdictEntry {
  verdict: 'BUY' | 'HOLD' | 'SELL';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}
```

---

## Coordination Patterns

### Sequential (Current Design)
Specialists work one after another:
- **Pros:** Clear handoffs, each specialist has full context
- **Cons:** Slower (2.5-3 hours per ticker)

### Parallel (Future Optimization)
Specialists 1-4 work simultaneously:
- World Events, Price, News, Technical all analyze at once
- Report Writer waits for all 4 inputs
- **Pros:** Faster (1.5 hours per ticker)
- **Cons:** More coordination overhead

### Hybrid (Best of Both)
- Specialists 1-4 work in parallel (~30 min)
- Report Writer synthesizes (~30 min)
- Verdict Analyst finalizes (~20 min)
- **Total:** ~1.5 hours per ticker 🔥

---

## Quality Assurance

### Research Coordinator Checkpoints
1. **Pre-Assignment:** Is this ticker timely and relevant?
2. **Mid-Pipeline:** Are specialists on track (time/quality)?
3. **Pre-Publication:** Does the report meet quality standards?

### Quality Standards
- [ ] All sections complete (no TBD placeholders)
- [ ] Conflicting signals acknowledged and explained
- [ ] Verdicts logically consistent across timeframes
- [ ] Mobile-friendly formatting (short paragraphs, clear headings)
- [ ] Grammar/spelling perfect
- [ ] Data accurate (price, date, ticker symbol)
- [ ] Sources cited where appropriate

---

## Metrics to Track

### Pipeline Efficiency
- Time per stage (identify bottlenecks)
- Total time: assign → publish
- Daily throughput (reports published/day)

### Quality Metrics
- User engagement (views, read time, bookmarks)
- Verdict accuracy (% of calls that proved correct)
- User feedback scores (helpful/not helpful votes)

### Team Performance
- Individual specialist velocity (time per analysis)
- Quality scores (Research Coordinator ratings)
- Revision rate (how often reports need rework)

---

## Scaling the Workflow

### 1 Research Team (Current)
- 3-4 reports/day (sequential)
- 5-8 reports/day (parallel)

### 3 Research Teams
- 10-15 reports/day (sequential)
- 20-25 reports/day (parallel)

**Recommendation:** Start with 1 team, optimize workflow, then scale horizontally by adding more teams.

---

## Next Steps

1. **Build workflow automation** (Firestore triggers, Cloud Functions)
2. **Create specialist coordination bot** (assigns tasks, tracks progress)
3. **Implement quality scoring system**
4. **Set up metrics dashboard** (pipeline health, team performance)
5. **Test with pilot ticker** (e.g., AAPL or BTC)
6. **Iterate based on learnings**
7. **Scale to multiple teams**

---

*This is the engine that powers Alpha Insights. 🚀*
