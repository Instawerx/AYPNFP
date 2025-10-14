import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AirSlateService } from '../services/airslate';

/**
 * Generate financial statements
 */
export const generateFinancialStatements = functions.https.onCall(async (data, context) => {
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

  const { orgId, period, statementType } = data;

  // Validate input
  if (!orgId || !period || !statementType) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'orgId, period, and statementType are required'
    );
  }

  // Verify user belongs to org
  if (context.auth.token.orgId !== orgId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot generate statements for different organization'
    );
  }

  const db = admin.firestore();
  const airslate = new AirSlateService();

  try {
    // Get workflow
    const workflowSnap = await db
      .collection('airslate_workflows')
      .where('orgId', '==', orgId)
      .where('workflowName', '==', 'financial_statements')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (workflowSnap.empty) {
      throw new Error('Financial statements workflow not configured');
    }

    const workflowData = workflowSnap.docs[0].data();

    // Fetch financial data for period
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const donationsSnap = await db
      .collection('donations')
      .where('orgId', '==', orgId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .get();

    const totalRevenue = donationsSnap.docs.reduce(
      (sum: number, doc: admin.firestore.QueryDocumentSnapshot) => sum + (doc.data().amount || 0),
      0
    );

    // Prepare data
    const financialData = {
      organization_name: (await db.collection('orgs').doc(orgId).get()).data()?.name,
      period,
      statement_type: statementType,
      total_revenue: totalRevenue,
      // Add more financial data as needed
    };

    // Create document record
    const docRef = await db.collection('airslate_documents').add({
      orgId,
      workflowId: workflowData.workflowId,
      documentType: 'financial_statement',
      period,
      status: 'generating',
      metadata: financialData,
      createdAt: admin.firestore.Timestamp.now(),
    });

    // Run workflow
    const airslateDocId = await airslate.runWorkflow(
      workflowData.workflowId,
      financialData
    );

    await docRef.update({
      airslateDocId,
      status: 'processing',
    });

    return {
      success: true,
      documentId: docRef.id,
      message: 'Financial statement generation started',
    };
  } catch (error: any) {
    console.error('Error generating financial statements:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to generate financial statements'
    );
  }
});
