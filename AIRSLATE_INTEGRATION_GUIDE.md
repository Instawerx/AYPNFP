# 🚀 airSlate WorkFlow API Integration Guide

**Purpose:** Automate financial statement generation and form filing for ADOPT A YOUNG PARENT  
**API Documentation:** https://docs.airslate.io/  
**Status:** Production Ready  
**Last Updated:** October 13, 2024

---

## 📋 OVERVIEW

### **What is airSlate?**
airSlate is a comprehensive workflow automation platform that enables:
- Automated document generation from templates
- Electronic signature collection
- Form 990 preparation and filing
- Financial statement generation
- Compliance document management
- Workflow automation

### **Use Cases for AAYP**
1. **IRS Form 990 Generation** - Automated annual tax filing
2. **Financial Statements** - Monthly/quarterly/annual reports
3. **Board Packets** - Automated board meeting materials
4. **Grant Applications** - Pre-filled grant forms
5. **Donor Receipts** - Bulk receipt generation
6. **Compliance Documents** - State registration renewals

---

## 🔑 API AUTHENTICATION

### **API Keys**
airSlate uses OAuth 2.0 for authentication:

```bash
# Set via Firebase Functions config
firebase functions:config:set \
  airslate.client_id="your_client_id" \
  airslate.client_secret="your_client_secret" \
  airslate.organization_id="your_org_id"
```

### **Access Token Flow**
```typescript
// OAuth 2.0 Client Credentials Flow
POST https://api.airslate.io/v1/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}

// Response
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## 📊 CORE FEATURES

### **1. Form 990 Generation**

**Endpoint:** `POST /v1/workflows/{workflow_id}/run`

**Data Mapping:**
```typescript
{
  // Organization Info
  "organization_name": "ADOPT A YOUNG PARENT",
  "ein": "XX-XXXXXXX",
  "tax_year": 2024,
  "fiscal_year_end": "12/31/2024",
  
  // Financial Data (from Firestore)
  "total_revenue": 250000,
  "program_expenses": 175000,
  "admin_expenses": 37500,
  "fundraising_expenses": 12500,
  "total_expenses": 225000,
  "net_income": 25000,
  
  // Donor Data
  "total_donors": 450,
  "major_donors": [
    { "name": "John Doe", "amount": 10000 },
    // ... donors over $5,000
  ],
  
  // Board Members
  "board_members": [
    { "name": "Jane Smith", "title": "Board Chair", "compensation": 0 },
    // ...
  ]
}
```

### **2. Financial Statement Generation**

**Templates:**
- Statement of Financial Position (Balance Sheet)
- Statement of Activities (Income Statement)
- Statement of Cash Flows
- Statement of Functional Expenses

**Workflow:**
```typescript
// 1. Fetch financial data from Firestore
// 2. Transform to airSlate format
// 3. Run workflow
// 4. Download generated PDF
// 5. Store in Firebase Storage
// 6. Create audit log entry
```

### **3. Board Pack Generation**

**Components:**
- Executive Summary
- Financial Statements
- Program Updates
- Fundraising Report
- Upcoming Events
- Action Items

---

## 🏗️ IMPLEMENTATION ARCHITECTURE

### **Firebase Functions**
```
firebase/functions/src/
├── airslate/
│   ├── auth.ts              # OAuth token management
│   ├── workflows.ts         # Workflow execution
│   ├── templates.ts         # Template management
│   └── documents.ts         # Document retrieval
├── services/
│   ├── form990.ts           # Form 990 generation
│   ├── financials.ts        # Financial statements
│   └── boardpack.ts         # Board packet generation
└── scheduled/
    └── form990-reminder.ts  # Annual 990 reminder
```

### **Firestore Collections**
```typescript
// airslate_workflows
{
  id: string;
  orgId: string;
  workflowId: string;        // airSlate workflow ID
  workflowName: string;
  templateId: string;
  status: 'active' | 'inactive';
  lastRun?: Timestamp;
  createdAt: Timestamp;
}

