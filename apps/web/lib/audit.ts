/**
 * Audit Logging System
 * 
 * This module provides comprehensive audit logging for all system actions.
 * Logs are stored in Firestore and can be queried for compliance and debugging.
 */

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export type AuditAction =
  // User Management
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.password_reset"
  | "user.login"
  | "user.logout"
  // Role Management
  | "role.created"
  | "role.updated"
  | "role.deleted"
  // Form Management
  | "form.template_created"
  | "form.template_updated"
  | "form.template_deleted"
  | "form.template_synced"
  | "form.submitted"
  | "form.approved"
  | "form.rejected"
  | "form.viewed"
  | "form.downloaded"
  // System
  | "system.config_changed"
  | "system.error"
  | "system.warning";

export type AuditCategory = "user" | "role" | "form" | "system";

export interface AuditLogEntry {
  // Who
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorRole?: string;
  
  // What
  action: AuditAction;
  category: AuditCategory;
  resource: string; // e.g., "user:abc123", "form:xyz789"
  resourceType: string; // e.g., "user", "form", "role"
  
  // When
  timestamp: any; // serverTimestamp
  
  // Where
  ipAddress?: string;
  userAgent?: string;
  
  // Details
  details?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  
  // Context
  orgId: string;
  sessionId?: string;
  
  // Status
  success: boolean;
  errorMessage?: string;
}

export interface AuditQueryOptions {
  orgId: string;
  actorId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Log an audit event
 */
export async function logAudit(entry: Omit<AuditLogEntry, "timestamp">): Promise<string> {
  try {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, `orgs/${entry.orgId}/auditLogs`),
      auditEntry
    );

    console.log(`[AUDIT] ${entry.action} by ${entry.actorEmail} on ${entry.resource}`);
    
    return docRef.id;
  } catch (error) {
    console.error("Error logging audit event:", error);
    // Don't throw - audit logging should never break the main flow
    return "";
  }
}

/**
 * Log user action
 */
export async function logUserAction(
  action: AuditAction,
  actorId: string,
  actorEmail: string,
  actorName: string,
  resourceId: string,
  orgId: string,
  details?: Record<string, any>,
  changes?: { before?: Record<string, any>; after?: Record<string, any> }
): Promise<string> {
  return logAudit({
    actorId,
    actorEmail,
    actorName,
    action,
    category: "user",
    resource: `user:${resourceId}`,
    resourceType: "user",
    orgId,
    details,
    changes,
    success: true,
  });
}

/**
 * Log role action
 */
export async function logRoleAction(
  action: AuditAction,
  actorId: string,
  actorEmail: string,
  actorName: string,
  roleId: string,
  orgId: string,
  details?: Record<string, any>,
  changes?: { before?: Record<string, any>; after?: Record<string, any> }
): Promise<string> {
  return logAudit({
    actorId,
    actorEmail,
    actorName,
    action,
    category: "role",
    resource: `role:${roleId}`,
    resourceType: "role",
    orgId,
    details,
    changes,
    success: true,
  });
}

/**
 * Log form action
 */
export async function logFormAction(
  action: AuditAction,
  actorId: string,
  actorEmail: string,
  actorName: string,
  formId: string,
  orgId: string,
  details?: Record<string, any>,
  changes?: { before?: Record<string, any>; after?: Record<string, any> }
): Promise<string> {
  return logAudit({
    actorId,
    actorEmail,
    actorName,
    action,
    category: "form",
    resource: `form:${formId}`,
    resourceType: "form",
    orgId,
    details,
    changes,
    success: true,
  });
}

/**
 * Log system event
 */
export async function logSystemEvent(
  action: AuditAction,
  resource: string,
  orgId: string,
  details?: Record<string, any>,
  success: boolean = true,
  errorMessage?: string
): Promise<string> {
  return logAudit({
    actorId: "system",
    actorEmail: "system@aypnfp.org",
    actorName: "System",
    action,
    category: "system",
    resource,
    resourceType: "system",
    orgId,
    details,
    success,
    errorMessage,
  });
}

/**
 * Log error
 */
export async function logError(
  action: AuditAction,
  actorId: string,
  actorEmail: string,
  actorName: string,
  resource: string,
  orgId: string,
  errorMessage: string,
  details?: Record<string, any>
): Promise<string> {
  return logAudit({
    actorId,
    actorEmail,
    actorName,
    action,
    category: "system",
    resource,
    resourceType: "error",
    orgId,
    details,
    success: false,
    errorMessage,
  });
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(
  options: AuditQueryOptions
): Promise<AuditLogEntry[]> {
  try {
    let q = query(
      collection(db, `orgs/${options.orgId}/auditLogs`),
      orderBy("timestamp", "desc")
    );

    if (options.actorId) {
      q = query(q, where("actorId", "==", options.actorId));
    }

    if (options.action) {
      q = query(q, where("action", "==", options.action));
    }

    if (options.category) {
      q = query(q, where("category", "==", options.category));
    }

    if (options.resourceType) {
      q = query(q, where("resourceType", "==", options.resourceType));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => doc.data() as AuditLogEntry);
  } catch (error) {
    console.error("Error querying audit logs:", error);
    return [];
  }
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(
  userId: string,
  orgId: string,
  limitCount: number = 50
): Promise<AuditLogEntry[]> {
  return queryAuditLogs({
    orgId,
    actorId: userId,
    limit: limitCount,
  });
}

/**
 * Get recent activity for a resource
 */
export async function getResourceActivity(
  resourceType: string,
  orgId: string,
  limitCount: number = 50
): Promise<AuditLogEntry[]> {
  return queryAuditLogs({
    orgId,
    resourceType,
    limit: limitCount,
  });
}

/**
 * Get form submission history
 */
export async function getFormSubmissionHistory(
  formId: string,
  orgId: string
): Promise<AuditLogEntry[]> {
  try {
    const q = query(
      collection(db, `orgs/${orgId}/auditLogs`),
      where("resource", "==", `form:${formId}`),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => doc.data() as AuditLogEntry);
  } catch (error) {
    console.error("Error getting form submission history:", error);
    return [];
  }
}

/**
 * Generate audit report
 */
export async function generateAuditReport(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalActions: number;
  actionsByCategory: Record<string, number>;
  actionsByType: Record<string, number>;
  topActors: Array<{ actorEmail: string; count: number }>;
  errors: number;
}> {
  try {
    const logs = await queryAuditLogs({
      orgId,
      startDate,
      endDate,
      limit: 10000, // Adjust based on needs
    });

    const actionsByCategory: Record<string, number> = {};
    const actionsByType: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};
    let errors = 0;

    logs.forEach((log) => {
      // Count by category
      actionsByCategory[log.category] = (actionsByCategory[log.category] || 0) + 1;

      // Count by action type
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

      // Count by actor
      actorCounts[log.actorEmail] = (actorCounts[log.actorEmail] || 0) + 1;

      // Count errors
      if (!log.success) {
        errors++;
      }
    });

    // Get top actors
    const topActors = Object.entries(actorCounts)
      .map(([actorEmail, count]) => ({ actorEmail, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActions: logs.length,
      actionsByCategory,
      actionsByType,
      topActors,
      errors,
    };
  } catch (error) {
    console.error("Error generating audit report:", error);
    return {
      totalActions: 0,
      actionsByCategory: {},
      actionsByType: {},
      topActors: [],
      errors: 0,
    };
  }
}
