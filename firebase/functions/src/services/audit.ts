import * as admin from "firebase-admin";

/**
 * Actor type for audit logs
 */
export interface AuditActor {
  uid: string;
  type: "user" | "webhook" | "system" | "function";
  email?: string;
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  orgId: string;
  action: string;
  actor: AuditActor;
  entityRef: string; // e.g., "donations/123", "users/abc"
  before: any;
  after: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit entry
 * Audit logs are immutable and append-only
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const db = admin.firestore();

  // Redact sensitive fields from before/after
  const redactedEntry = {
    ...entry,
    before: redactSensitiveFields(entry.before),
    after: redactSensitiveFields(entry.after),
    timestamp: admin.firestore.Timestamp.now(),
  };

  try {
    await db
      .collection("orgs")
      .doc(entry.orgId)
      .collection("auditLogs")
      .add(redactedEntry);

    console.log(`Audit log created: ${entry.action} on ${entry.entityRef}`);
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Redact sensitive fields from audit log data
 * Prevents PII from being logged in plain text
 */
function redactSensitiveFields(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveFields = [
    "password",
    "ssn",
    "socialSecurityNumber",
    "creditCard",
    "cvv",
    "bankAccount",
    "routingNumber",
  ];

  const redacted = { ...data };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]";
    }
  }

  // Recursively redact nested objects
  for (const key in redacted) {
    if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = redactSensitiveFields(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Common audit actions (for consistency)
 */
export const AuditActions = {
  // User actions
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_ROLE_CHANGED: "user.role.changed",

  // Donor actions
  DONOR_CREATED: "donor.created",
  DONOR_UPDATED: "donor.updated",
  DONOR_CONSENT_CHANGED: "donor.consent.changed",
  DONOR_NOTIFIED_FCM: "donor.notify.fcm",
  DONOR_NOTIFIED_EMAIL: "donor.notify.email",
  DONOR_NOTIFIED_SMS: "donor.notify.sms",

  // Donation actions
  DONATION_WEBHOOK_ZEFFY: "donation.webhook.zeffy",
  DONATION_WEBHOOK_STRIPE: "donation.webhook.stripe",
  DONATION_REFUNDED: "donation.refunded",

  // Campaign actions
  CAMPAIGN_CREATED: "campaign.created",
  CAMPAIGN_UPDATED: "campaign.updated",
  CAMPAIGN_DELETED: "campaign.deleted",

  // Finance actions
  SETTLEMENT_IMPORTED: "settlement.imported",
  SETTLEMENT_RECONCILED: "settlement.reconciled",

  // Settings actions
  ORG_SETTINGS_UPDATED: "org.settings.updated",
  INTEGRATION_CONFIGURED: "integration.configured",

  // Security actions
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILED: "auth.login.failed",
  PERMISSION_DENIED: "auth.permission.denied",
} as const;
