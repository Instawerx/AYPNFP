import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, AdminFieldValue } from "@/lib/firebase-admin";
import { getAirSlateClient } from "@/lib/airslate";
import { storeAirSlateDocument } from "@/lib/storage";
import { sendFormSubmissionNotification } from "@/lib/email";
import { logFormAction } from "@/lib/audit";
import { trackFormSubmission } from "@/lib/analytics";

const db = getAdminDb();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, fields, metadata, orgId } = body;

    if (!templateId || !fields || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Verify requesting user has forms.submit scope

    // Get template from Firestore
    const templateRef = db
      .collection(`orgs/${orgId}/formTemplates`)
      .doc(templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateData = templateDoc.data();

    if (!templateData) {
      return NextResponse.json(
        { error: "Template data unavailable" },
        { status: 500 }
      );
    }

    // Validate required fields
    const requiredFields = templateData.fields.filter((f: any) => f.required);
    for (const field of requiredFields) {
      if (!fields[field.name]) {
        return NextResponse.json(
          { error: `Missing required field: ${field.name}` },
          { status: 400 }
        );
      }
    }

    // Generate document via airSlate
    let airslateDocument = null;
    let downloadUrl = null;
    let storagePath = null;
    let firebaseStorageUrl = null;

    if (templateData.airslateTemplateId) {
      try {
        const airslateClient = getAirSlateClient();
        
        // Create document
        airslateDocument = await airslateClient.createDocument({
          templateId: templateData.airslateTemplateId,
          fields,
          metadata,
        });

        // Submit for processing
        const submittedDoc = await airslateClient.submitDocument(
          airslateDocument.id
        );

        // Get download URL from airSlate
        downloadUrl = submittedDoc.downloadUrl;
        
        // Store document in Firebase Storage
        if (downloadUrl) {
          try {
            // Create a temporary submission ID for storage path
            const tempSubmissionId = `temp-${Date.now()}`;
            
            const storageResult = await storeAirSlateDocument(
              downloadUrl,
              orgId,
              templateData.category,
              tempSubmissionId,
              {
                templateId,
                templateName: templateData.name,
                submittedBy: metadata?.submittedBy || "unknown",
              }
            );
            
            storagePath = storageResult.path;
            firebaseStorageUrl = storageResult.downloadUrl;
          } catch (storageError) {
            console.error("Error storing document in Firebase Storage:", storageError);
            // Continue with airSlate URL if storage fails
          }
        }
      } catch (error) {
        console.error("Error generating document with airSlate:", error);
        // Continue anyway - we'll store the submission without the document
      }
    }

    // Create submission record in Firestore
    const submissionsCollection = db.collection(`orgs/${orgId}/formSubmissions`);

    const submissionData = {
      templateId,
      templateName: templateData.name,
      category: templateData.category,
      submittedBy: {
        uid: metadata?.submittedBy || "unknown",
        email: metadata?.email || "unknown",
        displayName: metadata?.displayName || "Unknown User",
      },
      submittedAt: AdminFieldValue.serverTimestamp(),
      status: "pending",
      fields,
      document: airslateDocument
        ? {
            airslateDocumentId: airslateDocument.id,
            storagePath,
            airslateDownloadUrl: downloadUrl,
            downloadUrl: firebaseStorageUrl || downloadUrl,
            generatedAt: AdminFieldValue.serverTimestamp(),
          }
        : null,
      routing: {
        assignedTo: templateData.routingRules.submitTo || ["admin"],
        notifiedEmails: templateData.routingRules.notifyEmails || [],
        requiresApproval: templateData.routingRules.requireApproval || false,
      },
      approvals: {},
      metadata: {
        viewCount: 0,
        lastViewedAt: null,
        completedAt: null,
      },
    };

    const submissionRef = await submissionsCollection.add(submissionData);

    // Increment template use count
    await templateRef.update({
      "metadata.useCount": AdminFieldValue.increment(1),
      "metadata.updatedAt": AdminFieldValue.serverTimestamp(),
    });

    // Send notification to approvers
    if (templateData.routingRules.submitTo && templateData.routingRules.submitTo.length > 0) {
      try {
        // TODO: Get approver emails from roles/users
        const approverEmails = templateData.routingRules.notifyEmails || [];
        
        if (approverEmails.length > 0) {
          await sendFormSubmissionNotification(
            {
              submitterName: metadata?.displayName || "Unknown User",
              submitterEmail: metadata?.email || "unknown",
              templateName: templateData.name,
              submissionId: submissionRef.id,
              submittedAt: new Date().toLocaleString(),
              fields,
              viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/forms/submissions/${submissionRef.id}`,
            },
            approverEmails.map((email: string) => ({ email }))
          );
        }
      } catch (emailError) {
        console.error("Error sending submission notification:", emailError);
        // Don't fail the submission if email fails
      }
    }

    // Log audit event
    try {
      await logFormAction(
        "form.submitted",
        metadata?.submittedBy || "unknown",
        metadata?.email || "unknown",
        metadata?.displayName || "Unknown User",
        submissionRef.id,
        orgId,
        {
          templateName: templateData.name,
          templateId,
          category: templateData.category,
        }
      );
    } catch (auditError) {
      console.error("Error logging audit:", auditError);
    }

    // Track analytics
    try {
      await trackFormSubmission(
        orgId,
        templateId,
        templateData.name,
        metadata?.submittedBy || "unknown",
        metadata?.email || "unknown"
      );
    } catch (analyticsError) {
      console.error("Error tracking analytics:", analyticsError);
    }

    return NextResponse.json(
      {
        success: true,
        submissionId: submissionRef.id,
        documentId: airslateDocument?.id,
        downloadUrl,
        message: "Form submitted successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error generating form:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
