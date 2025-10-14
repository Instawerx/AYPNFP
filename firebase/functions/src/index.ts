import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export webhook handlers
export { zeffyWebhook } from "./webhooks/zeffy";
export { stripeWebhook } from "./webhooks/stripe";

// Export callable functions
export { notifyDonor } from "./services/fcm";
export { submitGameScore } from "./services/games";

// Export scheduled functions
export { dailyMetricsRollup } from "./scheduled/metrics";
export { monthlyReports } from "./scheduled/reports";

// Export auth triggers
export { onUserCreated, onUserDeleted } from "./auth/triggers";
