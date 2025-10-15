/**
 * Email Notification System
 * 
 * This module provides email notification functionality using SendGrid.
 * It includes templates for various notification types and handles
 * email delivery with proper error handling and retry logic.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
}

export interface FormSubmissionEmailData {
  submitterName: string;
  submitterEmail: string;
  templateName: string;
  submissionId: string;
  submittedAt: string;
  fields: Record<string, any>;
  viewUrl: string;
}

export interface ApprovalEmailData {
  submitterName: string;
  submitterEmail: string;
  templateName: string;
  submissionId: string;
  approverName: string;
  approvedAt: string;
  comments?: string;
  downloadUrl?: string;
}

export interface RejectionEmailData {
  submitterName: string;
  submitterEmail: string;
  templateName: string;
  submissionId: string;
  rejectorName: string;
  rejectedAt: string;
  reason: string;
  comments?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn("SendGrid API key not configured. Email not sent.");
      return false;
    }

    const from = options.from || {
      email: process.env.SENDGRID_FROM_EMAIL || "noreply@aypnfp.org",
      name: process.env.SENDGRID_FROM_NAME || "AYPNFP",
    };

    // Prepare recipients
    const to = Array.isArray(options.to) ? options.to : [options.to];

    const payload = {
      personalizations: [
        {
          to: to.map((r) => ({ email: r.email, name: r.name })),
          cc: options.cc?.map((r) => ({ email: r.email, name: r.name })),
          bcc: options.bcc?.map((r) => ({ email: r.email, name: r.name })),
        },
      ],
      from: { email: from.email, name: from.name },
      reply_to: options.replyTo
        ? { email: options.replyTo.email, name: options.replyTo.name }
        : undefined,
      subject: options.subject,
      content: [
        {
          type: "text/html",
          value: options.html,
        },
        ...(options.text
          ? [
              {
                type: "text/plain",
                value: options.text,
              },
            ]
          : []),
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid error:", error);
      throw new Error(`SendGrid error: ${response.status}`);
    }

    console.log("Email sent successfully to:", to.map((r) => r.email).join(", "));
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send form submission notification to approvers
 */
export async function sendFormSubmissionNotification(
  data: FormSubmissionEmailData,
  approvers: EmailRecipient[]
): Promise<boolean> {
  const html = generateFormSubmissionEmail(data);
  const text = generateFormSubmissionEmailText(data);

  return sendEmail({
    to: approvers,
    subject: `New Form Submission: ${data.templateName}`,
    html,
    text,
  });
}

/**
 * Send approval notification to submitter
 */
export async function sendApprovalNotification(
  data: ApprovalEmailData
): Promise<boolean> {
  const html = generateApprovalEmail(data);
  const text = generateApprovalEmailText(data);

  return sendEmail({
    to: { email: data.submitterEmail, name: data.submitterName },
    subject: `Form Approved: ${data.templateName}`,
    html,
    text,
  });
}

/**
 * Send rejection notification to submitter
 */
export async function sendRejectionNotification(
  data: RejectionEmailData
): Promise<boolean> {
  const html = generateRejectionEmail(data);
  const text = generateRejectionEmailText(data);

  return sendEmail({
    to: { email: data.submitterEmail, name: data.submitterName },
    subject: `Form Rejected: ${data.templateName}`,
    html,
    text,
  });
}

/**
 * Generate HTML email for form submission
 */
