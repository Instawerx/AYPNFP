import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, AdminFieldValue } from "@/lib/firebase-admin";
import { sendApprovalNotification } from "@/lib/email";
import { logFormAction } from "@/lib/audit";
import { trackFormApproval, calculateProcessingTime } from "@/lib/analytics";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { comments, approvedBy, approverName, approverEmail, orgId } = body;
    const submissionId = params.id;

    if (!submissionId || !approvedBy || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        { error: "Submission already approved" },
        { status: 400 }
      );
    }

    if (submissionData.status === "rejected") {
      return NextResponse.json(
        { error: "Cannot approve a rejected submission" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update submission
    await submissionRef.update({
      status: "approved",
      "approvals.approvedBy": approvedBy,
      "approvals.approverName": approverName || "Unknown",
      "approvals.approvedAt": AdminFieldValue.serverTimestamp(),
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
      await sendApprovalNotification({
        submitterName: submissionData.submittedBy.displayName,
        submitterEmail: submissionData.submittedBy.email,
        templateName: submissionData.templateName,
        submissionId,
        approverName: approverName || "Unknown",
        approvedAt: now.toLocaleString(),
        comments,
        downloadUrl: submissionData.document?.downloadUrl,
      });
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the approval if email fails
    }

    // Log audit event
    try {
      await logFormAction(
        "form.approved",
        approvedBy,
        approverEmail || "unknown",
        approverName || "Unknown",
        submissionId,
        orgId,
        {
          templateName: submissionData.templateName,
          submitterEmail: submissionData.submittedBy.email,
          comments,
          processingTimeHours: processingTime,
        }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Track analytics
    try {
      await trackFormApproval(
        orgId,
        submissionData.templateId,
        submissionId,
        approvedBy,
        processingTime
      );
    } catch (analyticsError) {
      console.error("Error tracking analytics:", analyticsError);
    }

    return NextResponse.json({
      success: true,
      message: "Submission approved successfully",
    });
  } catch (error: any) {
    console.error("Error approving submission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
