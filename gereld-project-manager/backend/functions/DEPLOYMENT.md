# Deployment Guide

Quick-start guide for deploying Gereld billing webhooks to Firebase.

## Prerequisites

- Firebase project created
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in: `firebase login`
- RevenueCat account with iOS app configured

## Initial Setup

### 1. Install Dependencies

```bash
cd backend/functions
npm install
```

### 2. Initialize Firebase Project

```bash
# From backend/ directory
firebase init

# Select:
# - Functions: Configure and deploy Cloud Functions
# - Firestore: Deploy rules and create indexes
# - Use existing project (select your Gereld project)
# - TypeScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### 3. Configure Environment

```bash
# Set RevenueCat webhook secret
firebase functions:config:set revenuecat.webhook_secret="YOUR_SECRET_FROM_REVENUECAT"

# Verify config
firebase functions:config:get
```

### 4. Build and Deploy

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## Post-Deployment

### 1. Get Webhook URLs

After deployment, Firebase will output your function URLs:

```
https://us-central1-YOUR_PROJECT.cloudfunctions.net/appleSubscriptionWebhook
https://us-central1-YOUR_PROJECT.cloudfunctions.net/appleCreditPackWebhook
```

**Note these URLs!** You'll need them for RevenueCat.

### 2. Configure RevenueCat Webhooks

1. Log in to RevenueCat dashboard
2. Go to your project → **Integrations** → **Webhooks**
3. Click **+ Add Webhook**

**For Subscriptions:**
- **Webhook URL:** `https://us-central1-YOUR_PROJECT.cloudfunctions.net/appleSubscriptionWebhook`
- **Authorization:** `Bearer YOUR_SECRET_FROM_REVENUECAT`
- **Events:** Select all subscription events:
  - Initial Purchase
  - Renewal
  - Product Change
  - Cancellation
  - Expiration
  - Billing Issue
  - Uncancellation

**For Credit Packs:**
- **Webhook URL:** `https://us-central1-YOUR_PROJECT.cloudfunctions.net/appleCreditPackWebhook`
- **Authorization:** `Bearer YOUR_SECRET_FROM_REVENUECAT`
- **Events:** Select:
  - Non-Renewing Purchase

### 3. Test Webhooks

RevenueCat has a webhook testing feature:

1. Go to webhook configuration
2. Click **Send Test Event**
3. Select event type
4. Click **Send**
5. Verify in Firebase Functions logs: `firebase functions:log`

### 4. Create Firestore Indexes

If you haven't already, deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore
```

**Recommended indexes for `/creditUsage` collection:**
- `uid` (Ascending) + `timestamp` (Descending)
- `type` (Ascending) + `timestamp` (Descending)

Create these in Firebase Console → Firestore → Indexes.

## Update Deployment

When you make changes:

```bash
cd backend/functions
npm run build
cd ..
firebase deploy --only functions
```

**Tip:** Deploy specific functions only:
```bash
firebase deploy --only functions:appleSubscriptionWebhook
firebase deploy --only functions:appleCreditPackWebhook
```

## Environment-Specific Deployments

### Development Environment

```bash
firebase use dev
firebase functions:config:set revenuecat.webhook_secret="DEV_SECRET"
firebase deploy --only functions
```

### Production Environment

```bash
firebase use production
firebase functions:config:set revenuecat.webhook_secret="PROD_SECRET"
firebase deploy --only functions
```

## Monitoring

### View Logs

```bash
# Real-time logs
firebase functions:log

# Specific function
firebase functions:log --only appleSubscriptionWebhook

# Last 100 lines
firebase functions:log --limit 100
```

### Firebase Console

Monitor functions in Firebase Console:
- **Functions** → **Dashboard** - View invocations, errors, execution time
- **Firestore** → **Data** - Verify data is being written correctly
- **Firestore** → **Usage** - Monitor read/write counts

## Rollback

If you need to revert to a previous version:

```bash
firebase functions:log --limit 5  # Find previous deployment ID
firebase rollback functions:appleSubscriptionWebhook --revision REVISION_ID
```

## Security Checklist

- [ ] RevenueCat webhook secret is set and secure
- [ ] Firestore security rules are deployed
- [ ] Functions only accept POST requests
- [ ] Authorization header is verified on every request
- [ ] Functions return 200 even on errors (prevent retries)
- [ ] Production and sandbox environments are separated

## Cost Optimization

- **Free tier:** 2M invocations/month, 400k GB-seconds, 200k CPU-seconds
- Expected usage: ~1000 webhook events/day = 30k/month (well within free tier)
- Monitor in Firebase Console → **Usage and Billing**

## Troubleshooting

### "Permission denied" errors
- Check Firebase service account permissions
- Verify Firestore rules allow writes from Cloud Functions

### "Configuration not found" errors
- Run: `firebase functions:config:set revenuecat.webhook_secret="YOUR_SECRET"`
- Redeploy: `firebase deploy --only functions`

### Webhooks not arriving
- Verify URL in RevenueCat matches deployed function URL
- Check authorization header matches config secret
- View function logs for errors

### TypeScript errors during build
- Run: `npm install`
- Check `tsconfig.json` is correct
- Verify all imports are valid

## Next Steps

After successful deployment:

1. **Test with sandbox purchases** - Use iOS TestFlight with sandbox Apple ID
2. **Monitor stats** - Check `/stats/subscriptions` and `/stats/creditPacks` collections
3. **Set up alerts** - Configure Firebase Alerts for function errors
4. **Add monitoring dashboard** - Build admin panel to view real-time stats
5. **Add Google Play** - Create `googleSubscriptionWebhook.ts` using same managers

---

**Deployment Time:** ~5 minutes  
**Testing Time:** ~10 minutes  
**Total Setup:** ~15 minutes from scratch ⚡
