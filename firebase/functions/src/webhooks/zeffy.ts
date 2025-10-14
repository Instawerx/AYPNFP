import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { writeDonationAndReceipt } from "../services/receipts";
import { logAudit } from "../services/audit";

/**
 * Zeffy webhook handler
 * Processes donation events from Zeffy
 * 
 * Zeffy webhook payload structure (example):
 * {
 *   event: "donation.completed",
 *   data: {
 *     id: "zeffy_donation_id",
 *     amount: 100.00,
 *     currency: "USD",
 *     gross: 100.00,
 *     net: 100.00,
 *     fees: 0.00,
 *     donor: {
 *       email: "donor@example.com",
 *       name: "John Doe",
 *       phone: "+1234567890"
 *     },
 *     campaign: "campaign_id",
 *     created_at: "2024-01-01T00:00:00Z",
 *     metadata: {}
 *   }
 * }
 */
export const zeffyWebhook = functions.onRequest(
  {
    cors: false,
    secrets: ["ZEFFY_WEBHOOK_SECRET"],
  },
  async (req, res) => {
    // Verify webhook signature (if Zeffy supports it)
    // For now, we'll use a shared secret in headers
    const webhookSecret = process.env.ZEFFY_WEBHOOK_SECRET;
    const signature = req.headers["x-zeffy-signature"] as string;

    if (webhookSecret && signature !== webhookSecret) {
      console.error("Invalid Zeffy webhook signature");
      return res.status(401).send("Unauthorized");
    }

    // Parse webhook payload
    const event = req.body;
    if (!event || !event.data) {
      console.error("Invalid Zeffy webhook payload");
      return res.status(400).send("Bad payload");
    }

    const orgId = process.env.DEFAULT_ORG_ID!;
    const {
      id,
      amount,
      currency = "USD",
      donor,
      campaign,
      fees = 0,
      gross,
      net,
      created_at,
      metadata = {},
    } = event.data;

    if (!id || !amount || !donor) {
      console.error("Missing required fields in Zeffy webhook");
      return res.status(400).send("Missing required fields");
    }

    try {
      const db = admin.firestore();
      const donationRef = db
        .collection("orgs")
        .doc(orgId)
        .collection("donations")
        .doc(id);

      // Check if donation already exists (idempotency)
      const existingDonation = await donationRef.get();
      if (existingDonation.exists) {
        console.log(`Donation ${id} already processed`);
        return res.status(200).send("OK");
      }

      // Write donation document
      await donationRef.set({
        orgId,
        source: "Zeffy",
        gross: gross || amount,
        net: net || amount,
        fees: fees || 0,
        amount,
        currency,
        donor: {
          email: donor.email || null,
          name: donor.name || null,
          phone: donor.phone || null,
        },
        campaign: campaign || null,
        metadata,
        createdAt: created_at
          ? admin.firestore.Timestamp.fromDate(new Date(created_at))
          : admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // Generate receipt and send FCM notification
      await writeDonationAndReceipt({ orgId, donationId: id });

      // Log audit entry
      await logAudit({
        orgId,
        action: "donation.webhook.zeffy",
        actor: { uid: "zeffy", type: "webhook" },
        entityRef: `donations/${id}`,
        before: null,
        after: { amount, donor: donor.email },
      });

      console.log(`Zeffy donation ${id} processed successfully`);
      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing Zeffy webhook:", error);
      res.status(500).send("Internal server error");
    }
  }
);
