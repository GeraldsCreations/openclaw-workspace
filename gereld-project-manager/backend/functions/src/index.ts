import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export webhook endpoints
export { appleSubscriptionWebhook } from './appleSubscriptionWebhook';
export { appleCreditPackWebhook } from './appleCreditPackWebhook';
