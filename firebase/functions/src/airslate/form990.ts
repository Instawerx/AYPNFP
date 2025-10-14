import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateForm990, completeForm990Generation } from '../services/form990';

/**
 * HTTP endpoint to generate Form 990
 * Requires finance.write scope
 */
export const generateForm990HTTP = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to generate Form 990'
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

  const { orgId, taxYear } = data;

  // Validate input
  if (!orgId || !taxYear) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'orgId and taxYear are required'
    );
  }

  // Verify user belongs to org
  if (context.auth.token.orgId !== orgId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot generate Form 990 for different organization'
    );
  }

  try {
    const documentId = await generateForm990(orgId, taxYear);
    
    // Trigger background processing
    await admin.firestore().collection('_tasks').add({
      type: 'process_form990',
      documentId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return {
      success: true,
      documentId,
      message: 'Form 990 generation started. You will be notified when complete.',
    };
  } catch (error: any) {
    console.error('Error in generateForm990HTTP:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to generate Form 990'
    );
  }
});

/**
 * Background function to process Form 990 completion
 * Triggered by Firestore write to _tasks collection
 */
export const processForm990Completion = functions.firestore
  .document('_tasks/{taskId}')
  .onCreate(async (snap, context) => {
    const task = snap.data();

    if (task.type !== 'process_form990') {
      return null;
    }

    try {
      await completeForm990Generation(task.documentId);
      
      // Mark task as completed
      await snap.ref.update({
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
      });

      console.log(`Form 990 processing completed: ${task.documentId}`);
    } catch (error) {
      console.error('Error processing Form 990:', error);
      
      // Mark task as failed
      await snap.ref.update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: admin.firestore.Timestamp.now(),
      });
    }

    return null;
  });
