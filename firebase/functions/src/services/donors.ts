import * as admin from "firebase-admin";
import { logAudit, AuditActions } from "./audit";

/**
 * Create or update donor record
 */
export async function upsertDonor({
  orgId,
  email,
  name,
  phone,
  metadata = {},
}: {
  orgId: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const db = admin.firestore();

  // Check if donor exists
  const existingDonorSnap = await db
    .collection("orgs")
    .doc(orgId)
    .collection("donors")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!existingDonorSnap.empty) {
    // Update existing donor
    const donorDoc = existingDonorSnap.docs[0];
    const donorId = donorDoc.id;

    await donorDoc.ref.update({
      name: name || donorDoc.data().name,
      phone: phone || donorDoc.data().phone,
      metadata: { ...donorDoc.data().metadata, ...metadata },
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return donorId;
  }

  // Create new donor
  const donorRef = await db
    .collection("orgs")
    .doc(orgId)
    .collection("donors")
    .add({
      orgId,
      email,
      name: name || null,
      phone: phone || null,
      consent: {
        fcm: false,
        email: false,
        sms: false,
      },
      lifetime: 0,
      ytd: 0,
      donationCount: 0,
      firstDonationAt: null,
      lastDonationAt: null,
      metadata,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

  await logAudit({
    orgId,
    action: AuditActions.DONOR_CREATED,
    actor: { uid: "system", type: "system" },
    entityRef: `donors/${donorRef.id}`,
    before: null,
    after: { email, name },
  });

  return donorRef.id;
}

/**
 * Update donor lifetime and YTD stats after a donation
 */
export async function updateDonorStats({
  orgId,
  donorId,
  amount,
}: {
  orgId: string;
  donorId: string;
  amount: number;
}): Promise<void> {
  const db = admin.firestore();
  const donorRef = db.collection("orgs").doc(orgId).collection("donors").doc(donorId);

  const donorSnap = await donorRef.get();
  if (!donorSnap.exists) {
    console.error(`Donor ${donorId} not found`);
    return;
  }

  const donor = donorSnap.data()!;
  const now = admin.firestore.Timestamp.now();
  const currentYear = new Date().getFullYear();
  const lastDonationYear = donor.lastDonationAt
    ? donor.lastDonationAt.toDate().getFullYear()
    : null;

  // Reset YTD if new year
  const ytd = lastDonationYear === currentYear ? donor.ytd + amount : amount;

  await donorRef.update({
    lifetime: admin.firestore.FieldValue.increment(amount),
    ytd,
    donationCount: admin.firestore.FieldValue.increment(1),
    firstDonationAt: donor.firstDonationAt || now,
    lastDonationAt: now,
    updatedAt: now,
  });
}
