# 🎨 LaunchPad Platform Redesign - Pump Bots Dark Theme

## Reference Design
Source: `/root/.openclaw/media/inbound/file_0---a61133c3-3f92-4b5d-9c06-a9757df71368.jpg`

## Color Palette

**Background:**
- Primary: `#1a1b1f` (dark charcoal)
- Secondary: `#252730` (slightly lighter panels)
- Tertiary: `#2d2f3a` (cards/containers)

**Accents:**
- Primary: `#8b5cf6` (vibrant purple - buttons, highlights)
- Success: `#10b981` (green - positive changes, buy)
- Danger: `#ef4444` (red - negative changes, sell)
- Warning: `#f59e0b` (orange/yellow - alerts)

**Text:**
- Primary: `#ffffff` (white - headings, important text)
- Secondary: `#9ca3af` (gray - labels, secondary info)
- Muted: `#6b7280` (darker gray - tertiary info)

**Borders:**
- Default: `#374151` (dark gray)
- Hover: `#4b5563` (lighter gray)

## Layout Changes

### 1. Token Detail Page - 3-Column Grid

**Desktop Layout (1200px+):**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Token Name, Price, %Change, Market Cap            │
├──────────────────┬─────────────────┬────────────────────────┤
│                  │                 │  Trading Panel         │
│  Chart Area      │  Activity Tabs  │  ┌──────────────────┐ │
│  (TradingView)   │  - Thread       │  │ Buy / Sell       │ │
│  60% width       │  - Holders      │  │ Amount input     │ │
│                  │  - AI Logs      │  │ Price preview    │ │
│  ┌────────────┐  │  20% width      │  │ Balance/Impact   │ │
│  │ Live Chart │  │                 │  │ [Buy Button]     │ │
│  │ Green fill │  │  (Scrollable    │  └──────────────────┘ │
│  │ Candlesticks│  │   content)      │                      │
│  └────────────┘  │                 │  AI Agent Insights   │
│                  │                 │  ┌──────────────────┐ │
│  Bonding Curve   │                 │  │ 🧠 Icon          │ │
│  Progress Bar    │                 │  │ Recent Activity  │ │
│  [========78%]   │                 │  │ Next Action      │ │
│  GRADUATION →    │                 │  └──────────────────┘ │
└──────────────────┴─────────────────┴────────────────────────┘
```

**Mobile Layout (<768px):**
- Stack vertically
- Chart full width at top
- Tabs below chart
- Trading panel fixed at bottom

### 2. Global Navigation

**Top Bar:**
- Logo (left) + "Pump Bots" style
- Nav links: Home | Create | Portfolio (center)
- Connect Wallet button (right, purple)
- Dark background `#1a1b1f`

### 3. Dashboard/Home Page

**Hero Section:**
- Large "Trending Tokens" header
- Grid of token cards (3 columns desktop, 1 mobile)
- Each card: dark background, hover effect

**Token Cards:**
```
┌─────────────────────────────┐
│ [Icon] Token Name (SYMBOL)  │
│ $0.04521  +18.45%          │
│ MC: $1.2M   Vol: $500K      │
│ [Bonding Curve Progress]    │
└─────────────────────────────┘
```

## Component Redesigns

### TradingView Chart Integration

**Replace current chart with TradingView widget:**
- Area chart with green fill
- Candlestick option
- Dark theme colors
- Time intervals: 1D, 5D, 1M, 6M, YTD, 1Y, All
- Price + volume data
- Responsive height

**Implementation:**
```typescript
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

<AdvancedRealTimeChart
  theme="dark"
  symbol="CRYPTO:BTCUSD"
  interval="D"
  height={400}
  width="100%"
  style="3"
  backgroundColor="#1a1b1f"
  gridColor="#252730"
  allow_symbol_change={false}
/>
```

### Bonding Curve Progress Bar

**Visual:**
- Horizontal bar, full width
- Green fill showing progress (0-100%)
- Label: "Bonding Curve Progress: 78%"
- End label: "GRADUATION" (green text when near 100%)

**Code:**
```html
<div class="bonding-curve-container">
  <div class="progress-header">
    <span>Bonding Curve Progress: <strong>78%</strong></span>
    <span class="graduation-label">GRADUATION</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" [style.width]="progressPercent + '%'"></div>
  </div>
</div>
```

### Activity Tabs Component

