# 🚀 Firebase CLI Deployment Guide

**Complete step-by-step guide to configure and deploy ADOPT A YOUNG PARENT platform**

---

## 📋 PREREQUISITES

### **Required Tools**
- Node.js 20+ installed
- Firebase CLI installed
- Git installed
- Code editor (VS Code recommended)

### **Firebase Account**
- Firebase account created
- Billing enabled (Blaze plan for Cloud Functions)
- Project created in Firebase Console

---

## 🔧 STEP 1: INSTALL FIREBASE CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version

# Login to Firebase
firebase login
```

---

## 🏗️ STEP 2: INITIALIZE FIREBASE PROJECT

```bash
# Navigate to project directory
cd c:/AYPNFP

# Initialize Firebase (if not already done)
firebase init

# Select the following features:
# ✓ Firestore
# ✓ Functions
# ✓ Hosting
# ✓ Storage
# ✓ Emulators

# Select your existing Firebase project or create new one

# Firestore Setup:
# - Use default firestore.rules
# - Use default firestore.indexes.json

# Functions Setup:
# - Language: TypeScript
# - ESLint: Yes
# - Install dependencies: Yes

# Hosting Setup:
# - Public directory: apps/web/out
# - Single-page app: Yes
# - GitHub auto-deploys: No

# Storage Setup:
# - Use default storage.rules

# Emulators Setup:
# - Select: Authentication, Functions, Firestore, Storage
# - Use default ports
```

---

## 📦 STEP 3: INSTALL DEPENDENCIES

```bash
# Install root dependencies
npm install

# Install Functions dependencies
cd firebase/functions
npm install
cd ../..

# Install Web app dependencies
cd apps/web
npm install
cd ../..
```

---

## ⚙️ STEP 4: CONFIGURE FIREBASE FUNCTIONS

### **Set airSlate Credentials**
```bash
# Using API Password grant type (recommended)
firebase functions:config:set \
  airslate.client_id="b424f954-c331-4754-af4c-86853f1f3006" \
  airslate.client_secret="tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE" \
  airslate.username="tabor.dangelo@gmail.com" \
  airslate.password="YOUR_AIRSLATE_PASSWORD" \
  airslate.organization_id="your_org_id"

# Note: Replace YOUR_AIRSLATE_PASSWORD with your actual airSlate password
```

### **Set Stripe Credentials**
```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..."
```

### **Set Zeffy Credentials**
```bash
firebase functions:config:set \
  zeffy.webhook_secret="your_zeffy_webhook_secret"
```

### **Set SendGrid Credentials** (Optional)
```bash
firebase functions:config:set \
  sendgrid.api_key="SG...."
```

### **Verify Configuration**
```bash
firebase functions:config:get
```

---

## 🗄️ STEP 5: DEPLOY FIRESTORE RULES

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Expected output:
# ✔ Deploy complete!
# ✔ firestore: released rules firestore.rules to cloud.firestore
```

---

## 📊 STEP 6: DEPLOY FIRESTORE INDEXES

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Expected output:
# ✔ Deploy complete!
# ✔ firestore: deployed indexes in firestore.indexes.json successfully
```

---

## 💾 STEP 7: DEPLOY STORAGE RULES

```bash
# Deploy Storage security rules
firebase deploy --only storage

# Expected output:
# ✔ Deploy complete!
# ✔ storage: released rules storage.rules
```

---

## ⚡ STEP 8: BUILD AND DEPLOY FUNCTIONS

```bash
# Build Functions
cd firebase/functions
npm run build

# Deploy all Functions
firebase deploy --only functions

# Or deploy specific functions:
firebase deploy --only functions:generateForm990HTTP
firebase deploy --only functions:processForm990Completion
firebase deploy --only functions:generateFinancialStatements
firebase deploy --only functions:generateBoardPack

# Expected output:
# ✔ functions[generateForm990HTTP(us-central1)] Successful create operation.
# ✔ functions[processForm990Completion(us-central1)] Successful create operation.
# ... (more functions)
```

---

## 🌐 STEP 9: BUILD AND DEPLOY WEB APP

```bash
# Navigate to web app
cd apps/web

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Expected output:
# ✔ hosting[your-project]: file upload complete
# ✔ hosting[your-project]: version finalized
# ✔ hosting[your-project]: release complete
```

---

## 🌱 STEP 10: SEED DATABASE

### **Download Service Account Key**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase/serviceAccountKey.json`
4. **IMPORTANT:** Add to `.gitignore`

### **Run Seed Script**
```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run seed script
npx ts-node firebase/seed-data.ts

# Expected output:
# 🌱 Starting data seeding...
# 📋 Creating organization...
# ✅ Organization created
# 👥 Creating roles...
# ✅ Created 5 roles
# ... (more output)
# 🎉 Data seeding completed successfully!
```

---

## 🔐 STEP 11: CREATE ADMIN USER

### **Via Firebase Console**
1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter email and password
4. Copy the User UID

### **Set Custom Claims**
```bash
# Create a script to set custom claims
# File: firebase/set-admin-claims.ts

import * as admin from 'firebase-admin';
import * as serviceAccount from './serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

async function setAdminClaims(uid: string) {
  await admin.auth().setCustomUserClaims(uid, {
    orgId: 'aayp-main',
    scopes: [
      'admin.read',
      'admin.write',
      'finance.read',
      'finance.write',
      'campaign.read',
      'campaign.write',
      'donor.read',
      'donor.write',
      'hr.read',
      'hr.write',
    ],
  });
  console.log('✅ Admin claims set successfully');
}

// Replace with your user UID
setAdminClaims('YOUR_USER_UID_HERE')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
```

