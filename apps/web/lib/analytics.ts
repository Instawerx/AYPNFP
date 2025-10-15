/**
 * Analytics Tracking System
 * 
 * This module provides analytics tracking for forms, users, and system metrics.
 * Data is aggregated in Firestore for real-time dashboards and reports.
 */

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

export interface FormAnalytics {
  templateId: string;
  templateName: string;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  completedSubmissions: number;
  avgProcessingTime: number; // in hours
  lastSubmissionAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface UserAnalytics {
  userId: string;
  userEmail: string;
  totalSubmissions: number;
  totalApprovals: number;
  totalRejections: number;
  lastActivityAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  submissions: number;
  approvals: number;
  rejections: number;
  uniqueUsers: number;
  avgProcessingTime: number;
  createdAt: any;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number; // Last 30 days
  totalForms: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalTemplates: number;
  avgSubmissionsPerDay: number;
  avgProcessingTime: number;
  updatedAt: any;
}

/**
 * Track form submission
 */
export async function trackFormSubmission(
  orgId: string,
  templateId: string,
  templateName: string,
  userId: string,
  userEmail: string
): Promise<void> {
  try {
    const batch = [];

    // Update form analytics
    const formAnalyticsRef = doc(
      db,
      `orgs/${orgId}/analytics/forms/templates/${templateId}`
    );
    
    batch.push(
      setDoc(
        formAnalyticsRef,
        {
          templateId,
          templateName,
          totalSubmissions: increment(1),
          pendingSubmissions: increment(1),
          lastSubmissionAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    // Update user analytics
    const userAnalyticsRef = doc(
      db,
      `orgs/${orgId}/analytics/users/${userId}`
    );
    
    batch.push(
      setDoc(
        userAnalyticsRef,
        {
          userId,
          userEmail,
          totalSubmissions: increment(1),
          lastActivityAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    // Update daily metrics
    const today = new Date().toISOString().split("T")[0];
    const dailyMetricsRef = doc(
      db,
      `orgs/${orgId}/analytics/daily/${today}`
    );
    
    batch.push(
      setDoc(
        dailyMetricsRef,
        {
          date: today,
          submissions: increment(1),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    // Execute all updates
    await Promise.all(batch);

    console.log(`[ANALYTICS] Tracked form submission: ${templateName}`);
  } catch (error) {
    console.error("Error tracking form submission:", error);
  }
}

/**
 * Track form approval
 */
export async function trackFormApproval(
  orgId: string,
  templateId: string,
  submissionId: string,
  approverId: string,
  processingTimeHours: number
): Promise<void> {
  try {
    const batch = [];

    // Update form analytics
    const formAnalyticsRef = doc(
      db,
      `orgs/${orgId}/analytics/forms/templates/${templateId}`
    );
    
    batch.push(
      updateDoc(formAnalyticsRef, {
        pendingSubmissions: increment(-1),
        approvedSubmissions: increment(1),
        completedSubmissions: increment(1),
        avgProcessingTime: processingTimeHours, // TODO: Calculate running average
        updatedAt: serverTimestamp(),
      })
    );

    // Update approver analytics
    const approverAnalyticsRef = doc(
      db,
      `orgs/${orgId}/analytics/users/${approverId}`
    );
    
    batch.push(
      setDoc(
        approverAnalyticsRef,
        {
          userId: approverId,
          totalApprovals: increment(1),
          lastActivityAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    // Update daily metrics
    const today = new Date().toISOString().split("T")[0];
    const dailyMetricsRef = doc(
      db,
      `orgs/${orgId}/analytics/daily/${today}`
    );
    
    batch.push(
      setDoc(
        dailyMetricsRef,
        {
          date: today,
          approvals: increment(1),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    await Promise.all(batch);

    console.log(`[ANALYTICS] Tracked form approval: ${submissionId}`);
  } catch (error) {
    console.error("Error tracking form approval:", error);
  }
}

/**
 * Track form rejection
 */
export async function trackFormRejection(
  orgId: string,
  templateId: string,
  submissionId: string,
  rejectorId: string,
  processingTimeHours: number
): Promise<void> {
  try {
    const batch = [];

    // Update form analytics
    const formAnalyticsRef = doc(
      db,
      `orgs/${orgId}/analytics/forms/templates/${templateId}`
    );
    
    batch.push(
      updateDoc(formAnalyticsRef, {
        pendingSubmissions: increment(-1),
        rejectedSubmissions: increment(1),
        completedSubmissions: increment(1),
        avgProcessingTime: processingTimeHours,
        updatedAt: serverTimestamp(),
      })
    );

    // Update rejector analytics
    const rejectorAnalyticsRef = doc(
      db,
      `orgs/${orgId}/analytics/users/${rejectorId}`
    );
    
    batch.push(
      setDoc(
        rejectorAnalyticsRef,
        {
          userId: rejectorId,
          totalRejections: increment(1),
          lastActivityAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    // Update daily metrics
    const today = new Date().toISOString().split("T")[0];
    const dailyMetricsRef = doc(
      db,
      `orgs/${orgId}/analytics/daily/${today}`
    );
    
    batch.push(
      setDoc(
        dailyMetricsRef,
        {
          date: today,
          rejections: increment(1),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    await Promise.all(batch);

    console.log(`[ANALYTICS] Tracked form rejection: ${submissionId}`);
  } catch (error) {
    console.error("Error tracking form rejection:", error);
  }
}

/**
 * Get form analytics
 */
export async function getFormAnalytics(
  orgId: string,
  templateId: string
): Promise<FormAnalytics | null> {
  try {
    const docRef = doc(
      db,
      `orgs/${orgId}/analytics/forms/templates/${templateId}`
    );
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as FormAnalytics;
  } catch (error) {
    console.error("Error getting form analytics:", error);
    return null;
  }
}

/**
 * Get all form analytics
 */
export async function getAllFormAnalytics(
  orgId: string
): Promise<FormAnalytics[]> {
  try {
    const q = query(
      collection(db, `orgs/${orgId}/analytics/forms/templates`),
      orderBy("totalSubmissions", "desc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => doc.data() as FormAnalytics);
  } catch (error) {
    console.error("Error getting all form analytics:", error);
    return [];
  }
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(
  orgId: string,
  userId: string
): Promise<UserAnalytics | null> {
  try {
    const docRef = doc(db, `orgs/${orgId}/analytics/users/${userId}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as UserAnalytics;
  } catch (error) {
    console.error("Error getting user analytics:", error);
    return null;
  }
}

/**
 * Get daily metrics for a date range
 */
export async function getDailyMetrics(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<DailyMetrics[]> {
  try {
    const q = query(
      collection(db, `orgs/${orgId}/analytics/daily`),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => doc.data() as DailyMetrics);
  } catch (error) {
    console.error("Error getting daily metrics:", error);
    return [];
  }
}

/**
 * Get system metrics
 */
export async function getSystemMetrics(orgId: string): Promise<SystemMetrics> {
  try {
    // Get all form analytics
    const formAnalytics = await getAllFormAnalytics(orgId);

    // Calculate totals
    const totalSubmissions = formAnalytics.reduce(
      (sum, fa) => sum + fa.totalSubmissions,
      0
    );
    const pendingSubmissions = formAnalytics.reduce(
      (sum, fa) => sum + fa.pendingSubmissions,
      0
    );
    const totalTemplates = formAnalytics.length;

    // Get daily metrics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    const dailyMetrics = await getDailyMetrics(orgId, startDate, endDate);
    
    const recentSubmissions = dailyMetrics.reduce(
      (sum, dm) => sum + (dm.submissions || 0),
      0
    );
    const avgSubmissionsPerDay = recentSubmissions / 30;

    // Calculate average processing time
    const avgProcessingTime =
      formAnalytics.reduce((sum, fa) => sum + (fa.avgProcessingTime || 0), 0) /
      (formAnalytics.length || 1);

    return {
      totalUsers: 0, // TODO: Count from users collection
      activeUsers: 0, // TODO: Count from user analytics
      totalForms: totalSubmissions,
      totalSubmissions,
      pendingSubmissions,
      totalTemplates,
      avgSubmissionsPerDay,
      avgProcessingTime,
      updatedAt: serverTimestamp(),
    };
  } catch (error) {
    console.error("Error getting system metrics:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalForms: 0,
      totalSubmissions: 0,
      pendingSubmissions: 0,
      totalTemplates: 0,
      avgSubmissionsPerDay: 0,
      avgProcessingTime: 0,
      updatedAt: serverTimestamp(),
    };
  }
}

/**
 * Get top templates by submissions
 */
export async function getTopTemplates(
  orgId: string,
  limitCount: number = 10
): Promise<FormAnalytics[]> {
  try {
    const q = query(
      collection(db, `orgs/${orgId}/analytics/forms/templates`),
      orderBy("totalSubmissions", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => doc.data() as FormAnalytics);
  } catch (error) {
    console.error("Error getting top templates:", error);
    return [];
  }
}

/**
 * Get top users by activity
 */
export async function getTopUsers(
  orgId: string,
  limitCount: number = 10
): Promise<UserAnalytics[]> {
  try {
    const q = query(
      collection(db, `orgs/${orgId}/analytics/users`),
      orderBy("totalSubmissions", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => doc.data() as UserAnalytics);
  } catch (error) {
    console.error("Error getting top users:", error);
    return [];
  }
}

/**
 * Calculate processing time in hours
 */
export function calculateProcessingTime(
  submittedAt: any,
  completedAt: any
): number {
  try {
    const submitted = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt);
    const completed = completedAt.toDate ? completedAt.toDate() : new Date(completedAt);
    
    const diffMs = completed.getTime() - submitted.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.error("Error calculating processing time:", error);
    return 0;
  }
}
