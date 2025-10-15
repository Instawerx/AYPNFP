import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, AdminFieldValue } from "@/lib/firebase-admin";
import { sendRejectionNotification } from "@/lib/email";
import { logFormAction } from "@/lib/audit";
import { trackFormRejection, calculateProcessingTime } from "@/lib/analytics";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { reason, comments, rejectedBy, rejectorName, rejectorEmail, orgId } = body;
    const submissionId = params.id;

    if (!submissionId || !rejectedBy || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // TODO: Verify requesting user has forms.approve scope

    // Get submission
    const submissionRef = db
      .collection(`orgs/${orgId}/formSubmissions`)
      .doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const submissionData = submissionDoc.data();

    if (!submissionData) {
      return NextResponse.json(
        { error: "Submission data unavailable" },
        { status: 500 }
      );
    }

    // Check if already approved or rejected
    if (submissionData.status === "approved") {
      return NextResponse.json(
        { error: "Cannot reject an approved submission" },
        { status: 400 }
      );
    }

    if (submissionData.status === "rejected") {
      return NextResponse.json(
        { error: "Submission already rejected" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update submission
    await submissionRef.update({
      status: "rejected",
      "approvals.rejectedBy": rejectedBy,
      "approvals.rejectorName": rejectorName || "Unknown",
      "approvals.rejectedAt": AdminFieldValue.serverTimestamp(),
      "approvals.rejectionReason": reason,
      "approvals.comments": comments || "",
      "metadata.completedAt": AdminFieldValue.serverTimestamp(),
    });

    // Calculate processing time
    const processingTime = calculateProcessingTime(
      submissionData.submittedAt,
      now
    );

    // Send email notification to submitter
    try {
      await sendRejectionNotification({
        submitterName: submissionData.submittedBy.displayName,
        submitterEmail: submissionData.submittedBy.email,
        templateName: submissionData.templateName,
        submissionId,
        rejectorName: rejectorName || "Unknown",
        rejectedAt: now.toLocaleString(),
        reason,
        comments,
      });
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
      // Don't fail the rejection if email fails
    }

    // Log audit event
    try {
      await logFormAction(
        "form.rejected",
        rejectedBy,
        rejectorEmail || "unknown",
        rejectorName || "Unknown",
        submissionId,
        orgId,
        {
          templateName: submissionData.templateName,
          submitterEmail: submissionData.submittedBy.email,
          reason,
          comments,
          processingTimeHours: processingTime,
        }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Track analytics
    try {
      await trackFormRejection(
        orgId,
        submissionData.templateId,
        submissionId,
        rejectedBy,
        processingTime
      );
    } catch (analyticsError) {
      console.error("Error tracking analytics:", analyticsError);
    }

    return NextResponse.json({
      success: true,
      message: "Submission rejected successfully",
    });
  } catch (error: any) {
    console.error("Error rejecting submission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
