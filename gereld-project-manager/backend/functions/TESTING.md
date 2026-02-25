# Testing Guide

## Local Testing with Firebase Emulator

### 1. Start the Emulator

```bash
cd backend/functions
npm install
npm run serve
```

This starts the Firebase Functions emulator on `http://localhost:5001`.

### 2. Test Subscription Webhook

```bash
# Set your test secret
export TEST_SECRET="test-webhook-secret-123"

# Initial purchase (activates subscription)
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/appleSubscriptionWebhook \
  -H "Authorization: Bearer $TEST_SECRET" \
  -H "Content-Type: application/json" \
  -d @test-payloads/subscription-initial-purchase.json

# Renewal
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/appleSubscriptionWebhook \
  -H "Authorization: Bearer $TEST_SECRET" \
  -H "Content-Type: application/json" \
  -d @test-payloads/subscription-renewal.json

# Product change (upgrade/downgrade)
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/appleSubscriptionWebhook \
  -H "Authorization: Bearer $TEST_SECRET" \
  -H "Content-Type: application/json" \
  -d @test-payloads/subscription-product-change.json

# Cancellation
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/appleSubscriptionWebhook \
  -H "Authorization: Bearer $TEST_SECRET" \
  -H "Content-Type: application/json" \
  -d @test-payloads/subscription-cancellation.json
```

### 3. Test Credit Pack Webhook

```bash
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/appleCreditPackWebhook \
  -H "Authorization: Bearer $TEST_SECRET" \
  -H "Content-Type: application/json" \
  -d @test-payloads/credit-pack-purchase.json
```

## Verifying Results

### Check Firestore

After running test payloads, verify Firestore collections:

**Users collection:**
```
/users/test-user-123
```

Should contain:
- `subscription` object with plan, status, dates
- `credits` number
- `updatedAt` timestamp

**Credit usage logs:**
```
/creditUsage
```

Should contain log entries for each event:
- `subscription_activated`
- `subscription_renewed`
- `subscription_changed`
- `credit_pack_purchased`

**Purchases collection:**
```
/purchases
```

Should contain purchase records with transaction IDs.

**Stats collections:**
```
/stats/subscriptions
/stats/creditPacks
```

Should show incremented counters.

## Manual Function Testing

You can also test the core managers directly in the Firebase shell:

```bash
npm run shell
```

Then in the shell:

```javascript
const { activateSubscription } = require('./lib/subscriptionManager');

// Test activation
activateSubscription(
  'test-user-123',
  'pro',
  'ios',
  'com.gereld.pro.monthly',
  'sandbox',
  'test-transaction-123',
  new Date('2025-03-01')
);
```

## Production Testing

### 1. Deploy to staging/dev Firebase project

```bash
firebase use dev
firebase deploy --only functions
```

### 2. Configure RevenueCat

In RevenueCat dashboard:
1. Go to **Integrations** → **Webhooks**
2. Add webhook URL: `https://us-central1-YOUR_DEV_PROJECT.cloudfunctions.net/appleSubscriptionWebhook`
3. Set authorization: `Bearer YOUR_DEV_SECRET`
4. Select events to send

### 3. Test with sandbox purchases

1. Use a sandbox Apple ID
2. Make test purchases in your iOS app
3. Verify webhooks are received
4. Check Firestore for correct data

## Common Issues

### Auth header not working
- Ensure config is set: `firebase functions:config:set revenuecat.webhook_secret="YOUR_SECRET"`
- Redeploy after setting config
- Check header format: `Bearer YOUR_SECRET` (note the space)

### Webhook not receiving events
- Verify URL is correct in RevenueCat dashboard
- Check function logs: `firebase functions:log`
- Ensure webhook is deployed: `firebase deploy --only functions`

### Firestore writes failing
- Check Firebase Admin is initialized in index.ts
- Verify service account has Firestore permissions
- Check function logs for error details

## Test Coverage Checklist

- [ ] Initial subscription purchase (Basic)
- [ ] Initial subscription purchase (Pro)
- [ ] Initial subscription purchase (Enterprise)
- [ ] Subscription renewal
- [ ] Upgrade (Basic → Pro)
- [ ] Upgrade (Pro → Enterprise)
- [ ] Downgrade (Enterprise → Pro)
- [ ] Downgrade (Pro → Basic)
- [ ] Cancellation
- [ ] Expiration
- [ ] Billing issue
- [ ] Uncancellation
- [ ] Credit pack purchase (50 credits)
- [ ] Credit pack purchase (150 credits)
- [ ] Credit pack purchase (500 credits)
- [ ] Credit pack purchase (1000 credits)
- [ ] Unknown product ID (should log warning, return 200)
- [ ] Invalid auth header (should return 200, no processing)
- [ ] Malformed JSON (should return 200, no processing)

## Monitoring in Production

```bash
# Watch logs in real-time
firebase functions:log --only appleSubscriptionWebhook,appleCreditPackWebhook

# Check recent errors
firebase crashlytics:report

# Query stats
# (Use Firebase console or custom admin script)
```
