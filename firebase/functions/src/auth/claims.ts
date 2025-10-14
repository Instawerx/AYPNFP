import * as admin from "firebase-admin";

/**
 * Available scopes for RBAC
 */
export type Scope =
  | "admin.read"
  | "admin.write"
  | "crm.read"
  | "crm.write"
  | "donor.read"
  | "donor.write"
  | "campaign.read"
  | "campaign.write"
  | "finance.read"
  | "finance.write"
  | "hr.read"
  | "hr.write";

/**
 * Custom claims structure
 */
export interface CustomClaims {
  orgId: string;
  scopes: Scope[];
  isFunction?: boolean;
  donorId?: string;
  employeeId?: string;
  fundraiserId?: string;
}

/**
 * Set custom claims for a user
 * @param uid - Firebase Auth UID
 * @param orgId - Organization ID
 * @param scopes - Array of permission scopes
 * @param additionalClaims - Optional additional claims (donorId, employeeId, etc.)
 */
export async function setUserClaims(
  uid: string,
  orgId: string,
  scopes: Scope[],
  additionalClaims?: Partial<CustomClaims>
): Promise<void> {
  const claims: CustomClaims = {
    orgId,
    scopes,
    isFunction: false,
    ...additionalClaims,
  };

  await admin.auth().setCustomUserClaims(uid, claims);
}

/**
 * Get custom claims for a user
 * @param uid - Firebase Auth UID
 * @returns Custom claims or null
 */
export async function getUserClaims(uid: string): Promise<CustomClaims | null> {
  const user = await admin.auth().getUser(uid);
  return (user.customClaims as CustomClaims) || null;
}

/**
 * Add scopes to a user
 * @param uid - Firebase Auth UID
 * @param newScopes - Scopes to add
 */
export async function addScopes(uid: string, newScopes: Scope[]): Promise<void> {
  const claims = await getUserClaims(uid);
  if (!claims) {
    throw new Error("User has no custom claims");
  }

  const updatedScopes = Array.from(new Set([...claims.scopes, ...newScopes]));
  await setUserClaims(uid, claims.orgId, updatedScopes, claims);
}

/**
 * Remove scopes from a user
 * @param uid - Firebase Auth UID
 * @param scopesToRemove - Scopes to remove
 */
export async function removeScopes(uid: string, scopesToRemove: Scope[]): Promise<void> {
  const claims = await getUserClaims(uid);
  if (!claims) {
    throw new Error("User has no custom claims");
  }

  const updatedScopes = claims.scopes.filter((s) => !scopesToRemove.includes(s));
  await setUserClaims(uid, claims.orgId, updatedScopes, claims);
}

/**
 * Check if a user has a specific scope
 * @param uid - Firebase Auth UID
 * @param scope - Scope to check
 * @returns True if user has the scope
 */
export async function hasScope(uid: string, scope: Scope): Promise<boolean> {
  const claims = await getUserClaims(uid);
  return claims?.scopes.includes(scope) || false;
}

/**
 * Elevate context for Cloud Functions (for audit logging)
 * @param orgId - Organization ID
 * @returns Function context claims
 */
export function getFunctionContext(orgId: string): CustomClaims {
  return {
    orgId,
    scopes: ["admin.write"] as Scope[],
    isFunction: true,
  };
}