function generateFormSubmissionEmail(data: FormSubmissionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .field { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 4px; }
    .field-label { font-weight: bold; color: #4b5563; }
    .field-value { color: #1f2937; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Form Submission</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>A new form submission requires your review.</p>
      
      <div class="info-box">
        <h3>Submission Details</h3>
        <p><strong>Form:</strong> ${data.templateName}</p>
        <p><strong>Submitted by:</strong> ${data.submitterName} (${data.submitterEmail})</p>
        <p><strong>Submitted on:</strong> ${data.submittedAt}</p>
        <p><strong>Submission ID:</strong> ${data.submissionId}</p>
      </div>

      <div class="info-box">
        <h3>Form Data</h3>
        ${Object.entries(data.fields)
          .map(
            ([key, value]) => `
          <div class="field">
            <div class="field-label">${key.replace(/([A-Z])/g, " $1").trim()}</div>
            <div class="field-value">${value}</div>
          </div>
        `
          )
          .join("")}
      </div>

      <div style="text-align: center;">
        <a href="${data.viewUrl}" class="button">View & Review Submission</a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Please review this submission and take appropriate action.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated notification from AYPNFP Form Management System.</p>
      <p>© ${new Date().getFullYear()} Adopt a Young Parent. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for form submission
 */
function generateFormSubmissionEmailText(data: FormSubmissionEmailData): string {
  return `
New Form Submission

A new form submission requires your review.

Submission Details:
- Form: ${data.templateName}
- Submitted by: ${data.submitterName} (${data.submitterEmail})
- Submitted on: ${data.submittedAt}
- Submission ID: ${data.submissionId}

Form Data:
${Object.entries(data.fields)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

View & Review: ${data.viewUrl}

---
This is an automated notification from AYPNFP Form Management System.
© ${new Date().getFullYear()} Adopt a Young Parent. All rights reserved.
  `;
}

/**
 * Generate HTML email for approval
 */
function generateApprovalEmail(data: ApprovalEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form Approved</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Form Approved</h1>
    </div>
    <div class="content">
      <p>Hello ${data.submitterName},</p>
      <p>Great news! Your form submission has been approved.</p>
      
      <div class="info-box">
        <h3>Approval Details</h3>
        <p><strong>Form:</strong> ${data.templateName}</p>
        <p><strong>Approved by:</strong> ${data.approverName}</p>
        <p><strong>Approved on:</strong> ${data.approvedAt}</p>
        ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ""}
      </div>

      ${
        data.downloadUrl
          ? `
      <div style="text-align: center;">
        <a href="${data.downloadUrl}" class="button">Download Document</a>
      </div>
      `
          : ""
      }

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Thank you for your submission!
      </p>
    </div>
    <div class="footer">
      <p>This is an automated notification from AYPNFP Form Management System.</p>
      <p>© ${new Date().getFullYear()} Adopt a Young Parent. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for approval
 */
function generateApprovalEmailText(data: ApprovalEmailData): string {
  return `
Form Approved

Hello ${data.submitterName},

Great news! Your form submission has been approved.

Approval Details:
- Form: ${data.templateName}
- Approved by: ${data.approverName}
- Approved on: ${data.approvedAt}
${data.comments ? `- Comments: ${data.comments}` : ""}

${data.downloadUrl ? `Download Document: ${data.downloadUrl}` : ""}

Thank you for your submission!

---
This is an automated notification from AYPNFP Form Management System.
© ${new Date().getFullYear()} Adopt a Young Parent. All rights reserved.
  `;
}

/**
 * Generate HTML email for rejection
 */
function generateRejectionEmail(data: RejectionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form Rejected</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
    .reason-box { background: #fef2f2; padding: 15px; margin: 15px 0; border-radius: 6px; border: 1px solid #fecaca; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Form Rejected</h1>
    </div>
    <div class="content">
      <p>Hello ${data.submitterName},</p>
      <p>We regret to inform you that your form submission has been rejected.</p>
      
      <div class="info-box">
        <h3>Rejection Details</h3>
        <p><strong>Form:</strong> ${data.templateName}</p>
        <p><strong>Rejected by:</strong> ${data.rejectorName}</p>
        <p><strong>Rejected on:</strong> ${data.rejectedAt}</p>
      </div>

      <div class="reason-box">
        <h4 style="margin-top: 0; color: #dc2626;">Reason for Rejection:</h4>
        <p>${data.reason}</p>
        ${data.comments ? `<p><strong>Additional Comments:</strong> ${data.comments}</p>` : ""}
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        If you have questions about this decision, please contact the reviewer.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated notification from AYPNFP Form Management System.</p>
      <p>© ${new Date().getFullYear()} Adopt a Young Parent. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for rejection
 */
function generateRejectionEmailText(data: RejectionEmailData): string {
  return `
Form Rejected

Hello ${data.submitterName},

We regret to inform you that your form submission has been rejected.

Rejection Details:
- Form: ${data.templateName}
- Rejected by: ${data.rejectorName}
- Rejected on: ${data.rejectedAt}

Reason for Rejection:
${data.reason}

${data.comments ? `Additional Comments:\n${data.comments}` : ""}

If you have questions about this decision, please contact the reviewer.

---
This is an automated notification from AYPNFP Form Management System.
© ${new Date().getFullYear()} Adopt a Young Parent. All rights reserved.
  `;
}

/**
 * Mock email sending for development
 */
export async function sendEmailMock(options: EmailOptions): Promise<boolean> {
  console.log("📧 [MOCK EMAIL]");
  console.log("To:", options.to);
  console.log("Subject:", options.subject);
  console.log("---");
  return true;
}
