import * as functions from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { writeDonationAndReceipt } from "../services/receipts";
import { logAudit } from "../services/audit";

/**
 * Stripe webhook handler
 * Processes checkout.session.completed events
 */
export const stripeWebhook = functions.onRequest(
  {
    cors: false,
  },
  async (req, res) => {
    // TODO: Set these as Firebase Secrets via: firebase functions:secrets:set STRIPE_SECRET_KEY
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || functionsV1.config().stripe?.secret_key;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || functionsV1.config().stripe?.webhook_secret;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Missing Stripe configuration");
      res.status(500).send("Server configuration error");
      return;
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature
    const signature = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    const orgId = process.env.DEFAULT_ORG_ID!;

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const id = session.id;
      const amount = (session.amount_total ?? 0) / 100; // Convert cents to dollars
      const currency = session.currency?.toUpperCase() ?? "USD";
      const donor = {
        email: session.customer_details?.email ?? null,
        name: session.customer_details?.name ?? null,
        phone: session.customer_details?.phone ?? null,
      };
      const campaign = session.metadata?.campaign ?? null;

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
          res.json({ received: true });
          return;
        }

        // Fetch balance transaction for accurate fees
        let fees = 0;
        let net = amount;

        if (session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
              { expand: ["latest_charge.balance_transaction"] }
            );

            const charge = paymentIntent.latest_charge as Stripe.Charge;
            const balanceTransaction = charge?.balance_transaction as Stripe.BalanceTransaction;

            if (balanceTransaction) {
              fees = balanceTransaction.fee / 100; // Convert cents to dollars
              net = balanceTransaction.net / 100;
            }
          } catch (error) {
            console.error("Error fetching balance transaction:", error);
            // Continue with estimated values
          }
        }

        // Write donation document
        await donationRef.set({
          orgId,
          source: "Stripe",
          gross: amount,
          net,
          fees,
          amount,
          currency,
          donor,
          campaign,
          metadata: session.metadata || {},
          paymentIntent: session.payment_intent || null,
          customerId: session.customer || null,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });

        // Generate receipt and send FCM notification
        await writeDonationAndReceipt({ orgId, donationId: id });

        // Log audit entry
        await logAudit({
          orgId,
          action: "donation.webhook.stripe",
          actor: { uid: "stripe", type: "webhook" },
          entityRef: `donations/${id}`,
          before: null,
          after: { amount, donor: donor.email },
        });

        console.log(`Stripe donation ${id} processed successfully`);
      } catch (error) {
        console.error("Error processing Stripe webhook:", error);
        res.status(500).send("Internal server error");
        return;
      }
    }

    res.json({ received: true });
    return;
  }
);