**3 Tabs:**
1. **Thread** - Chat/comments (like Discord)
   - User avatars (colorful circles)
   - Username + timestamp
   - Message text
   - Input box at bottom: "Type a message..."

2. **Holders** - Top wallets
   - Wallet address (truncated)
   - Amount held (in ETH)
   - Colored wallet icons
   - Sortable by amount

3. **AI Logs** - Agent activity feed
   - 🤖 AI Agent icon
   - Activity description
   - Timestamp
   - Real-time updates

### Trading Panel

**Design:**
- Buy/Sell toggle tabs at top
- Large amount input (ETH)
- Swap icon ↕
- Token amount output
- Price display
- Balance, Price Impact, Fees (right-aligned)
- Large purple "Buy [TOKEN]" button
- Rounded corners, dark background

### AI Agent Insights Card

**Layout:**
- 🧠 Brain icon
- "AI Agent Insights" heading
- ⚡ Recent Activity section
- 🎯 Next Action section
- Small help icon (?) at top-right

## CSS/Styling Updates

### Global Styles

**Background gradient:**
```css
body {
  background: linear-gradient(135deg, #1a1b1f 0%, #252730 100%);
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**Cards:**
```css
.card {
  background: #2d2f3a;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

**Buttons:**
```css
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: scale(1.02);
}
```

**Inputs:**
```css
input, textarea {
  background: #1a1b1f;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #ffffff;
  padding: 12px 16px;
  font-size: 16px;
}

input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
```

**Price Changes:**
```css
.price-up {
  color: #10b981;
  font-weight: 600;
}

.price-down {
  color: #ef4444;
  font-weight: 600;
}
```

## Typography

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Sizes:**
- H1 (Token name): 32px, bold
- H2 (Section headers): 24px, semibold
- Price (large): 48px, bold
- Body text: 14px, regular
- Small text: 12px, regular

## Implementation Files

**Files to Update:**

1. **Global Theme:**
   - `src/styles.css` - Global CSS variables
   - `src/app/app.component.ts` - Dark theme class

2. **Token Detail Page:**
   - `src/app/features/token-detail/token-detail.component.html`
   - `src/app/features/token-detail/token-detail.component.scss`
   - `src/app/features/token-detail/token-detail.component.ts`

3. **New Components:**
   - `src/app/features/token-detail/components/thread.component.ts`
   - `src/app/features/token-detail/components/holders-list.component.ts`
   - `src/app/features/token-detail/components/ai-logs.component.ts`
   - `src/app/features/token-detail/components/bonding-curve-progress.component.ts`
   - `src/app/features/token-detail/components/ai-insights-card.component.ts`

4. **Dashboard:**
   - `src/app/features/dashboard/dashboard.component.html`
   - `src/app/features/dashboard/dashboard.component.scss`

5. **Shared Components:**
   - `src/app/shared/components/token-card.component.ts` - Update styling
   - `src/app/shared/components/trade-form.component.ts` - Purple theme

## Testing Checklist

- [ ] Dark theme applied globally
- [ ] TradingView chart loads correctly
- [ ] 3-column layout responsive
- [ ] Activity tabs switch correctly
- [ ] Trading panel calculates properly
- [ ] Bonding curve progress updates
- [ ] All colors match reference
- [ ] Hover effects work
- [ ] Mobile layout stacks correctly
- [ ] No visual regressions on other pages

## Success Criteria

**Visual Match:**
- ✅ Dark background (#1a1b1f)
- ✅ Purple accents (#8b5cf6)
- ✅ Green area chart
- ✅ 3-column layout
- ✅ Bonding curve progress bar
- ✅ Thread/Holders/AI Logs tabs
- ✅ AI Agent Insights card
- ✅ Modern, polished look

**Functionality:**
- ✅ All existing features still work
- ✅ Real-time updates continue
- ✅ Trading calculations correct
- ✅ WebSocket integration intact
- ✅ Performance maintained

## Estimated Time
- **Theme Updates:** 30 min
- **Token Detail Redesign:** 60 min
- **New Components:** 45 min
- **Dashboard Updates:** 30 min
- **Testing & Polish:** 30 min
- **Total:** ~3 hours

---

**Reference Image:** `/root/.openclaw/media/inbound/file_0---a61133c3-3f92-4b5d-9c06-a9757df71368.jpg`
