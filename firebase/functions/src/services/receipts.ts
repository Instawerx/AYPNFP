import * as admin from "firebase-admin";
import { sendPushToDonor } from "./fcm";

/**
 * Organization configuration for receipts
 * In production, this should be fetched from org settings
 */
const getOrgConfig = async (orgId: string) => {
  const db = admin.firestore();
  const settingsDoc = await db
    .collection("orgs")
    .doc(orgId)
    .collection("settings")
    .doc("general")
    .get();

  const settings = settingsDoc.data();

  return {
    name: settings?.name || "ADOPT A YOUNG PARENT",
    ein: settings?.ein || process.env.ORG_EIN || "<ADD_EIN>",
    stateCorpId: settings?.stateCorpId || "803297893",
    filingEffectiveDate: settings?.filingEffectiveDate || "2024-11-19",
    miDisclosure:
      "ADOPT A YOUNG PARENT is registered to solicit contributions in Michigan. For information, visit the Michigan Attorney General, Charitable Trust Section. State Entity ID: 803297893 • Filing Effective: Nov 19, 2024.",
    deductibility:
      "Contributions may be tax-deductible to the extent allowed by law. Please consult your tax advisor.",
  };
};

/**
 * Generate IRS Pub. 1771 compliant receipt text
 */
const generateReceiptText = (
  orgConfig: Awaited<ReturnType<typeof getOrgConfig>>,
  donation: any
): string => {
  const { name, ein, deductibility } = orgConfig;
  const { amount, currency, fmv = 0 } = donation;

  let text = `Thank you for your charitable contribution to ${name} (EIN: ${ein}).\n\n`;

  // Quid-pro-quo disclosure (if goods/services provided)
  if (fmv > 0) {
    const deductibleAmount = amount - fmv;
    text += `The fair market value of goods or services provided in exchange for this contribution is $${fmv.toFixed(
      2
    )} ${currency}.\n`;
    text += `The tax-deductible amount of your contribution is $${deductibleAmount.toFixed(
      2
    )} ${currency}.\n\n`;
  } else {
    text += `No goods or services were provided in exchange for this contribution.\n\n`;
  }

  text += `${deductibility}\n\n`;
  text += `Please retain this receipt for your tax records.`;

  return text;
};

/**
 * Write donation receipt and trigger notifications
 */
export async function writeDonationAndReceipt({
  orgId,
  donationId,
}: {
  orgId: string;
  donationId: string;
}): Promise<void> {
  const db = admin.firestore();

  // Fetch donation document
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
  const orgConfig = await getOrgConfig(orgId);

  // Generate receipt text
  const receiptText = generateReceiptText(orgConfig, donation);

  // Create receipt document
  const receipt = {
    orgId,
    donationId,
    issuedAt: admin.firestore.Timestamp.now(),
    text: receiptText,
    miDisclosure: orgConfig.miDisclosure,
    amount: donation.amount,
    currency: donation.currency,
    donor: donation.donor,
    fmv: donation.fmv || 0,
    deductibleAmount: donation.amount - (donation.fmv || 0),
  };

  const receiptRef = db
    .collection("orgs")
    .doc(orgId)
    .collection("receipts")
    .doc(donationId);

  await receiptRef.set(receipt, { merge: true });

  console.log(`Receipt created for donation ${donationId}`);

  // Send push notification to donor (if consented)
  await sendPushToDonor({
    orgId,
    donationId,
    title: "Thank you for your gift!",
    body: "Your tax receipt is now available in your donor portal.",
  });
}

/**
 * Generate year-end statement for a donor
 */
export async function generateYearEndStatement({
  orgId,
  donorId,
  year,
}: {
  orgId: string;
  donorId: string;
  year: number;
}): Promise<any> {
  const db = admin.firestore();

  // Fetch all donations for the year
  const startDate = new Date(`${year}-01-01T00:00:00Z`);
  const endDate = new Date(`${year}-12-31T23:59:59Z`);

  const donationsSnap = await db
    .collection("orgs")
    .doc(orgId)
    .collection("donations")
    .where("donorId", "==", donorId)
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
    .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
    .orderBy("createdAt", "asc")
    .get();

  const donations = donationsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<{ id: string; amount?: number; fmv?: number }>;

  const totalAmount = donations.reduce((sum: number, d) => sum + (d.amount || 0), 0);
  const totalDeductible = donations.reduce(
    (sum: number, d) => sum + ((d.amount || 0) - (d.fmv || 0)),
    0
  );

  const orgConfig = await getOrgConfig(orgId);

  return {
    orgId,
    donorId,
    year,
    donations,
    totalAmount,
    totalDeductible,
    orgConfig,
    generatedAt: admin.firestore.Timestamp.now(),
  };
}
