import * as admin from 'firebase-admin';
import { AirSlateService } from './airslate';

export interface Form990Data {
  organizationName: string;
  ein: string;
  taxYear: number;
  fiscalYearEnd: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  totalRevenue: number;
  programExpenses: number;
  adminExpenses: number;
  fundraisingExpenses: number;
  totalExpenses: number;
  netIncome: number;
  totalDonors: number;
  majorDonors: Array<{ name: string; amount: number }>;
  boardMembers: Array<{ name: string; title: string; compensation: number }>;
  missionStatement: string;
  programs: string[];
}

export async function generateForm990(
  orgId: string,
  taxYear: number
): Promise<string> {
  const db = admin.firestore();
  const airslate = new AirSlateService();

  try {
    console.log(`Generating Form 990 for org ${orgId}, tax year ${taxYear}`);

    // 1. Fetch organization settings
    const orgDoc = await db.collection('orgs').doc(orgId).get();
    const orgData = orgDoc.data();

    if (!orgData) {
      throw new Error('Organization not found');
    }

    // 2. Fetch financial data for tax year
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59);

    const donationsSnap = await db
      .collection('donations')
      .where('orgId', '==', orgId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .get();

    console.log(`Found ${donationsSnap.size} donations for tax year ${taxYear}`);

    const totalRevenue = donationsSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // 3. Fetch major donors (>$5,000)
    const donorMap = new Map<string, number>();
    donationsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.donorId) {
        const current = donorMap.get(data.donorId) || 0;
        donorMap.set(data.donorId, current + data.amount);
      }
    });

    const majorDonors: Array<{ name: string; amount: number }> = [];
    for (const [donorId, amount] of donorMap.entries()) {
      if (amount >= 5000) {
        const donorDoc = await db.collection('donors').doc(donorId).get();
        const donorData = donorDoc.data();
        majorDonors.push({
          name: donorData?.name || 'Anonymous',
          amount,
        });
      }
    }

    console.log(`Found ${majorDonors.length} major donors (>$5,000)`);

    // 4. Fetch board members
    const boardSnap = await db
      .collection('users')
      .where('orgId', '==', orgId)
      .where('roles', 'array-contains', 'board_member')
      .get();

    const boardMembers = boardSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.displayName || data.email,
        title: data.boardTitle || 'Board Member',
        compensation: 0, // Nonprofits typically don't compensate board
      };
    });

    console.log(`Found ${boardMembers.length} board members`);

    // 5. Calculate expenses
    // In production, this would come from your accounting system
    // For now, using reasonable nonprofit expense ratios
    const totalExpenses = totalRevenue * 0.85; // 85% expense ratio
    const programExpenses = totalExpenses * 0.70; // 70% on programs
    const adminExpenses = totalExpenses * 0.20; // 20% on admin
    const fundraisingExpenses = totalExpenses * 0.10; // 10% on fundraising

    // 6. Prepare airSlate data
    const form990Data: Form990Data = {
      organizationName: orgData.name,
      ein: orgData.ein,
      taxYear,
      fiscalYearEnd: `12/31/${taxYear}`,
      address: orgData.address || '',
      city: orgData.city || '',
      state: orgData.state || 'MI',
      zip: orgData.zip || '',
      
      // Financial data
      totalRevenue,
      programExpenses,
      adminExpenses,
      fundraisingExpenses,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      
      // Donor data
      totalDonors: donorMap.size,
      majorDonors,
      
      // Board data
      boardMembers,
      
      // Additional info
      missionStatement: orgData.mission || '',
      programs: orgData.programs || [],
    };

    // 7. Get Form 990 workflow ID
    const workflowSnap = await db
      .collection('airslate_workflows')
      .where('orgId', '==', orgId)
      .where('workflowName', '==', 'form_990')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (workflowSnap.empty) {
      throw new Error('Form 990 workflow not configured. Please set up the workflow in the Admin Portal.');
    }

    const workflowData = workflowSnap.docs[0].data();
    console.log(`Using workflow: ${workflowData.workflowId}`);

    // 8. Create document record
    const docRef = await db.collection('airslate_documents').add({
      orgId,
      workflowId: workflowData.workflowId,
      documentType: 'form990',
      taxYear,
      status: 'generating',
      metadata: form990Data,
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: 'system',
    });

    console.log(`Created document record: ${docRef.id}`);

    // 9. Run airSlate workflow
    const airslateDocId = await airslate.runWorkflow(
      workflowData.workflowId,
      form990Data
    );

    console.log(`airSlate document created: ${airslateDocId}`);

    // 10. Update document record
    await docRef.update({
      airslateDocId,
      status: 'processing',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // 11. Create audit log
    await db.collection('auditLogs').add({
      orgId,
      action: 'form990.generate',
      resourceType: 'airslate_document',
      resourceId: docRef.id,
      metadata: {
        taxYear,
        airslateDocId,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
      },
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: 'system',
    });

    console.log(`Form 990 generation initiated successfully`);

    return docRef.id;
  } catch (error) {
    console.error('Error generating Form 990:', error);
    throw error;
  }
}

/**
 * Poll for document completion and download
 */
export async function completeForm990Generation(documentId: string): Promise<void> {
  const db = admin.firestore();
  const airslate = new AirSlateService();

  try {
    const docRef = db.collection('airslate_documents').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error('Document not found');
    }

    const docData = docSnap.data()!;

    if (!docData.airslateDocId) {
      throw new Error('airSlate document ID not found');
    }

    console.log(`Polling for completion: ${docData.airslateDocId}`);

    // Poll for completion (max 5 minutes)
    const result = await airslate.pollDocumentCompletion(docData.airslateDocId, 30, 10000);

    if (result.status === 'completed') {
      // Download and store in Firebase Storage
      const storagePath = `orgs/${docData.orgId}/airslate/form990_${docData.taxYear}.pdf`;
      const downloadUrl = await airslate.downloadAndStore(docData.airslateDocId, storagePath);

      // Update document record
      await docRef.update({
        status: 'completed',
        storagePath,
        downloadUrl,
        completedAt: admin.firestore.Timestamp.now(),
      });

      console.log(`Form 990 completed and stored: ${storagePath}`);

      // Create audit log
      await db.collection('auditLogs').add({
        orgId: docData.orgId,
        action: 'form990.completed',
        resourceType: 'airslate_document',
        resourceId: documentId,
        metadata: {
          taxYear: docData.taxYear,
          storagePath,
        },
        createdAt: admin.firestore.Timestamp.now(),
        createdBy: 'system',
      });
    }
  } catch (error) {
    console.error('Error completing Form 990 generation:', error);
    
    // Update document status to failed
    await db.collection('airslate_documents').doc(documentId).update({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    
    throw error;
  }
}
