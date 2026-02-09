# Token Detail Screen Integration Guide

This guide explains how to integrate the new real-time polling features into the existing token detail screen.

---

## 🎯 What's Been Implemented

### Backend ✅ COMPLETE
1. **GeckoTerminalService** - Fetches trades, holders, price history from GeckoTerminal API
2. **Enhanced HoldersService** - Adds creator/AI agent flags and USD values
3. **New API Endpoints:**
   - `GET /api/tokens/:address/trades?limit=50`
   - `GET /api/tokens/:address/holders?limit=50`
   - `GET /api/tokens/:address/price-history?timeframe=15m&limit=100`

### Frontend ✅ READY
1. **TokenPollingService** - Polls endpoints every 10-30s, emits RxJS observables
2. **Enhanced LiveChartComponent** - Uses real price history with glowing line effect
3. **Demo Components:**
   - `EnhancedTradesDemoComponent` - Shows all features for trades
   - `EnhancedHoldersDemoComponent` - Shows all features for holders

---

## 🧪 Testing the Backend

### 1. Start the Backend
```bash
cd /root/.openclaw/workspace/launchpad-project/launchpad-backend
npm run start:dev
```

### 2. Test GeckoTerminal Integration
Pick any Solana token (e.g., popular meme coin):

```bash
# Test token info
curl "http://localhost:3000/api/tokens/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump" | jq '.'

# Test trades endpoint
curl "http://localhost:3000/api/tokens/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump/trades?limit=10" | jq '.trades | length'

# Test holders endpoint
curl "http://localhost:3000/api/tokens/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump/holders?limit=10" | jq '.holders | length'

# Test price history endpoint
curl "http://localhost:3000/api/tokens/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump/price-history?timeframe=15m&limit=50" | jq '.data | length'
```

### 3. Verify Caching (10s TTL)
Run the same request twice quickly:
```bash
# First request (cache miss)
time curl "http://localhost:3000/api/tokens/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump/trades?limit=10" > /dev/null

# Second request (cache hit - should be <5ms)
time curl "http://localhost:3000/api/tokens/Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump/trades?limit=10" > /dev/null
```

### 4. Check Response Format
Expected trades response:
```json
{
  "tokenMint": "Dfh5DzRgSvvCFDoYc2ciTkMrbDfRKybA4SoFbPmApump",
  "tokenPriceUsd": 0.27,
  "solPriceUsd": 87.5,
  "creator": "ABC123...",
  "trades": [
    {
      "signature": "3kGbkh9ZF...",
      "type": "buy",
      "amount": 630.5,
      "tokenAmount": 630.5,
      "solAmount": 1.96,
      "price": 0.00311,
      "priceUsd": 0.27,
      "timestamp": "2026-02-09T00:36:06.000Z",
      "walletAddress": "8Hh2Vrvo1y...",
      "volumeUsd": 170.37,
      "solValueUsd": 171.46,
      "isCreator": false,
      "isAiAgent": false
    }
  ],
  "timestamp": "2026-02-09T01:00:00.000Z"
}
```

---

## 🎨 Integrating into Existing Components

### Option 1: Replace Existing Components (Recommended)
Use the demo components directly:

1. **Replace trades table:**
```typescript
// In token-detail.component.ts
import { EnhancedTradesDemoComponent } from './components/enhanced-trades-demo.component';

// In template
<app-enhanced-trades-demo [tokenAddress]="token.address"></app-enhanced-trades-demo>
```

2. **Replace holders list:**
```typescript
import { EnhancedHoldersDemoComponent } from './components/enhanced-holders-demo.component';

<app-enhanced-holders-demo [tokenAddress]="token.address"></app-enhanced-holders-demo>
```

### Option 2: Update Existing Components
Follow these steps to integrate into `trades-holders-tabs.component.ts`:

#### Step 1: Import TokenPollingService
```typescript
import { TokenPollingService } from '../../../core/services/token-polling.service';

constructor(
  private apiService: ApiService,
  private tokenWsService: TokenWebSocketService,
  private pollingService: TokenPollingService // Add this
) {}
```

