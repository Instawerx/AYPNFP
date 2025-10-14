import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AirSlateService } from '../services/airslate';

/**
 * Generate board pack
 */
export const generateBoardPack = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  // Check authorization
  const scopes = context.auth.token.scopes || [];
  if (!scopes.includes('finance.write') && !scopes.includes('admin.write')) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Requires finance.write or admin.write scope'
    );
  }

  const { orgId, period } = data;

  // Validate input
  if (!orgId || !period) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'orgId and period are required'
    );
  }

  // Verify user belongs to org
  if (context.auth.token.orgId !== orgId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot generate board pack for different organization'
    );
  }

  const db = admin.firestore();
  const airslate = new AirSlateService();

  try {
    // Get workflow
    const workflowSnap = await db
      .collection('airslate_workflows')
      .where('orgId', '==', orgId)
      .where('workflowName', '==', 'board_pack')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (workflowSnap.empty) {
      throw new Error('Board pack workflow not configured');
    }

    const workflowData = workflowSnap.docs[0].data();

    // Fetch comprehensive data for board pack
    // This would include financial data, program updates, etc.
    const boardPackData = {
      organization_name: (await db.collection('orgs').doc(orgId).get()).data()?.name,
      period,
      generated_date: new Date().toISOString(),
      // Add comprehensive board pack data
    };

    // Create document record
    const docRef = await db.collection('airslate_documents').add({
      orgId,
      workflowId: workflowData.workflowId,
      documentType: 'board_pack',
      period,
      status: 'generating',
      metadata: boardPackData,
      createdAt: admin.firestore.Timestamp.now(),
    });

    // Run workflow
    const airslateDocId = await airslate.runWorkflow(
      workflowData.workflowId,
      boardPackData
    );

    await docRef.update({
      airslateDocId,
      status: 'processing',
    });

    return {
      success: true,
      documentId: docRef.id,
      message: 'Board pack generation started',
    };
  } catch (error: any) {
    console.error('Error generating board pack:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to generate board pack'
    );
  }
});