```bash
# Run the script
npx ts-node firebase/set-admin-claims.ts
```

---

## 🧪 STEP 12: TEST WITH EMULATORS

```bash
# Start Firebase Emulators
firebase emulators:start

# Expected output:
# ┌─────────────────────────────────────────────────────────────┐
# │ ✔  All emulators ready! It is now safe to connect your app. │
# │ i  View Emulator UI at http://127.0.0.1:4000                │
# └─────────────────────────────────────────────────────────────┘
#
# ┌────────────────┬────────────────┬─────────────────────────────────┐
# │ Emulator       │ Host:Port      │ View in Emulator UI             │
# ├────────────────┼────────────────┼─────────────────────────────────┤
# │ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
# │ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
# │ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
# │ Storage        │ 127.0.0.1:9199 │ http://127.0.0.1:4000/storage   │
# └────────────────┴────────────────┴─────────────────────────────────┘

# Test your app locally at http://localhost:3000
```

---

## 🔍 STEP 13: VERIFY DEPLOYMENT

### **Check Firestore Rules**
```bash
firebase firestore:rules:list
```

### **Check Functions**
```bash
firebase functions:list
```

### **Check Hosting**
```bash
firebase hosting:sites:list
```

### **View Logs**
```bash
# View all logs
firebase functions:log

# View specific function logs
firebase functions:log --only generateForm990HTTP

# Tail logs in real-time
firebase functions:log --only generateForm990HTTP --tail
```

---

## 🎯 STEP 14: CONFIGURE airSlate WORKFLOWS

### **1. Create airSlate Account**
- Sign up at https://www.airslate.com
- Create organization

### **2. Create Workflows**
1. **Form 990 Workflow**
   - Upload IRS Form 990 template
   - Map data fields
   - Configure automation
   - Copy Workflow ID

2. **Financial Statements Workflow**
   - Upload financial statement templates
   - Map data fields
   - Copy Workflow ID

3. **Board Pack Workflow**
   - Upload board pack template
   - Map data fields
   - Copy Workflow ID

### **3. Get API Credentials**
- Navigate to Settings → API
- Create OAuth client
- Copy Client ID and Client Secret

### **4. Update Firestore**
```bash
# Update workflow IDs in Firestore
# Use Firebase Console or run update script
```

---

## 📝 STEP 15: UPDATE ENVIRONMENT VARIABLES

### **Web App (.env.local)**
```bash
# Create apps/web/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🚀 STEP 16: FULL DEPLOYMENT

```bash
# Deploy everything at once
firebase deploy

# Or deploy selectively:
firebase deploy --only firestore,functions,hosting,storage

# Expected output:
# ✔ Deploy complete!
# 
# Project Console: https://console.firebase.google.com/project/your-project/overview
# Hosting URL: https://your-project.web.app
```

---

## 🔄 STEP 17: CONTINUOUS DEPLOYMENT

### **GitHub Actions (Optional)**
Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm install
          cd firebase/functions && npm install
          cd ../../apps/web && npm install
      
      - name: Build
        run: |
          cd firebase/functions && npm run build
          cd ../../apps/web && npm run build
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### **Generate Firebase Token**
```bash
firebase login:ci

# Copy the token and add to GitHub Secrets as FIREBASE_TOKEN
```

---

## 🧪 TESTING CHECKLIST

- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] Storage rules deployed
- [ ] Functions deployed successfully
- [ ] Web app deployed and accessible
- [ ] Database seeded with initial data
- [ ] Admin user created with custom claims
- [ ] airSlate workflows configured
- [ ] API credentials set
- [ ] Environment variables configured
- [ ] Emulators working locally
- [ ] Production deployment successful
- [ ] Logs accessible and clean

---

## 🔧 TROUBLESHOOTING

### **Functions Deployment Fails**
```bash
# Check Node version
node --version  # Should be 20+

# Rebuild functions
cd firebase/functions
rm -rf node_modules lib
npm install
npm run build

# Deploy again
firebase deploy --only functions
```

### **Firestore Rules Errors**
```bash
# Validate rules
firebase firestore:rules:validate

# Test rules in emulator
firebase emulators:start --only firestore
```

### **Missing Configuration**
```bash
# Check current config
firebase functions:config:get

# Set missing values
firebase functions:config:set key.subkey="value"
```

### **Build Errors**
```bash
# Clear Next.js cache
cd apps/web
rm -rf .next out
npm run build
```

---

## 📞 SUPPORT

### **Firebase Support**
- Documentation: https://firebase.google.com/docs
- Community: https://firebase.google.com/community

### **airSlate Support**
- Documentation: https://docs.airslate.io
- Support: https://www.airslate.com/support

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Test donation flow (Zeffy)
- [ ] Test donation flow (Stripe)
- [ ] Test Form 990 generation
- [ ] Test financial statements
- [ ] Test board pack generation
- [ ] Test user authentication
- [ ] Test RBAC permissions
- [ ] Test all portal pages
- [ ] Test mobile responsiveness
- [ ] Test accessibility (WCAG 2.2 AA)
- [ ] Monitor error logs
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Train users

---

**Status:** Ready for Production Deployment  
**Estimated Time:** 2-3 hours  
**Difficulty:** Intermediate

**Next Steps:** Follow this guide step-by-step to deploy your platform! 🚀
