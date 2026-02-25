import * as functions from 'firebase-functions';
import { purchaseCreditPack } from './lib/creditPackManager';

// Product ID to credits and price mapping
const CREDIT_PACK_PRODUCTS: {
  [key: string]: { credits: number; priceInCents: number };
} = {
  'com.gereld.credits.50': { credits: 50, priceInCents: 499 },
  'com.gereld.credits.150': { credits: 150, priceInCents: 1299 },
  'com.gereld.credits.500': { credits: 500, priceInCents: 3999 },
  'com.gereld.credits.1000': { credits: 1000, priceInCents: 6999 },
};

interface RevenueCatEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    purchased_at_ms?: number;
    store?: string;
    environment?: string;
    transaction_id?: string;
  };
}

/**
 * Apple Credit Pack Webhook - THIN ENTRY POINT
 * Verifies RevenueCat auth, parses payload, routes to creditPackManager
 */
export const appleCreditPackWebhook = functions.https.onRequest(async (req, res) => {
  console.log('[AppleCreditPackWebhook] Received event:', req.body);

  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Verify RevenueCat authorization header
  const authHeader = req.headers.authorization;
  const expectedAuth = functions.config().revenuecat?.webhook_secret;

  if (!expectedAuth) {
    console.error('[AppleCreditPackWebhook] Missing RevenueCat webhook secret in config');
    res.status(200).send('OK'); // Return 200 to prevent retries
    return;
  }

  if (authHeader !== `Bearer ${expectedAuth}`) {
    console.error('[AppleCreditPackWebhook] Invalid authorization header');
    res.status(200).send('OK'); // Return 200 to prevent retries
    return;
  }

  try {
    const payload = req.body as RevenueCatEvent;
    const { event } = payload;

    // Only process non-subscription purchases
    if (event.type !== 'NON_RENEWING_PURCHASE') {
      console.log(`[AppleCreditPackWebhook] Ignoring event type: ${event.type}`);
      res.status(200).send('OK');
      return;
    }

    // Extract fields
    const uid = event.app_user_id;
    const productId = event.product_id;
    const platform = event.store === 'APP_STORE' ? 'ios' : 'android';
    const environment = event.environment === 'PRODUCTION' ? 'production' : 'sandbox';
    const transactionId = event.transaction_id;

    // Look up credit pack details
    const packDetails = CREDIT_PACK_PRODUCTS[productId];
    if (!packDetails) {
      console.warn(`[AppleCreditPackWebhook] Unknown credit pack product ID: ${productId}`);
      res.status(200).send('OK');
      return;
    }

    const { credits, priceInCents } = packDetails;

    // Call credit pack manager
    await purchaseCreditPack(uid, credits, productId, platform, priceInCents, environment, transactionId);

    res.status(200).send('OK');
  } catch (error) {
    console.error('[AppleCreditPackWebhook] Error processing webhook:', error);
    res.status(200).send('OK'); // Return 200 to prevent retries
  }
});
