# Gereld Backend Functions

Clean architecture for billing webhooks with reusable business logic.

## Architecture

### Core Managers (Reusable Business Logic)

**`lib/subscriptionManager.ts`** - Subscription state management
- `activateSubscription()` - New subscription starts
- `renewSubscription()` - Subscription auto-renews
- `changeSubscription()` - Upgrade/downgrade
- `cancelSubscription()` - User cancels (keeps access until expiry)
- `expireSubscription()` - Subscription expires, revert to free
- `flagBillingIssue()` - Payment failed

**`lib/creditPackManager.ts`** - One-time credit purchases
- `purchaseCreditPack()` - User buys bonus credits

### Thin Webhooks (Platform Entry Points)

**`appleSubscriptionWebhook.ts`** - Routes RevenueCat subscription events
- Verifies RevenueCat auth header
- Parses Apple/iOS-specific payload
- Maps event types to manager functions
- Returns 200 always

**`appleCreditPackWebhook.ts`** - Routes RevenueCat credit pack events
- Verifies RevenueCat auth header
- Parses Apple/iOS-specific payload
- Calls `purchaseCreditPack()`
- Returns 200 always

## Product Mappings

### Subscriptions

| Product ID | Plan | Credits |
|---|---|---|
| `com.gereld.basic.monthly` | basic | 100 |
| `com.gereld.basic.yearly` | basic | 100 |
| `com.gereld.pro.monthly` | pro | 500 |
| `com.gereld.pro.yearly` | pro | 500 |
| `com.gereld.enterprise.monthly` | enterprise | 2000 |
| `com.gereld.enterprise.yearly` | enterprise | 2000 |

### Credit Packs

| Product ID | Credits | Price |
|---|---|---|
| `com.gereld.credits.50` | 50 | $4.99 |
| `com.gereld.credits.150` | 150 | $12.99 |
| `com.gereld.credits.500` | 500 | $39.99 |
| `com.gereld.credits.1000` | 1000 | $69.99 |

## Firestore Schema

### `users/{uid}`
```typescript
{
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise',
    platform: 'ios' | 'android' | 'web',
    productId: string,
    status: 'active' | 'cancelled' | 'expired',
    environment: 'production' | 'sandbox',
    startedAt: Timestamp,
    expiresAt: Timestamp | null,
    cancelledAt: Timestamp | null,
    billingIssue: boolean,
    lastRenewal: Timestamp
  },
  credits: number,
  updatedAt: Timestamp
}
```

### `creditUsage/{id}` (log collection)
```typescript
{
  uid: string,
  type: 'subscription_activated' | 'subscription_renewed' | 'subscription_changed' | 
        'subscription_expired' | 'credit_pack_purchased' | 'credits_spent',
  amount: number,
  planId?: string,
  oldPlanId?: string, // for subscription_changed
  productId?: string,
  platform: 'ios' | 'android' | 'web',
  priceInCents?: number, // for credit_pack_purchased
  environment: 'production' | 'sandbox',
  transactionId?: string,
  timestamp: Timestamp
}
```

### `purchases/{id}` (purchase records)
```typescript
{
  uid: string,
  type: 'subscription' | 'credit_pack',
  planId?: string,
  credits?: number,
  productId: string,
  platform: 'ios' | 'android' | 'web',
  priceInCents?: number,
  environment: 'production' | 'sandbox',
  transactionId?: string,
  status: 'active' | 'cancelled' | 'completed',
  purchasedAt: Timestamp,
  expiresAt?: Timestamp
}
```

### `stats/subscriptions`
```typescript
{
  activations: {
    basic: number,
    pro: number,
    enterprise: number,
    total: number
  },
  renewals: {
    basic: number,
    pro: number,
    enterprise: number,
    total: number
  },
  changes: {
    upgrades: number,
    downgrades: number,
    total: number
  },
  cancellations: { total: number },
  expirations: { total: number },
  billingIssues: { total: number },
  byPlatform: {
    ios: number,
    android: number,
    web: number
  },
  lastUpdated: Timestamp
}
```

### `stats/creditPacks`
```typescript
{
  totalPurchases: number,
  totalCredits: number,
  totalRevenueCents: number,
  byPlatform: {
    ios: { purchases: number, credits: number, revenueCents: number },
    android: { purchases: number, credits: number, revenueCents: number },
    web: { purchases: number, credits: number, revenueCents: number }
  },
  lastUpdated: Timestamp
}
```

## RevenueCat Event Types

### Subscription Events (routed to `appleSubscriptionWebhook`)
- `INITIAL_PURCHASE` → `activateSubscription()`
- `RENEWAL` → `renewSubscription()`
- `PRODUCT_CHANGE` → `changeSubscription()`
- `CANCELLATION` → `cancelSubscription()`
- `EXPIRATION` → `expireSubscription()`
- `BILLING_ISSUE` → `flagBillingIssue()`
- `UNCANCELLATION` → `activateSubscription()`

### Non-Subscription Events (routed to `appleCreditPackWebhook`)
- `NON_RENEWING_PURCHASE` → `purchaseCreditPack()`

## Deployment

```bash
cd backend/functions
npm install
npm run build
firebase deploy --only functions
```

## Environment Configuration

Set RevenueCat webhook secret:
```bash
firebase functions:config:set revenuecat.webhook_secret="YOUR_SECRET_HERE"
```

## Webhook URLs

After deployment:
- Subscriptions: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/appleSubscriptionWebhook`
- Credit Packs: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/appleCreditPackWebhook`

Configure these URLs in RevenueCat dashboard with `Bearer YOUR_SECRET_HERE` authorization.

## Adding New Platforms

To add Google Play or web billing:
1. Create `googleSubscriptionWebhook.ts` (thin entry point)
2. Call the same `subscriptionManager` functions
3. Map Google product IDs to plan IDs
4. Deploy and configure webhook URL

No changes needed to the core managers! 🎉

## Testing

```bash
# Local emulator
npm run serve

# Test webhook locally
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/appleSubscriptionWebhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

## Design Principles

✅ **Separation of Concerns** - Business logic separate from webhook routing  
✅ **Reusability** - Same managers work for iOS, Android, web, manual admin  
✅ **Thin Entry Points** - Webhooks just verify auth and route  
✅ **Always 200** - Prevent RevenueCat retries on errors  
✅ **Comprehensive Logging** - Track every state change in creditUsage  
✅ **Stats Tracking** - Real-time metrics for dashboard
