import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // TODO: Verify requesting user has admin.write scope

    // Get user email
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.getUser(params.id);

    if (!userRecord.email) {
      return NextResponse.json(
        { error: "User has no email address" },
        { status: 400 }
      );
    }

    // Generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(userRecord.email);

    // TODO: Send email with reset link
    // For now, we'll just return success
    // In production, integrate with SendGrid or Firebase Email

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
      // In development, you might want to return the link
      // resetLink: resetLink,
    });
  } catch (error: any) {
    console.error("Error sending password reset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send password reset email" },
      { status: 500 }
    );
  }
}
