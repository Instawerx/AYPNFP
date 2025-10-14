import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logAudit } from "./audit";

/**
 * Send push notification to a donor
 * Respects consent preferences
 */
export async function sendPushToDonor({
  orgId,
  donationId,
  title,
  body,
}: {
  orgId: string;
  donationId: string;
  title: string;
  body: string;
}): Promise<void> {
  const db = admin.firestore();

  // Fetch donation to get donor info
  const donationSnap = await db
    .collection("orgs")
    .doc(orgId)
    .collection("donations")
    .doc(donationId)
    .get();

  if (!donationSnap.exists) {
    console.error(`Donation ${donationId} not found`);
    return;
  }

  const donation = donationSnap.data()!;
  const donorEmail = donation?.donor?.email;

  if (!donorEmail) {
    console.log(`No donor email for donation ${donationId}`);
    return;
  }

  // Find donor by email
  const donorsSnap = await db
    .collection("orgs")
    .doc(orgId)
    .collection("donors")
    .where("email", "==", donorEmail)
    .limit(1)
    .get();

  if (donorsSnap.empty) {
    console.log(`Donor not found for email ${donorEmail}`);
    return;
  }

  const donorDoc = donorsSnap.docs[0];
  const donor = donorDoc.data();
  const donorId = donorDoc.id;

  // Check FCM consent
  if (!donor.consent?.fcm) {
    console.log(`Donor ${donorId} has not consented to FCM notifications`);
    return;
  }

  // Fetch FCM tokens
  const tokensSnap = await db
    .collection("orgs")
    .doc(orgId)
    .collection("donors")
    .doc(donorId)
    .collection("devices")
    .get();

  const tokens = tokensSnap.docs
    .map((doc) => doc.data().fcmToken)
    .filter(Boolean);

  if (!tokens.length) {
    console.log(`No FCM tokens for donor ${donorId}`);
    return;
  }

  // Send multicast notification
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        type: "RECEIPT",
        donationId,
        orgId,
      },
    });

    console.log(`FCM sent to donor ${donorId}: ${response.successCount} success, ${response.failureCount} failures`);

    // Clean up invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === "messaging/invalid-registration-token") {
        invalidTokens.push(tokens[idx]);
      }
    });

    if (invalidTokens.length > 0) {
      // Remove invalid tokens
      const batch = db.batch();
      for (const token of invalidTokens) {
        const deviceSnap = await db
          .collection("orgs")
          .doc(orgId)
          .collection("donors")
          .doc(donorId)
          .collection("devices")
          .where("fcmToken", "==", token)
          .limit(1)
          .get();

        if (!deviceSnap.empty) {
          batch.delete(deviceSnap.docs[0].ref);
        }
      }
      await batch.commit();
      console.log(`Removed ${invalidTokens.length} invalid FCM tokens`);
    }

    // Log communication
    await db
      .collection("orgs")
      .doc(orgId)
      .collection("communications")
      .add({
        orgId,
        donorId,
        type: "fcm",
        title,
        body,
        sentAt: admin.firestore.Timestamp.now(),
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
  } catch (error) {
    console.error("Error sending FCM notification:", error);
  }
}

/**
 * Callable function: Notify donor (consent-aware)
 * Used by fundraisers to send notifications to donors
 */
export const notifyDonor = functions.onCall(
  {
    secrets: [],
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new functions.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { orgId, scopes } = auth.token as { orgId: string; scopes: string[] };

    // Check scope
    if (!scopes.includes("campaign.write")) {
      throw new functions.HttpsError(
        "permission-denied",
        "User does not have campaign.write scope"
      );
    }

    const { donorId, title, body } = data;

    if (!donorId || !title || !body) {
      throw new functions.HttpsError("invalid-argument", "Missing required fields");
    }

    const db = admin.firestore();

    // Fetch donor
    const donorSnap = await db
      .collection("orgs")
      .doc(orgId)
      .collection("donors")
      .doc(donorId)
      .get();

    if (!donorSnap.exists) {
      throw new functions.HttpsError("not-found", "Donor not found");
    }

    const donor = donorSnap.data()!;

    // Check consent
    if (!donor.consent?.fcm) {
      throw new functions.HttpsError(
        "failed-precondition",
        "Donor has not consented to FCM notifications"
      );
    }

    // Rate limiting: max 3 notifications per donor per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentCommsSnap = await db
      .collection("orgs")
      .doc(orgId)
      .collection("communications")
      .where("donorId", "==", donorId)
      .where("type", "==", "fcm")
      .where("sentAt", ">=", admin.firestore.Timestamp.fromDate(today))
      .get();

    if (recentCommsSnap.size >= 3) {
      throw new functions.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded: max 3 notifications per donor per day"
      );
    }

    // Fetch FCM tokens
    const tokensSnap = await db
      .collection("orgs")
      .doc(orgId)
      .collection("donors")
      .doc(donorId)
      .collection("devices")
      .get();

    const tokens = tokensSnap.docs
      .map((doc) => doc.data().fcmToken)
      .filter(Boolean);

    if (!tokens.length) {
      throw new functions.HttpsError("not-found", "No FCM tokens found for donor");
    }

    // Send notification
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        type: "FUNDRAISER_MESSAGE",
        donorId,
        orgId,
      },
    });

    // Log communication
    await db
      .collection("orgs")
      .doc(orgId)
      .collection("communications")
      .add({
        orgId,
        donorId,
        type: "fcm",
        title,
        body,
        sentBy: auth.uid,
        sentAt: admin.firestore.Timestamp.now(),
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

    // Log audit
    await logAudit({
      orgId,
      action: "donor.notify.fcm",
      actor: { uid: auth.uid, type: "user" },
      entityRef: `donors/${donorId}`,
      before: null,
      after: { title, body },
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  }
);
