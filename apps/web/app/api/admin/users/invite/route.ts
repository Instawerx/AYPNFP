import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName, roles, sendEmail, orgId } = body;

    // Validation
    if (!email || !roles || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: "At least one role is required" },
        { status: 400 }
      );
    }

    // TODO: Verify requesting user has admin.write scope
    // This should be done via middleware or auth check

    // Aggregate scopes from roles
    const scopes: string[] = [];
    for (const roleId of roles) {
      const roleDoc = await getDoc(doc(db, `orgs/${orgId}/roles`, roleId));
      if (roleDoc.exists()) {
        const roleData = roleDoc.data();
        if (roleData.scopes) {
          scopes.push(...roleData.scopes);
        }
      }
    }

    // Remove duplicates
    const uniqueScopes = [...new Set(scopes)];

    // Create user in Firebase Auth (via Admin SDK)
    let userId: string;
    try {
      const adminAuth = getAdminAuth();
      const userRecord = await adminAuth.createUser({
        email,
        displayName: displayName || undefined,
        emailVerified: false,
      });
      userId = userRecord.uid;

      // Set custom claims
      await adminAuth.setCustomUserClaims(userId, {
        role: roles[0], // Primary role
        roles,
        scopes: uniqueScopes,
        orgId,
      });
    } catch (error: any) {
      console.error("Error creating user in Auth:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user document in Firestore
    try {
      await setDoc(doc(db, `orgs/${orgId}/users`, userId), {
        email,
        displayName: displayName || "",
        roles,
        scopes: uniqueScopes,
        status: "active",
        createdAt: serverTimestamp(),
        lastLoginAt: null,
        metadata: {
          invitedBy: "admin", // TODO: Get from auth context
          invitedAt: serverTimestamp(),
        },
      });
    } catch (error: any) {
      console.error("Error creating user document:", error);
      // Try to delete the auth user if Firestore fails
      try {
        const adminAuth = getAdminAuth();
        await adminAuth.deleteUser(userId);
      } catch (deleteError) {
        console.error("Error cleaning up auth user:", deleteError);
      }
      return NextResponse.json(
        { error: "Failed to create user document" },
        { status: 500 }
      );
    }

    // TODO: Send invitation email if sendEmail is true
    // This would typically be done via a Cloud Function or email service

    return NextResponse.json(
      {
        success: true,
        userId,
        message: "User invited successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in invite user API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
