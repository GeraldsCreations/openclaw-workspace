# LaunchPad - Frontend Style Guide

## Design Philosophy
**Modern, Clean, Fast** - Solana-inspired aesthetics with purple/blue gradients, responsive design, 60fps animations.

---

## Color Palette

### Primary Colors
```css
--primary: #9945FF;          /* Solana purple */
--primary-dark: #7929E8;
--primary-light: #B36FFF;

--secondary: #14F195;        /* Solana green */
--accent: #00D4FF;           /* Cyan highlight */
```

### Neutral Colors
```css
--bg-dark: #1A1A2E;         /* Dark background */
--bg-darker: #0F0F1E;       /* Darker sections */
--surface: #252540;         /* Card background */
--text-primary: #FFFFFF;
--text-secondary: #A0A0B8;
--border: #2D2D4A;
```

### Status Colors
```css
--success: #14F195;         /* Green */
--error: #FF4757;           /* Red */
--warning: #FFA502;         /* Orange */
--info: #00D4FF;            /* Cyan */
```

---

## Typography

### Fonts
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Scale
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### Weight
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## Component Patterns

### Buttons
```css
/* Primary button */
.btn-primary {
  background: linear-gradient(135deg, #9945FF 0%, #7929E8 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(153, 69, 255, 0.3);
}

/* Secondary button */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
}
```

### Cards
```css
.card {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}
```

### Gradients
```css
/* Background gradient */
.gradient-bg {
  background: linear-gradient(135deg, #1A1A2E 0%, #0F0F1E 100%);
}

/* Text gradient */
.gradient-text {
  background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Layout Patterns

### Grid System
```css
/* 12-column grid */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}
```

### Responsive Breakpoints
```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## Animations

### Transitions
```css
/* Fast */
transition: all 0.15s ease;

/* Normal */
transition: all 0.2s ease;

/* Slow */
transition: all 0.3s ease;
```

### Keyframes
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shimmer (loading) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

---

## Icon System
**Library:** Ionicons (Ionic native)

```html
<!-- Usage -->
<ion-icon name="wallet-outline"></ion-icon>
<ion-icon name="trending-up"></ion-icon>
<ion-icon name="star"></ion-icon>
```

### Common Icons
- `wallet-outline` - Wallet/account
- `trending-up` - Charts/growth
- `swap-horizontal` - Trading
- `star` - Watchlist
- `search` - Search
- `analytics` - Analytics
- `rocket` - Launch
- `checkmark-circle` - Success
- `close-circle` - Error

---

## Component Standards

### Token Card
```html
<div class="token-card">
  <div class="token-header">
    <img [src]="token.image" class="token-image" />
    <div class="token-info">
      <h3>{{ token.name }}</h3>
      <p>{{ token.symbol }}</p>
    </div>
  </div>
  <div class="token-stats">
    <span class="price">${{ token.price }}</span>
    <span class="change" [class.positive]="token.change > 0">
      {{ token.change }}%
    </span>
  </div>
</div>
```

### Loading Skeleton
```html
<div class="skeleton">
  <div class="skeleton-line w-full h-4"></div>
  <div class="skeleton-line w-3/4 h-4"></div>
  <div class="skeleton-line w-1/2 h-4"></div>
</div>
```

### Toast Notifications
```typescript
// Success
this.toastController.create({
  message: 'Token created successfully!',
  duration: 3000,
  color: 'success',
  position: 'top'
});

// Error
this.toastController.create({
  message: 'Transaction failed',
  duration: 5000,
  color: 'danger',
  position: 'top'
});
```

---

## Mobile Considerations

### Touch Targets
- Minimum size: 44x44px
- Spacing: 8px between interactive elements

### Gestures
- **Swipe left:** Delete from watchlist
- **Pull to refresh:** Reload token list
- **Long press:** Show options menu

### Performance
- Lazy load images
- Virtual scrolling for long lists
- Debounce search inputs (300ms)

---

## Accessibility

### ARIA Labels
```html
<button aria-label="Add to watchlist">
  <ion-icon name="star-outline"></ion-icon>
</button>
```

### Color Contrast
- Text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

## Code Organization

### File Naming
```
kebab-case.component.ts
kebab-case.service.ts
kebab-case.guard.ts
```

### Component Structure
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [...],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss']
})
export class ComponentNameComponent {
  // 1. Signals
  data = signal<Data[]>([]);
  
  // 2. Injected services
  private service = inject(ServiceName);
  
  // 3. Lifecycle hooks
  ngOnInit() {}
  
  // 4. Public methods
  doSomething() {}
  
  // 5. Private methods
  private helper() {}
}
```

---

**Last Updated:** 2026-02-08  
**Maintained by:** Frontend Developer
