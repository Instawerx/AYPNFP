import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, AdminFieldValue } from "@/lib/firebase-admin";

// GET - Get role details
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

    const db = getAdminDb();
    const roleRef = db.collection(`orgs/${orgId}/roles`).doc(params.id);
    const roleDoc = await roleRef.get();

    if (!roleDoc.exists) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const roleData = roleDoc.data();

    return NextResponse.json({
      id: roleDoc.id,
      ...roleData,
    });
  } catch (error: any) {
    console.error("Error getting role:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { name, description, scopes, orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // TODO: Verify requesting user has admin.write scope

    // Get current role data
    const roleRef = db.collection(`orgs/${orgId}/roles`).doc(params.id);
    const roleDoc = await roleRef.get();
    if (!roleDoc.exists) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check if name is being changed and if it conflicts
    const currentData = roleDoc.data();

    if (name && name !== currentData?.name) {
      const existingRoles = await db
        .collection(`orgs/${orgId}/roles`)
        .where("name", "==", name)
        .get();

      if (!existingRoles.empty) {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update role document
    const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      updatedAt: AdminFieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (scopes !== undefined) {
      if (!Array.isArray(scopes) || scopes.length === 0) {
        return NextResponse.json(
          { error: "At least one scope is required" },
          { status: 400 }
        );
      }
      updateData.scopes = scopes;
    }

    await roleRef.update(updateData);

    // If scopes changed, update all users with this role
    if (scopes !== undefined) {
      try {
        const usersSnap = await db.collection(`orgs/${orgId}/users`).get();
        const adminAuth = getAdminAuth();

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.roles?.includes(params.id)) {
            // Recalculate user's aggregated scopes
            const userScopes: string[] = [];
            for (const roleId of userData.roles) {
              const roleData = await db
                .collection(`orgs/${orgId}/roles`)
                .doc(roleId)
                .get();
              if (roleData.exists) {
                const roleScopes = roleData.data()?.scopes || [];
                userScopes.push(...roleScopes);
              }
            }

            const uniqueScopes = [...new Set(userScopes)];

            // Update custom claims
            await adminAuth.setCustomUserClaims(userDoc.id, {
              role: userData.roles[0],
              roles: userData.roles,
              scopes: uniqueScopes,
              orgId,
            });

            // Update Firestore document
            await db.collection(`orgs/${orgId}/users`).doc(userDoc.id).update({
              scopes: uniqueScopes,
              updatedAt: AdminFieldValue.serverTimestamp(),
            });
          }
        }
      } catch (error) {
        console.error("Error updating user claims:", error);
        // Don't fail the request if user updates fail
      }
    }

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
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

    // Check if any users have this role
    const db = getAdminDb();
    const usersSnap = await db.collection(`orgs/${orgId}/users`).get();
    const usersWithRole = usersSnap.docs.filter((doc) =>
      doc.data().roles?.includes(params.id)
    );

    if (usersWithRole.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role: ${usersWithRole.length} user(s) still have this role`,
        },
        { status: 409 }
      );
    }

    // Delete role document
    await db.collection(`orgs/${orgId}/roles`).doc(params.id).delete();

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
