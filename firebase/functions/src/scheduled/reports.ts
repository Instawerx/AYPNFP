import * as functions from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

/**
 * Monthly reports
 * Runs on the 1st of each month to generate reports
 */
export const monthlyReports = functions.onSchedule(
  {
    schedule: "0 6 1 * *", // 1st of month at 6am UTC
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const thisMonth = new Date(lastMonth);
    thisMonth.setMonth(thisMonth.getMonth() + 1);

    console.log(`Generating monthly reports for ${lastMonth.toISOString()}`);

    // Get all orgs
    const orgsSnap = await db.collection("orgs").listDocuments();

    for (const orgRef of orgsSnap) {
      const orgId = orgRef.id;

      try {
        // Aggregate donations for last month
        const donationsSnap = await db
          .collection("orgs")
          .doc(orgId)
          .collection("donations")
          .where(
            "createdAt",
            ">=",
            admin.firestore.Timestamp.fromDate(lastMonth)
          )
          .where(
            "createdAt",
            "<",
            admin.firestore.Timestamp.fromDate(thisMonth)
          )
          .get();

        const donations = donationsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const totalAmount = donations.reduce(
          (sum, d) => sum + (d.amount || 0),
          0
        );
        const totalFees = donations.reduce((sum, d) => sum + (d.fees || 0), 0);
        const totalNet = donations.reduce((sum, d) => sum + (d.net || 0), 0);

        // Group by source
        const bySource = donations.reduce((acc: any, d) => {
          const source = d.source || "Unknown";
          if (!acc[source]) {
            acc[source] = { count: 0, total: 0 };
          }
          acc[source].count++;
          acc[source].total += d.amount || 0;
          return acc;
        }, {});

        // Store monthly report
        const reportData = {
          orgId,
          month: lastMonth.toISOString().substring(0, 7), // YYYY-MM
          period: {
            start: admin.firestore.Timestamp.fromDate(lastMonth),
            end: admin.firestore.Timestamp.fromDate(thisMonth),
          },
          donations: {
            count: donations.length,
            total: totalAmount,
            fees: totalFees,
            net: totalNet,
            bySource,
          },
          createdAt: admin.firestore.Timestamp.now(),
        };

        await db
          .collection("orgs")
          .doc(orgId)
          .collection("reports")
          .doc(`monthly-${reportData.month}`)
          .set(reportData);

        console.log(
          `Monthly report for ${orgId}: ${donations.length} donations, $${totalAmount}`
        );

        // TODO: Send email notification to finance team
        // This will be implemented when email service is added
      } catch (error) {
        console.error(`Error generating report for ${orgId}:`, error);
      }
    }

    console.log("Monthly reports generation completed");
  }
);
