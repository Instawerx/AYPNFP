/**
 * Firebase Admin SDK Initialization
 * 
 * Centralized initialization for Firebase Admin SDK used in API routes.
 * This ensures the admin SDK is initialized once and reused across all API endpoints.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Get or initialize Firebase Admin app
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  try {
    // Validate environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // During build time, credentials from secrets are not available
    // This is expected and not an error - just return a mock app
    if (!projectId || !clientEmail || !privateKey) {
      // Check if we're in build mode
      if (process.env.NEXT_PHASE === 'phase-production-build' ||
          process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn("Firebase Admin credentials not available during build - this is expected");
        // Create a minimal app instance that won't be used during build
        adminApp = initializeApp({
          projectId: projectId || 'build-time-placeholder',
        });
        return adminApp;
      }

      throw new Error(
        "Missing Firebase Admin credentials. Ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set."
      );
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Handle both escaped and unescaped newlines
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });

    console.log("Firebase Admin initialized successfully");
    return adminApp;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth {
  const app = getAdminApp();
  return getAuth(app);
}

export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const app = getAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}

export const AdminFieldValue = FieldValue;

/**
 * Verify if Firebase Admin is properly configured
 */
export function isAdminConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}
