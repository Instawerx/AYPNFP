import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, AdminFieldValue } from "@/lib/firebase-admin";

const db = getAdminDb();

// GET - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    const userRef = db.collection(`orgs/${orgId}/users`).doc(params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { displayName, roles, status, orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // TODO: Verify requesting user has admin.write scope

    // Get current user data
    const userRef = db.collection(`orgs/${orgId}/users`).doc(params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Aggregate scopes from roles
    const scopes: string[] = [];
    if (roles && Array.isArray(roles)) {
      for (const roleId of roles) {
        const roleDoc = await db
          .collection(`orgs/${orgId}/roles`)
          .doc(roleId)
          .get();
        if (roleDoc.exists) {
          const roleData = roleDoc.data() || {};
          if (roleData.scopes) {
            scopes.push(...roleData.scopes);
          }
        }
      }
    }

    const uniqueScopes = [...new Set(scopes)];

    // Update custom claims if roles changed
    if (roles && Array.isArray(roles)) {
      try {
        const adminAuth = getAdminAuth();
        await adminAuth.setCustomUserClaims(params.id, {
          role: roles[0],
          roles,
          scopes: uniqueScopes,
          orgId,
        });
      } catch (error: any) {
        console.error("Error updating custom claims:", error);
        return NextResponse.json(
          { error: "Failed to update user permissions" },
          { status: 500 }
        );
      }
    }

    // Update Firestore document
    const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      updatedAt: AdminFieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (roles !== undefined) {
      updateData.roles = roles;
      updateData.scopes = uniqueScopes;
    }
    if (status !== undefined) updateData.status = status;

    await userRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // TODO: Verify requesting user has admin.write scope

    // Delete from Firebase Auth
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.deleteUser(params.id);
    } catch (error: any) {
      console.error("Error deleting user from Auth:", error);
      return NextResponse.json(
        { error: "Failed to delete user from authentication" },
        { status: 500 }
      );
    }

    // Delete from Firestore
    try {
      await db.collection(`orgs/${orgId}/users`).doc(params.id).delete();
    } catch (error: any) {
      console.error("Error deleting user document:", error);
      return NextResponse.json(
        { error: "Failed to delete user document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
