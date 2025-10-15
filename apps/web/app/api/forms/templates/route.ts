import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, AdminFieldValue } from "@/lib/firebase-admin";
import { getAirSlateClient } from "@/lib/airslate";

// GET - List all form templates
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const syncWithAirSlate = searchParams.get("sync") === "true";

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // TODO: Verify requesting user has forms.read scope

    // If sync requested, fetch from airSlate and update Firestore
    if (syncWithAirSlate) {
      try {
        const airslateClient = getAirSlateClient();
        const airslateTemplates = await airslateClient.getTemplates();

        // Update Firestore with latest templates
        for (const template of airslateTemplates) {
          const templatesCollection = db.collection(`orgs/${orgId}/formTemplates`);
          const templatesSnap = await templatesCollection
            .where("airslateTemplateId", "==", template.id)
            .limit(1)
            .get();

          if (templatesSnap.empty) {
            await templatesCollection.add({
              name: template.name,
              description: template.description || "",
              category: "other",
              airslateTemplateId: template.id,
              fields: template.fields,
              routingRules: {
                submitTo: ["admin"],
                notifyEmails: [],
                requireApproval: false,
                approvers: [],
              },
              metadata: {
                createdAt: AdminFieldValue.serverTimestamp(),
                updatedAt: AdminFieldValue.serverTimestamp(),
                lastSyncedAt: AdminFieldValue.serverTimestamp(),
                useCount: 0,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error syncing with airSlate:", error);
        // Continue to return local templates even if sync fails
      }
    }

    // Get templates from Firestore
    const templatesSnap = await db
      .collection(`orgs/${orgId}/formTemplates`)
      .orderBy("metadata.createdAt", "desc")
      .get();

    const templates = templatesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Error getting templates:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new form template
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      name,
      description,
      category,
      airslateTemplateId,
      fields,
      routingRules,
      orgId,
    } = body;

    if (!name || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Verify requesting user has forms.write scope

    const templatesCollection = db.collection(`orgs/${orgId}/formTemplates`);

    const templateData = {
      name,
      description: description || "",
      category: category || "other",
      airslateTemplateId: airslateTemplateId || null,
      fields: fields || [],
      routingRules: routingRules || {
        submitTo: ["admin"],
        notifyEmails: [],
        requireApproval: false,
        approvers: [],
      },
      metadata: {
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
        createdBy: "admin", // TODO: Get from auth context
        lastSyncedAt: airslateTemplateId ? AdminFieldValue.serverTimestamp() : null,
        useCount: 0,
      },
    };

    const templateRef = await templatesCollection.add(templateData);

    return NextResponse.json(
      {
        success: true,
        templateId: templateRef.id,
        message: "Template created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