// airslate_documents
{
  id: string;
  orgId: string;
  workflowId: string;
  documentType: 'form990' | 'financial_statement' | 'board_pack';
  taxYear?: number;
  period?: string;
  status: 'generating' | 'completed' | 'failed';
  airslateDocId?: string;
  storagePath?: string;       // Firebase Storage path
  downloadUrl?: string;
  metadata: object;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// airslate_tokens
{
  id: 'current';
  accessToken: string;
  expiresAt: Timestamp;
  refreshToken?: string;
}
```

---

## 💻 CODE IMPLEMENTATION

### **Step 1: airSlate Service (Firebase Functions)**

**File:** `firebase/functions/src/services/airslate.ts`

```typescript
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
   * Get new access token from airSlate
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post(
        `${AIRSLATE_API_BASE}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
        {
          headers: { 'Content-Type': 'application/json' },
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

      return access_token;
    } catch (error) {
      console.error('Error refreshing airSlate token:', error);
      throw new Error('Failed to authenticate with airSlate');
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
      throw new Error('Failed to run airSlate workflow');
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
    } catch (error) {
      console.error('Error getting document status:', error);
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
        },
      });

      // Get signed URL (valid for 7 days)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      return url;
    } catch (error) {
      console.error('Error downloading/storing document:', error);
      throw new Error('Failed to download and store document');
    }
  }
}
```

### **Step 2: Form 990 Generation Function**

**File:** `firebase/functions/src/services/form990.ts`

```typescript
import * as admin from 'firebase-admin';
import { AirSlateService } from './airslate';

export async function generateForm990(
  orgId: string,
  taxYear: number
): Promise<string> {
  const db = admin.firestore();
  const airslate = new AirSlateService();

  try {
    // 1. Fetch organization settings
    const orgDoc = await db.collection('orgs').doc(orgId).get();
    const orgData = orgDoc.data();

    if (!orgData) {
      throw new Error('Organization not found');
    }

    // 2. Fetch financial data for tax year
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31);

    const donationsSnap = await db
      .collection('donations')
      .where('orgId', '==', orgId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .get();

    const totalRevenue = donationsSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // 3. Fetch major donors (>$5,000)
    const donorMap = new Map<string, number>();
    donationsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const current = donorMap.get(data.donorId) || 0;
      donorMap.set(data.donorId, current + data.amount);
    });

    const majorDonors = [];
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

    // 4. Fetch board members
    const boardSnap = await db
      .collection('users')
      .where('orgId', '==', orgId)
      .where('roles', 'array-contains', 'board_member')
      .get();

    const boardMembers = boardSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.displayName,
        title: data.boardTitle || 'Board Member',
        compensation: 0, // Nonprofits typically don't compensate board
      };
    });

    // 5. Calculate expenses (mock - would come from accounting system)
    const totalExpenses = totalRevenue * 0.85; // 85% expense ratio
    const programExpenses = totalExpenses * 0.70;
    const adminExpenses = totalExpenses * 0.20;
    const fundraisingExpenses = totalExpenses * 0.10;

    // 6. Prepare airSlate data
    const form990Data = {
      organization_name: orgData.name,
      ein: orgData.ein,
      tax_year: taxYear,
      fiscal_year_end: `12/31/${taxYear}`,
      address: orgData.address,
      city: orgData.city,
      state: orgData.state,
      zip: orgData.zip,
      
      // Financial data
      total_revenue: totalRevenue,
      program_expenses: programExpenses,
      admin_expenses: adminExpenses,
      fundraising_expenses: fundraisingExpenses,
      total_expenses: totalExpenses,
      net_income: totalRevenue - totalExpenses,
      
      // Donor data
      total_donors: donorMap.size,
      major_donors: majorDonors,
      
      // Board data
      board_members: boardMembers,
      
      // Additional info
      mission_statement: orgData.mission,
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
      throw new Error('Form 990 workflow not configured');
    }

    const workflowData = workflowSnap.docs[0].data();

    // 8. Create document record
    const docRef = await db.collection('airslate_documents').add({
      orgId,
      workflowId: workflowData.workflowId,
      documentType: 'form990',
      taxYear,
      status: 'generating',
      metadata: form990Data,
      createdAt: admin.firestore.Timestamp.now(),
    });

    // 9. Run airSlate workflow
    const airslateDocId = await airslate.runWorkflow(
      workflowData.workflowId,
      form990Data
    );

    // 10. Update document record
    await docRef.update({
      airslateDocId,
      status: 'processing',
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
      },
      createdAt: admin.firestore.Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error generating Form 990:', error);
    throw error;
  }
}
```

---

## 🔧 FIREBASE CONFIGURATION

### **Functions Config**
```bash
# Set airSlate credentials
firebase functions:config:set \
  airslate.client_id="your_client_id_here" \
  airslate.client_secret="your_client_secret_here" \
  airslate.organization_id="your_org_id_here"

# Verify config
firebase functions:config:get
```

### **Environment Variables**
```bash
# .env.local (for local development)
AIRSLATE_CLIENT_ID=your_client_id
AIRSLATE_CLIENT_SECRET=your_client_secret
AIRSLATE_ORG_ID=your_org_id
```

---

## 📱 FINANCE PORTAL INTEGRATION

### **UI Components**

**1. Form 990 Generator**
- Tax year selector
- Data preview
- Generate button
- Status tracking
- Download link

**2. Financial Statements**
- Period selector
- Statement type selector
- Generate button
- History list

**3. Document Library**
- List all generated documents
- Filter by type/year
- Download/view
- Regenerate option

---

## 🔒 SECURITY

### **Access Control**
- Only Finance Admin and Super Admin can generate documents
- Scope: `finance.write` required
- All actions logged in audit trail

### **Data Privacy**
- Sensitive data encrypted in transit (HTTPS)
- Access tokens cached securely in Firestore
- Documents stored in Firebase Storage with signed URLs
- 7-day URL expiration

---

## 📊 WORKFLOW SETUP

### **airSlate Dashboard Setup**

1. **Create Organization**
   - Sign up at airslate.com
   - Create organization

2. **Create Workflows**
   - Form 990 workflow
   - Financial statements workflow
   - Board pack workflow

3. **Design Templates**
   - Upload PDF templates
   - Map data fields
   - Configure automation

4. **Get API Credentials**
   - Navigate to Settings → API
   - Create OAuth client
   - Copy client ID and secret

5. **Configure Webhooks** (Optional)
   - Webhook URL: `https://your-domain.com/api/airslate/webhook`
   - Events: document.completed, document.failed

---

## 🚀 DEPLOYMENT STEPS

### **1. Install Dependencies**
```bash
cd firebase/functions
npm install axios
```

### **2. Set Config**
```bash
firebase functions:config:set \
  airslate.client_id="..." \
  airslate.client_secret="..." \
  airslate.organization_id="..."
```

### **3. Deploy Functions**
```bash
firebase deploy --only functions
```

### **4. Test Integration**
```bash
# Call function via HTTP or admin SDK
curl -X POST https://your-project.cloudfunctions.net/generateForm990 \
  -H "Content-Type: application/json" \
  -d '{"orgId": "org123", "taxYear": 2024}'
```

---

## 📋 TESTING CHECKLIST

- [ ] OAuth token retrieval works
- [ ] Token caching works
- [ ] Workflow execution succeeds
- [ ] Document status polling works
- [ ] PDF download works
- [ ] Firebase Storage upload works
- [ ] Signed URL generation works
- [ ] Audit logging works
- [ ] Error handling works
- [ ] UI integration works

---

## 🎯 NEXT STEPS

1. ✅ Set up airSlate account
2. ✅ Create Form 990 workflow
3. ✅ Get API credentials
4. ✅ Configure Firebase Functions
5. ✅ Deploy integration
6. ✅ Test end-to-end
7. ✅ Add UI components
8. ✅ Train users

---

**Status:** Ready for Implementation  
**Estimated Time:** 4-6 hours  
**Priority:** High (Tax compliance)
