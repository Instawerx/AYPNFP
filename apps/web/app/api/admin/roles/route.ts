import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, scopes, orgId } = body;

    // Validation
    if (!name || !scopes || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: "At least one scope is required" },
        { status: 400 }
      );
    }

    // TODO: Verify requesting user has admin.write scope

    // Check if role name already exists
    const existingRoles = await getDocs(
      query(
        collection(db, `orgs/${orgId}/roles`),
        where("name", "==", name)
      )
    );

    if (!existingRoles.empty) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 409 }
      );
    }

    // Create role document
    const roleData = {
      name: name.trim(),
      description: description?.trim() || "",
      scopes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        createdBy: "admin", // TODO: Get from auth context
      },
    };

    const roleRef = await addDoc(
      collection(db, `orgs/${orgId}/roles`),
      roleData
    );

    return NextResponse.json(
      {
        success: true,
        roleId: roleRef.id,
        message: "Role created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List all roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // TODO: Verify requesting user has admin.read scope

    const rolesSnap = await getDocs(collection(db, `orgs/${orgId}/roles`));
    const roles = rolesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ roles });
  } catch (error: any) {
    console.error("Error getting roles:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
