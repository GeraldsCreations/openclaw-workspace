import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

export type Platform = 'ios' | 'android' | 'web';
export type Environment = 'production' | 'sandbox';

/**
 * Purchases a credit pack for a user
 * Adds bonus credits on top of existing balance (doesn't reset)
 */
export async function purchaseCreditPack(
  uid: string,
  credits: number,
  productId: string,
  platform: Platform,
  priceInCents: number,
  environment: Environment,
  transactionId?: string
): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const now = Timestamp.now();

  // Add credits to existing balance (don't reset)
  await userRef.set(
    {
      credits: FieldValue.increment(credits),
      updatedAt: now,
    },
    { merge: true }
  );

  // Log credit purchase in creditUsage
  await db.collection('creditUsage').add({
    uid,
    type: 'credit_pack_purchased',
    amount: credits,
    productId,
    platform,
    priceInCents,
    environment,
    transactionId: transactionId || null,
    timestamp: now,
  });

  // Record purchase
  await db.collection('purchases').add({
    uid,
    type: 'credit_pack',
    credits,
    productId,
    platform,
    priceInCents,
    environment,
    transactionId: transactionId || null,
    status: 'completed',
    purchasedAt: now,
  });

  // Increment stats
  await db.collection('stats').doc('creditPacks').set(
    {
      totalPurchases: FieldValue.increment(1),
      totalCredits: FieldValue.increment(credits),
      totalRevenueCents: FieldValue.increment(priceInCents),
      [`byPlatform.${platform}.purchases`]: FieldValue.increment(1),
      [`byPlatform.${platform}.credits`]: FieldValue.increment(credits),
      [`byPlatform.${platform}.revenueCents`]: FieldValue.increment(priceInCents),
      lastUpdated: now,
    },
    { merge: true }
  );

  console.log(
    `[CreditPackManager] Purchased ${credits} credits for user ${uid} on ${platform} (${productId}, $${(priceInCents / 100).toFixed(2)})`
  );
}
