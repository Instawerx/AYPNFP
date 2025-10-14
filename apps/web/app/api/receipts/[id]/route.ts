import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const donationId = params.id;
  const orgId = process.env.NEXT_PUBLIC_ORG_ID || "aayp-prod";

  try {
    // Fetch receipt
    const receiptDoc = await db
      .collection("orgs")
      .doc(orgId)
      .collection("receipts")
      .doc(donationId)
      .get();

    if (!receiptDoc.exists) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const receipt = receiptDoc.data()!;

    // Generate simple text receipt (PDF generation can be added later)
    const receiptText = `
ADOPT A YOUNG PARENT
Tax Receipt

Receipt ID: ${donationId}
Date: ${receipt.issuedAt.toDate().toLocaleDateString()}

Amount: $${receipt.amount.toFixed(2)} ${receipt.currency}
${receipt.fmv > 0 ? `Fair Market Value: $${receipt.fmv.toFixed(2)}` : ""}
${receipt.fmv > 0 ? `Tax Deductible Amount: $${receipt.deductibleAmount.toFixed(2)}` : ""}

${receipt.text}

${receipt.miDisclosure}

---
This is an official tax receipt. Please retain for your records.
    `.trim();

    return new NextResponse(receiptText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="receipt-${donationId}.txt"`,
      },
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
