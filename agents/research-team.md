# Research Team - Alpha Insights Pipeline

## Team Structure
Coordinated specialists working together to produce high-quality research reports.

## Team Members

### 1. **News Analyst**
- Gathers recent news for the asset
- Summarizes key events and announcements
- Identifies sentiment (bullish/bearish/neutral)
- Sources: Web search, financial news APIs

### 2. **Technical Analyst**
- Analyzes price charts and patterns
- Calculates technical indicators (RSI, MACD, moving averages)
- Identifies support/resistance levels
- Determines trend direction
- Sources: Market data APIs (CoinGecko, Yahoo Finance)

### 3. **World Events Analyst**
- Examines macro factors affecting the asset
- Considers geopolitical events, regulations, market conditions
- Assesses sector trends and industry developments
- Sources: Web search, economic calendars

### 4. **Verdict Analyst**
- Synthesizes all research inputs
- Produces timeframe-specific verdicts (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
- Rates confidence levels (1-10)
- Provides LONG/SHORT/NEUTRAL recommendations

### 5. **Report Writer**
- Compiles all analyses into cohesive report
- Writes clear, professional summaries
- Structures information logically
- Ensures readability and actionability

## Research Pipeline

### Input
- **Ticker Symbol:** e.g., BTC, ETH, AAPL, TSLA
- **Asset Type:** crypto or stock
- **Request Source:** Daily scheduler or custom user request

### Process
1. **Data Collection:** Fetch market data, news, world events
2. **Parallel Analysis:** News, technical, world events run concurrently
3. **Synthesis:** Verdict analyst combines insights
4. **Report Generation:** Writer creates final report
5. **Storage:** Save to Firestore (`research_reports` collection)
6. **Delivery:** Display in app, notify user

### Output Format
```typescript
{
  ticker: string,
  assetType: 'crypto' | 'stock',
  generatedAt: Timestamp,
  
  // Market Data
  currentPrice: number,
  priceChange24h: number,
  marketCap: number,
  volume24h: number,
  
  // Analyses
  newsAnalysis: {
    summary: string,
    sentiment: 'bullish' | 'bearish' | 'neutral',
    keyEvents: string[]
  },
  
  technicalAnalysis: {
    trend: 'LONG' | 'SHORT' | 'NEUTRAL',
    rsi: number,
    macdSignal: string,
    supportLevels: number[],
    resistanceLevels: number[]
  },
  
  worldEvents: {
    summary: string,
    impact: 'positive' | 'negative' | 'neutral',
    factors: string[]
  },
  
  // Verdicts
  verdicts: {
    '1D': { direction: 'LONG' | 'SHORT' | 'NEUTRAL', confidence: number },
    '1W': { ... },
    '1M': { ... },
    '3M': { ... },
    '6M': { ... },
    '1Y': { ... },
    '5Y': { ... }
  },
  
  // Final Report
  report: {
    summary: string,
    keyInsights: string[],
    risks: string[],
    opportunities: string[]
  }
}
```

## Automation
**Research Orchestrator** (`research-orchestrator.js`)
- Runs as systemd service (`alpha-insights-orchestrator.service`)
- Monitors `research_triggers` collection
- Processes requests automatically
- Updates status in Firestore
- Handles errors and retries

**Daily Scheduler** (Cloud Function)
- Triggers research for watchlist assets
- Runs at configured times
- Creates research_trigger documents
- Orchestrator picks up and processes

## Quality Standards
- **Accuracy:** Verify data sources, cross-reference facts
- **Timeliness:** Use recent data (within 24 hours)
- **Completeness:** Cover all analysis dimensions
- **Clarity:** Write for non-expert users
- **Actionability:** Provide clear verdicts and confidence levels

## Data Sources
- **CoinGecko API:** Crypto market data
- **Yahoo Finance API:** Stock market data
- **Web Search:** News, events, sentiment
- **Internal Database:** Historical reports, user preferences

## Error Handling
- Retry failed API calls (3 attempts)
- Graceful degradation (partial data okay)
- Log errors for debugging
- Update trigger status to 'failed' if irrecoverable
- Notify user of failures

## Performance Goals
- **Speed:** Generate report in <30 seconds
- **Reliability:** 95%+ success rate
- **Scalability:** Handle 100+ concurrent requests
- **Cost:** Minimize API calls, cache when possible

## Collaboration
- Each analyst works independently
- Results shared via structured data
- Verdict analyst coordinates final synthesis
- Report writer ensures cohesive narrative

## Continuous Improvement
- Monitor report quality
- Gather user feedback
- Refine prompts and logic
- Update data sources as needed
- Expand analysis dimensions over time

## Current Status
- ✅ Pipeline fully automated
- ✅ All analysts implemented
- ✅ Orchestrator running 24/7
- ✅ Daily scheduler active
- ✅ Custom requests supported
- 🚧 Performance optimization ongoing
- 🚧 Additional data sources being integrated
