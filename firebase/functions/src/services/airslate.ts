import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const AIRSLATE_API_BASE = 'https://api.airslate.io/v1';

interface AirSlateConfig {
  clientId: string;
  clientSecret: string;
  organizationId: string;
}

interface AccessToken {
  accessToken: string;
  expiresAt: admin.firestore.Timestamp;
}

export class AirSlateService {
  private config: AirSlateConfig;
  private db: admin.firestore.Firestore;

  constructor() {
    const config = functions.config().airslate;
    
    if (!config || !config.client_id || !config.client_secret || !config.organization_id) {
      throw new Error('airSlate configuration missing. Run: firebase functions:config:set airslate.client_id="..." airslate.client_secret="..." airslate.organization_id="..."');
    }

    this.config = {
      clientId: config.client_id,
      clientSecret: config.client_secret,
      organizationId: config.organization_id,
    };
    this.db = admin.firestore();
  }

  /**
   * Get valid access token (cached or new)
   */
  async getAccessToken(): Promise<string> {
    const tokenDoc = await this.db
      .collection('airslate_tokens')
      .doc('current')
      .get();

    if (tokenDoc.exists) {
      const data = tokenDoc.data() as AccessToken;
      const now = admin.firestore.Timestamp.now();
      
      // Token still valid (with 5 min buffer)
      if (data.expiresAt.toMillis() > now.toMillis() + 300000) {
        return data.accessToken;
      }
    }

    // Get new token
    return this.refreshAccessToken();
  }

  /**
   * Get new access token from airSlate using API Password grant
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      // Using API Password grant type (more secure for user-based access)
      const config = functions.config().airslate;
      
      const params = new URLSearchParams();
      params.append('grant_type', 'api_password');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
      params.append('username', config.username);
      params.append('password', config.password);
      params.append('scope', 'openid email profile');

      const response = await axios.post(
        'https://oauth.airslate.com/public/oauth/token',
        params,
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, expires_in } = response.data;
      const expiresAt = admin.firestore.Timestamp.fromMillis(
        Date.now() + expires_in * 1000
      );

      // Cache token
      await this.db.collection('airslate_tokens').doc('current').set({
        accessToken: access_token,
        expiresAt,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      console.log('✅ airSlate token refreshed successfully');
      return access_token;
    } catch (error: any) {
      console.error('❌ Error refreshing airSlate token:', error.response?.data || error);
      throw new Error(`Failed to authenticate with airSlate: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Run a workflow with data
   */
  async runWorkflow(
    workflowId: string,
    data: Record<string, any>
  ): Promise<string> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${AIRSLATE_API_BASE}/workflows/${workflowId}/run`,
        {
          organization_id: this.config.organizationId,
          data,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.document_id;
    } catch (error: any) {
      console.error('Error running airSlate workflow:', error.response?.data || error);
      throw new Error(`Failed to run airSlate workflow: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get document status
   */
  async getDocumentStatus(documentId: string): Promise<{
    status: string;
    downloadUrl?: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${AIRSLATE_API_BASE}/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        status: response.data.status,
        downloadUrl: response.data.download_url,
      };
    } catch (error: any) {
      console.error('Error getting document status:', error.response?.data || error);
      throw new Error('Failed to get document status');
    }
  }

  /**
   * Download document and upload to Firebase Storage
   */
  async downloadAndStore(
    documentId: string,
    storagePath: string
  ): Promise<string> {
    const token = await this.getAccessToken();

    try {
      // Download from airSlate
      const response = await axios.get(
        `${AIRSLATE_API_BASE}/documents/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'arraybuffer',
        }
      );

      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      
      await file.save(Buffer.from(response.data), {
        contentType: 'application/pdf',
        metadata: {
          airslateDocumentId: documentId,
          generatedAt: new Date().toISOString(),
        },
      });

      // Get signed URL (valid for 7 days)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      return url;
    } catch (error: any) {
      console.error('Error downloading/storing document:', error.response?.data || error);
      throw new Error('Failed to download and store document');
    }
  }

  /**
   * Poll document status until completed
   */
  async pollDocumentCompletion(
    documentId: string,
    maxAttempts: number = 30,
    intervalMs: number = 10000
  ): Promise<{ status: string; downloadUrl?: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getDocumentStatus(documentId);
      
      if (result.status === 'completed') {
        return result;
      }
      
      if (result.status === 'failed' || result.status === 'error') {
        throw new Error(`Document generation failed with status: ${result.status}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Document generation timeout - exceeded maximum polling attempts');
  }
}
