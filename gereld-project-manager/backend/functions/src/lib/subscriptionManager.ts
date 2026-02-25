import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

export type PlanId = 'free' | 'basic' | 'pro' | 'enterprise';
export type Platform = 'ios' | 'android' | 'web';
export type Environment = 'production' | 'sandbox';

interface PlanCredits {
  [key: string]: number;
  free: number;
  basic: number;
  pro: number;
  enterprise: number;
}

const PLAN_CREDITS: PlanCredits = {
  free: 10,
  basic: 100,
  pro: 500,
  enterprise: 2000,
};

/**
 * Activates a new subscription for a user
 * Called when a user first subscribes to a paid plan
 */
export async function activateSubscription(
  uid: string,
  planId: PlanId,
  platform: Platform,
  productId: string,
  environment: Environment,
  transactionId?: string,
  expiresAt?: Date
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();
  const expiresTimestamp = expiresAt ? Timestamp.fromDate(expiresAt) : null;

  // Reset credits to plan amount
  const planCredits = PLAN_CREDITS[planId] || PLAN_CREDITS.free;

  // Update user document
  await userRef.set(
    {
      subscription: {
        plan: planId,
        platform,
        productId,
        status: 'active',
        environment,
        startedAt: now,
        expiresAt: expiresTimestamp,
        cancelledAt: null,
        billingIssue: false,
        lastRenewal: now,
      },
      credits: planCredits,
      updatedAt: now,
    },
    { merge: true }
  );

  // Log credit reset in creditUsage
  await db.collection('creditUsage').add({
    uid,
    type: 'subscription_activated',
    amount: planCredits,
    planId,
    platform,
    productId,
    environment,
    transactionId: transactionId || null,
    timestamp: now,
  });

  // Record purchase
  await db.collection('purchases').add({
    uid,
    type: 'subscription',
    planId,
    platform,
    productId,
    environment,
    transactionId: transactionId || null,
    status: 'active',
    purchasedAt: now,
    expiresAt: expiresTimestamp,
  });

  // Increment stats
  await db.collection('stats').doc('subscriptions').set(
    {
      [`activations.${planId}`]: FieldValue.increment(1),
      [`activations.total`]: FieldValue.increment(1),
      [`byPlatform.${platform}`]: FieldValue.increment(1),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(`[SubscriptionManager] Activated ${planId} for user ${uid} on ${platform}`);
}

/**
 * Renews an existing subscription
 * Called when a subscription auto-renews successfully
 */
export async function renewSubscription(
  uid: string,
  planId: PlanId,
  platform: Platform,
  productId: string,
  environment: Environment,
  transactionId?: string,
  expiresAt?: Date
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();
  const expiresTimestamp = expiresAt ? Timestamp.fromDate(expiresAt) : null;

  // Reset credits to plan amount
  const planCredits = PLAN_CREDITS[planId] || PLAN_CREDITS.free;

  // Update user document
  await userRef.set(
    {
      subscription: {
        plan: planId,
        platform,
        productId,
        status: 'active',
        environment,
        expiresAt: expiresTimestamp,
        cancelledAt: null,
        billingIssue: false,
        lastRenewal: now,
      },
      credits: planCredits,
      updatedAt: now,
    },
    { merge: true }
  );

  // Log credit reset in creditUsage
  await db.collection('creditUsage').add({
    uid,
    type: 'subscription_renewed',
    amount: planCredits,
    planId,
    platform,
    productId,
    environment,
    transactionId: transactionId || null,
    timestamp: now,
  });

  // Increment stats
  await db.collection('stats').doc('subscriptions').set(
    {
      [`renewals.${planId}`]: FieldValue.increment(1),
      [`renewals.total`]: FieldValue.increment(1),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(`[SubscriptionManager] Renewed ${planId} for user ${uid}`);
}

/**
 * Changes subscription from one plan to another
 * Called when user upgrades or downgrades
 */
export async function changeSubscription(
  uid: string,
  newPlanId: PlanId,
  oldPlanId: PlanId,
  platform: Platform,
  productId: string,
  environment: Environment,
  transactionId?: string,
  expiresAt?: Date
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();
  const expiresTimestamp = expiresAt ? Timestamp.fromDate(expiresAt) : null;

  // Reset credits to new plan amount
  const planCredits = PLAN_CREDITS[newPlanId] || PLAN_CREDITS.free;

  // Update user document
  await userRef.set(
    {
      subscription: {
        plan: newPlanId,
        platform,
        productId,
        status: 'active',
        environment,
        expiresAt: expiresTimestamp,
        cancelledAt: null,
        billingIssue: false,
        lastRenewal: now,
      },
      credits: planCredits,
      updatedAt: now,
    },
    { merge: true }
  );

  // Log plan change in creditUsage
  await db.collection('creditUsage').add({
    uid,
    type: 'subscription_changed',
    amount: planCredits,
    planId: newPlanId,
    oldPlanId,
    platform,
    productId,
    environment,
    transactionId: transactionId || null,
    timestamp: now,
  });

  // Determine if upgrade or downgrade
  const planOrder = ['free', 'basic', 'pro', 'enterprise'];
  const isUpgrade = planOrder.indexOf(newPlanId) > planOrder.indexOf(oldPlanId);

  // Increment stats
  await db.collection('stats').doc('subscriptions').set(
    {
      [`changes.${isUpgrade ? 'upgrades' : 'downgrades'}`]: FieldValue.increment(1),
      [`changes.total`]: FieldValue.increment(1),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(`[SubscriptionManager] Changed subscription from ${oldPlanId} to ${newPlanId} for user ${uid}`);
}

/**
 * Cancels a subscription but keeps access until expiry
 * Called when user cancels but subscription period hasn't ended yet
 */
export async function cancelSubscription(
  uid: string,
  expiresAt: Date,
  platform: Platform,
  environment: Environment
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();
  const expiresTimestamp = Timestamp.fromDate(expiresAt);

  // Mark as cancelled but keep current plan until expiry
  await userRef.set(
    {
      subscription: {
        status: 'cancelled',
        cancelledAt: now,
        expiresAt: expiresTimestamp,
        billingIssue: false,
      },
      updatedAt: now,
    },
    { merge: true }
  );

  // Increment stats
  await db.collection('stats').doc('subscriptions').set(
    {
      'cancellations.total': FieldValue.increment(1),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(`[SubscriptionManager] Cancelled subscription for user ${uid}, expires at ${expiresAt.toISOString()}`);
}

/**
 * Expires a subscription and reverts user to free plan
 * Called when subscription period ends after cancellation
 */
export async function expireSubscription(
  uid: string,
  platform: Platform,
  environment: Environment
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();

  // Revert to free plan
  const freeCredits = PLAN_CREDITS.free;

  await userRef.set(
    {
      subscription: {
        plan: 'free',
        platform,
        status: 'expired',
        environment,
        expiresAt: null,
        billingIssue: false,
      },
      credits: freeCredits,
      updatedAt: now,
    },
    { merge: true }
  );

  // Log reversion to free in creditUsage
  await db.collection('creditUsage').add({
    uid,
    type: 'subscription_expired',
    amount: freeCredits,
    planId: 'free',
    platform,
    environment,
    timestamp: now,
  });

  // Increment stats
  await db.collection('stats').doc('subscriptions').set(
    {
      'expirations.total': FieldValue.increment(1),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(`[SubscriptionManager] Expired subscription for user ${uid}, reverted to free`);
}

/**
 * Flags a billing issue for a subscription
 * Called when payment fails but subscription hasn't expired yet
 */
export async function flagBillingIssue(
  uid: string,
  platform: Platform,
  environment: Environment
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();

  await userRef.set(
    {
      subscription: {
        billingIssue: true,
      },
      updatedAt: now,
    },
    { merge: true }
  );

  // Increment stats
  await db.collection('stats').doc('subscriptions').set(
    {
      'billingIssues.total': FieldValue.increment(1),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(`[SubscriptionManager] Flagged billing issue for user ${uid}`);
}