#### Step 2: Replace loadTrades() Method
```typescript
private loadTrades(): void {
  this.loading = true;
  
  // Start polling
  this.pollingService.startTradesPolling(this.tokenAddress, 500);
  
  // Subscribe to updates
  this.pollingService.trades$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      if (data && data.tokenMint === this.tokenAddress) {
        // Map to existing format
        this.allTrades = data.trades.map(trade => ({
          id: 0,
          transactionSignature: trade.signature,
          signature: trade.signature,
          tokenAddress: this.tokenAddress,
          trader: trade.walletAddress,
          side: trade.type,
          amountSol: trade.solAmount,
          amountTokens: trade.tokenAmount,
          price: trade.priceUsd,
          fee: 0,
          timestamp: new Date(trade.timestamp),
          // New fields
          isCreator: trade.isCreator,
          isAiAgent: trade.isAiAgent,
          solValueUsd: trade.solValueUsd
        }));
        
        this.applyFiltersAndSorting();
        this.loading = false;
      }
    });
}
```

#### Step 3: Update Template to Show Icons
Add icons column to the trades table:
```html
<thead>
  <tr>
    <th></th> <!-- Icons column -->
    <th>Time</th>
    <th>Type</th>
    <!-- ... other columns ... -->
  </tr>
</thead>
<tbody>
  @for (trade of paginatedTrades; track trade.signature) {
    <tr class="trade-row" [class.buy]="trade.side === 'buy'" [class.sell]="trade.side === 'sell'">
      <td class="icons-cell">
        @if (trade.isCreator) {
          <span class="icon creator-icon" title="Token Creator">🏗️</span>
        }
        @if (trade.isAiAgent) {
          <span class="icon ai-agent-icon" title="AI Agent">🤖</span>
        }
      </td>
      <!-- ... rest of columns ... -->
    </tr>
  }
</tbody>
```

#### Step 4: Add CSS for Red/Green Rows
```css
.trade-row.buy {
  background-color: rgba(16, 185, 129, 0.08);
  border-left: 3px solid #10b981;
}

.trade-row.sell {
  background-color: rgba(239, 68, 68, 0.08);
  border-left: 3px solid #ef4444;
}

.icon {
  font-size: 16px;
  cursor: help;
}

.creator-icon {
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
}

.ai-agent-icon {
  filter: drop-shadow(0 0 4px rgba(0, 188, 212, 0.6));
}
```

#### Step 5: Add Flash Animation
```css
@keyframes flash-new {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  30% {
    opacity: 1;
    background-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.trade-row.new {
  animation: flash-new 1s ease-out;
}
```

Track new trades:
```typescript
private newTradeSignatures = new Set<string>();

// In subscription:
const previousSignatures = new Set(this.allTrades.map(t => t.signature));
data.trades.forEach(trade => {
  if (!previousSignatures.has(trade.signature)) {
    this.newTradeSignatures.add(trade.signature);
    setTimeout(() => this.newTradeSignatures.delete(trade.signature), 2000);
  }
});

// In template:
[class.new]="isNewTrade(trade.signature)"

// Method:
isNewTrade(signature: string): boolean {
  return this.newTradeSignatures.has(signature);
}
```

#### Step 6: Add Value Column
```html
<th>Value (USD)</th>

<td class="value-cell">
  <span class="value-usd">\${{ trade.solValueUsd?.toFixed(2) || '0.00' }}</span>
</td>
```

```css
.value-cell {
  font-weight: 600;
  color: #10b981;
}
```

#### Step 7: Cleanup on Destroy
```typescript
ngOnDestroy(): void {
  this.pollingService.stopAllPolling(this.tokenAddress);
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## 🔥 Quick Start (Fastest Path)

### For Immediate Testing:

1. **Backend** - Already running? Test endpoints:
```bash
curl "http://localhost:3000/api/tokens/YOURTOKENADDRESS/trades?limit=10" | jq '.'
```

2. **Frontend** - Add demo components to `token-detail.component.ts`:
```typescript
// Replace this section in the template:
<div class="tabs-section">
  <app-enhanced-trades-demo [tokenAddress]="token.address"></app-enhanced-trades-demo>
</div>

