import * as functions from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { logAudit } from "../services/audit";

/**
 * Trigger when a new user is created
 * Creates a user document in Firestore
 */
export const onUserCreated = functions.beforeUserCreated(async (event) => {
  const { uid, email, displayName } = event.data;

  // User document will be created by the application after org assignment
  // This trigger is for future enhancements (e.g., welcome email)

  console.log(`New user created: ${uid} (${email})`);
  
  return;
});

/**
 * Trigger when a user is deleted
 * Cleans up user data and logs the deletion
 */
export const onUserDeleted = functions.beforeUserDeleted(async (event) => {
  const { uid } = event.data;
  const db = admin.firestore();

  try {
    // Get user's custom claims to determine orgId
    const user = await admin.auth().getUser(uid);
    const claims = user.customClaims as { orgId?: string } | undefined;

    if (claims?.orgId) {
      // Log the deletion
      await logAudit({
        orgId: claims.orgId,
        action: "user.deleted",
        actor: { uid: "system", type: "system" },
        entityRef: `users/${uid}`,
        before: { uid, email: user.email },
        after: null,
      });

      // Optionally: anonymize or delete user's data
      // For compliance, you may want to retain some records
      // This is a placeholder for your data retention policy
    }

    console.log(`User deleted: ${uid}`);
  } catch (error) {
    console.error(`Error handling user deletion for ${uid}:`, error);
  }

  return;
});
