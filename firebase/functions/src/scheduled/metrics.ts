import * as functions from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

/**
 * Daily metrics rollup
 * Runs at midnight UTC to aggregate daily stats
 */
export const dailyMetricsRollup = functions.onSchedule(
  {
    schedule: "0 0 * * *", // Daily at midnight UTC
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    console.log(`Running daily metrics rollup for ${yesterday.toISOString()}`);

    // Get all orgs
    const orgsSnap = await db.collection("orgs").listDocuments();

    for (const orgRef of orgsSnap) {
      const orgId = orgRef.id;

      try {
        // Aggregate donations for yesterday
        const donationsSnap = await db
          .collection("orgs")
          .doc(orgId)
          .collection("donations")
          .where(
            "createdAt",
            ">=",
            admin.firestore.Timestamp.fromDate(yesterday)
          )
          .where("createdAt", "<", admin.firestore.Timestamp.fromDate(today))
          .get();

        const totalAmount = donationsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0),
          0
        );
        const donationCount = donationsSnap.size;

        // Store daily metrics
        await db
          .collection("orgs")
          .doc(orgId)
          .collection("metrics")
          .doc(`daily-${yesterday.toISOString().split("T")[0]}`)
          .set({
            orgId,
            date: admin.firestore.Timestamp.fromDate(yesterday),
            donations: {
              count: donationCount,
              total: totalAmount,
            },
            createdAt: admin.firestore.Timestamp.now(),
          });

        console.log(
          `Metrics for ${orgId}: ${donationCount} donations, $${totalAmount}`
        );
      } catch (error) {
        console.error(`Error processing metrics for ${orgId}:`, error);
      }
    }

    console.log("Daily metrics rollup completed");
  }
);
