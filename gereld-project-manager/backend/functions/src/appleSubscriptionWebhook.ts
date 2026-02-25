import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  activateSubscription,
  renewSubscription,
  changeSubscription,
  cancelSubscription,
  expireSubscription,
  flagBillingIssue,
  PlanId,
} from './lib/subscriptionManager';

const db = admin.firestore();

// Product ID to Plan ID mapping
const PRODUCT_TO_PLAN: { [key: string]: PlanId } = {
  'com.gereld.basic.monthly': 'basic',
  'com.gereld.basic.yearly': 'basic',
  'com.gereld.pro.monthly': 'pro',
  'com.gereld.pro.yearly': 'pro',
  'com.gereld.enterprise.monthly': 'enterprise',
  'com.gereld.enterprise.yearly': 'enterprise',
};

interface RevenueCatEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    store?: string;
    environment?: string;
    transaction_id?: string;
    original_app_user_id?: string;
  };
}

/**
 * Apple Subscription Webhook - THIN ENTRY POINT
 * Verifies RevenueCat auth, parses payload, routes to subscriptionManager
 */
export const appleSubscriptionWebhook = functions.https.onRequest(async (req, res) => {
  console.log('[AppleSubscriptionWebhook] Received event:', req.body);

  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Verify RevenueCat authorization header
  const authHeader = req.headers.authorization;
  const expectedAuth = functions.config().revenuecat?.webhook_secret;

  if (!expectedAuth) {
    console.error('[AppleSubscriptionWebhook] Missing RevenueCat webhook secret in config');
    res.status(200).send('OK'); // Return 200 to prevent retries
    return;
  }

  if (authHeader !== `Bearer ${expectedAuth}`) {
    console.error('[AppleSubscriptionWebhook] Invalid authorization header');
    res.status(200).send('OK'); // Return 200 to prevent retries
    return;
  }

  try {
    const payload = req.body as RevenueCatEvent;
    const { event } = payload;

    // Extract common fields
    const uid = event.app_user_id;
    const productId = event.product_id;
    const platform = event.store === 'APP_STORE' ? 'ios' : 'android';
    const environment = event.environment === 'PRODUCTION' ? 'production' : 'sandbox';
    const transactionId = event.transaction_id;
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;

    // Map product ID to plan ID
    const planId = PRODUCT_TO_PLAN[productId];
    if (!planId) {
      console.warn(`[AppleSubscriptionWebhook] Unknown product ID: ${productId}`);
      res.status(200).send('OK');
      return;
    }

    // Route event to appropriate manager function
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        await activateSubscription(uid, planId, platform, productId, environment, transactionId, expiresAt);
        break;

      case 'RENEWAL':
        await renewSubscription(uid, planId, platform, productId, environment, transactionId, expiresAt);
        break;

      case 'PRODUCT_CHANGE':
        // Get old plan from user document
        const userDoc = await db.collection('users').doc(uid).get();
        const oldPlanId = (userDoc.data()?.subscription?.plan as PlanId) || 'free';
        await changeSubscription(uid, planId, oldPlanId, platform, productId, environment, transactionId, expiresAt);
        break;

      case 'CANCELLATION':
        if (expiresAt) {
          await cancelSubscription(uid, expiresAt, platform, environment);
        }
        break;

      case 'EXPIRATION':
        await expireSubscription(uid, platform, environment);
        break;

      case 'BILLING_ISSUE':
        await flagBillingIssue(uid, platform, environment);
        break;

      case 'UNCANCELLATION':
        // User re-enabled auto-renew, treat as activation
        await activateSubscription(uid, planId, platform, productId, environment, transactionId, expiresAt);
        break;

      default:
        console.log(`[AppleSubscriptionWebhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[AppleSubscriptionWebhook] Error processing webhook:', error);
    res.status(200).send('OK'); // Return 200 to prevent retries
  }
});