<!-- Holders section -->
<div class="holders-section" style="margin-top: 20px;">
  <app-enhanced-holders-demo [tokenAddress]="token.address"></app-enhanced-holders-demo>
</div>
```

3. **Import components:**
```typescript
import { EnhancedTradesDemoComponent } from './components/enhanced-trades-demo.component';
import { EnhancedHoldersDemoComponent } from './components/enhanced-holders-demo.component';

imports: [
  // ... existing imports
  EnhancedTradesDemoComponent,
  EnhancedHoldersDemoComponent
]
```

4. **Run frontend:**
```bash
cd /root/.openclaw/workspace/launchpad-project/launchpad-frontend
npm start
```

5. **Navigate to any token detail page and watch the magic! ✨**

---

## 📊 Feature Checklist

### Backend
- [x] GeckoTerminal API integration
- [x] 10-second cache for trades/holders
- [x] 30-second cache for price history
- [x] Creator wallet identification
- [x] AI agent wallet identification (infrastructure ready)
- [x] SOL price fetching
- [x] Token price calculation
- [x] Value calculations (SOL × SOL price)

### Frontend
- [x] TokenPollingService with RxJS
- [x] LiveChart with real price history
- [x] Glowing chart line effect
- [x] Market cap display
- [x] Demo trades component with all features
- [x] Demo holders component with all features
- [ ] Integration into existing trades-holders-tabs (TODO)
- [ ] Flash animations for new data (demo only)
- [ ] Red/green row colors (demo only)
- [ ] Creator/AI agent icons (demo only)
- [ ] Value columns (demo only)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** "Token not found" error
**Solution:** Make sure the token exists in your database (check `tokens` table)

**Problem:** "No pool found for token"
**Solution:** Token must have a GeckoTerminal listing. Try with popular tokens first.

**Problem:** Slow API responses
**Solution:** Check GeckoTerminal API status. Cache should speed up subsequent requests.

### Frontend Issues

**Problem:** "No data loading"
**Solution:** 
1. Check browser console for errors
2. Verify backend is running
3. Check CORS settings
4. Verify token address is correct

**Problem:** "Polling not working"
**Solution:**
1. Check that TokenPollingService is imported
2. Verify subscriptions are set up correctly
3. Check browser network tab for API calls
4. Ensure ngOnDestroy stops polling

### CSS Not Applied

**Problem:** Styles not showing
**Solution:**
1. Ensure styles are in component's `styles` array
2. Check for conflicting global CSS
3. Use browser DevTools to inspect elements

---

## 🚀 Next Steps

1. **Test Backend** - Use curl commands above
2. **Test Demo Components** - Add to token detail screen
3. **Verify Polling** - Watch browser network tab (should see requests every 10s)
4. **Check Animations** - New trades should flash green/red
5. **Verify Icons** - Creator should show 🏗️, AI agents should show 🤖
6. **Check Values** - USD values should display correctly

### Future Enhancements
- [ ] Store AI agent wallets in database
- [ ] Add WebSocket for instant trade notifications
- [ ] Add volume bars to chart
- [ ] Add holder distribution chart
- [ ] Add price alerts
- [ ] Add trade size filters
- [ ] Add wallet tracking (watch specific wallets)

---

## 📝 Files Created/Modified

### Backend
- `launchpad-backend/src/public-api/services/geckoterminal.service.ts` (NEW)
- `launchpad-backend/src/public-api/services/holders.service.ts` (MODIFIED)
- `launchpad-backend/src/public-api/controllers/tokens.controller.ts` (MODIFIED)
- `launchpad-backend/src/public-api/public-api.module.ts` (MODIFIED)

### Frontend
- `launchpad-frontend/src/app/core/services/token-polling.service.ts` (NEW)
- `launchpad-frontend/src/app/core/services/api.service.ts` (MODIFIED)
- `launchpad-frontend/src/app/features/token-detail/components/live-chart.component.ts` (MODIFIED)
- `launchpad-frontend/src/app/features/token-detail/components/enhanced-trades-demo.component.ts` (NEW)
- `launchpad-frontend/src/app/features/token-detail/components/enhanced-holders-demo.component.ts` (NEW)

---

**Good luck! 🎉** The foundation is solid. Just plug in the demo components and you're good to go!
