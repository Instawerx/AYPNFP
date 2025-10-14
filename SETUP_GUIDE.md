# 🚀 SETUP GUIDE - ADOPT A YOUNG PARENT

Complete step-by-step guide to get the platform running.

---

## Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Firebase CLI** - Install: `npm install -g firebase-tools`
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** - VS Code, Cursor, or Windsurf recommended

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Projects

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create three projects:
   - `adopt-a-young-parent-dev` (Development)
   - `adopt-a-young-parent-staging` (Staging)
   - `adopt-a-young-parent` (Production)

### 1.2 Enable Firebase Services

For each project, enable:

- **Authentication**
  - Email/Password
  - Google
  - Apple (requires Apple Developer account)
  - Microsoft
  
- **Firestore Database**
  - Start in production mode (we'll deploy rules)
  
- **Cloud Functions**
  - Upgrade to Blaze plan (pay-as-you-go)
  
- **Cloud Storage**
  - Default bucket
  
- **Hosting**
  - Enable hosting
  
- **Cloud Messaging (FCM)**
  - Enable FCM
  - Generate VAPID key (Project Settings → Cloud Messaging → Web Push certificates)

### 1.3 Get Firebase Configuration

1. Go to Project Settings → General
2. Scroll to "Your apps"
3. Click "Add app" → Web
4. Copy the configuration object

---

## Step 2: Local Environment Setup

### 2.1 Clone Repository

```bash
git clone <repository-url>
cd adopt-a-young-parent
```

### 2.2 Install Dependencies

```bash
# Install Functions dependencies
cd firebase/functions
npm install

# Install Web app dependencies
cd ../../apps/web
npm install
```

### 2.3 Configure Environment Variables

Create `apps/web/.env.local`:

```env
# Firebase Configuration (from Step 1.3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDWmfX1jYaIsFUucmyno6EBjdZNFTh6k_0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=adopt-a-young-parent.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=adopt-a-young-parent
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=adopt-a-young-parent.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=499950524793
NEXT_PUBLIC_FIREBASE_APP_ID=1:499950524793:web:9016b05e3aa3cc795277a8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FGJDKEK435

# FCM VAPID Key (from Step 1.2)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_vapid_public_key>

# Organization
NEXT_PUBLIC_ORG_ID=aayp-prod
NEXT_PUBLIC_ORG_NAME=ADOPT A YOUNG PARENT

# Zeffy (get from Zeffy dashboard)
NEXT_PUBLIC_ZEFFY_FORM_ID=<your_zeffy_form_id>

# Stripe (get from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Environment
NEXT_PUBLIC_ENV=development
```

---

## Step 3: Firebase Initialization

### 3.1 Login to Firebase

```bash
firebase login
```

### 3.2 Initialize Firebase

```bash
cd firebase
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting
- ✅ Storage
- ✅ Emulators

Use existing files when prompted.

### 3.3 Set Firebase Project Aliases

```bash
firebase use --add

# Select adopt-a-young-parent-dev and alias as "dev"
# Repeat for staging and prod
```

### 3.4 Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes --project dev
```

### 3.5 Set Function Secrets

```bash
# Stripe secrets
firebase functions:secrets:set STRIPE_SECRET_KEY --project dev
# Enter: sk_test_xxxxx

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project dev
# Enter: whsec_xxxxx

# Zeffy secret
firebase functions:secrets:set ZEFFY_WEBHOOK_SECRET --project dev
# Enter: <your_zeffy_webhook_secret>

# Organization config
firebase functions:secrets:set DEFAULT_ORG_ID --project dev
# Enter: aayp-prod

firebase functions:secrets:set ORG_EIN --project dev
# Enter: <your_ein_when_available>
```

---

## Step 4: Seed Initial Data

### 4.1 Update Seed Data

Edit `infra/seed/initial-org.json` and update:
- EIN (when available)
- Legal address
- Contact information
- Logo URLs
- Zeffy Form ID
- Stripe keys

### 4.2 Create Seed Script

Create `infra/seed/seed.ts`:

```typescript
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const serviceAccount = require("./service-account-dev.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedOrg() {
  const dataPath = path.join(__dirname, "initial-org.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const orgId = "aayp-prod";

  console.log("Seeding organization data...");

  // Create org settings
  await db
    .collection("orgs")
    .doc(orgId)
    .collection("settings")
    .doc("general")
    .set(data.org);

  console.log("✅ Org settings created");

  // Create roles
  for (const role of data.roles) {
    await db
      .collection("orgs")
      .doc(orgId)
      .collection("roles")
      .doc(role.id)
      .set(role);
    console.log(`✅ Role created: ${role.name}`);
  }

  console.log("\n🎉 Seeding complete!");
  process.exit(0);
}

seedOrg().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});
```

### 4.3 Download Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `infra/seed/service-account-dev.json`
4. **⚠️ NEVER commit this file to Git!**

### 4.4 Run Seed Script

```bash
cd infra/seed
npm install firebase-admin
npx ts-node seed.ts
```

---

## Step 5: Create Admin User

### 5.1 Create Admin Script

Create `infra/seed/create-admin.ts`:

```typescript
import * as admin from "firebase-admin";

const serviceAccount = require("./service-account-dev.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function createAdmin(email: string, password: string) {
  try {
    const user = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    await admin.auth().setCustomUserClaims(user.uid, {
      orgId: "aayp-prod",
      scopes: [
        "admin.read",
        "admin.write",
        "crm.read",
        "crm.write",
        "donor.read",
        "donor.write",
        "campaign.read",
        "campaign.write",
        "finance.read",
        "finance.write",
        "hr.read",
        "hr.write",
      ],
      isFunction: false,
    });

    console.log(`✅ Admin user created: ${email}`);
    console.log(`⚠️  Password: ${password}`);
    console.log(`⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN`);
  } catch (error) {
    console.error("Error creating admin:", error);
  }

  process.exit(0);
}

const email = process.argv[2] || "admin@adoptayoungparent.org";
const password = process.argv[3] || "ChangeMe123!";

createAdmin(email, password);
```

### 5.2 Run Admin Script

```bash
cd infra/seed
npx ts-node create-admin.ts admin@adoptayoungparent.org SecurePassword123!
```

---

## Step 6: Local Development

### 6.1 Start Firebase Emulators

```bash
cd firebase
firebase emulators:start
```

This starts:
- Auth Emulator: http://localhost:9099
- Functions Emulator: http://localhost:5001
- Firestore Emulator: http://localhost:8080
- Hosting Emulator: http://localhost:5000
- Emulator UI: http://localhost:4000

### 6.2 Start Next.js Dev Server

In a new terminal:

```bash
cd apps/web
npm run dev
```

Visit: http://localhost:3000

---

## Step 7: Payment Integration

### 7.1 Zeffy Setup

1. Create account at [Zeffy](https://www.zeffy.com/)
2. Create donation form
3. Copy Form ID
4. Add to `.env.local` as `NEXT_PUBLIC_ZEFFY_FORM_ID`
5. Configure webhook:
   - URL: `https://YOUR_DOMAIN/zeffyWebhook`
   - Add webhook secret to Firebase secrets

### 7.2 Stripe Setup

1. Create account at [Stripe](https://stripe.com/)
2. Get API keys from Dashboard
3. Add to `.env.local` and Firebase secrets
4. Configure webhook:
   - URL: `https://YOUR_DOMAIN/stripeWebhook`
   - Event: `checkout.session.completed`
   - Add signing secret to Firebase secrets

---

## Step 8: Deploy to Production

### 8.1 Build Next.js App

```bash
cd apps/web
npm run build
```

### 8.2 Deploy to Firebase

```bash
cd ../../firebase
firebase deploy --project prod
```

Or deploy incrementally:

```bash
# Deploy hosting only
firebase deploy --only hosting --project prod

# Deploy functions only
firebase deploy --only functions --project prod

# Deploy rules only
firebase deploy --only firestore:rules,storage:rules --project prod
```

---

## Step 9: Configure Custom Domain

### 9.1 Add Domain in Firebase

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `adoptayoungparent.org`)
4. Follow DNS configuration instructions

### 9.2 Update DNS Records

Add the provided DNS records to your domain registrar.

---

## Step 10: Post-Deployment

### 10.1 Test Donation Flow

1. Make test donation via Zeffy
2. Verify donation appears in Firestore
3. Verify receipt is generated
4. Verify FCM notification (if enabled)

### 10.2 Configure Monitoring

1. Set up Firebase Alerts
2. Configure error reporting
3. Set up uptime monitoring

### 10.3 Security Review

- ✅ Firestore Rules deployed
- ✅ Storage Rules deployed
- ✅ Webhook secrets configured
- ✅ HTTPS enforced
- ✅ CSP headers configured

---

## Troubleshooting

### Functions Won't Deploy

```bash
# Check Node version
node --version  # Should be 20+

# Rebuild functions
cd firebase/functions
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firestore Permission Denied

- Verify rules are deployed: `firebase deploy --only firestore:rules`
- Check user has correct custom claims
- Verify orgId matches in claims and documents

### FCM Not Working

- Verify VAPID key is correct
- Check browser console for errors
- Ensure service worker is registered
- Verify notification permission granted

---

## Next Steps

1. ✅ Complete remaining portal pages (see WINDSURF_PROMPT.md)
2. ✅ Build public pages (mission, programs, etc.)
3. ✅ Implement mini-game
4. ✅ Add email service (SendGrid, Postmark)
5. ✅ Set up analytics dashboards (Looker Studio)
6. ✅ Write E2E tests (Playwright)
7. ✅ Launch! 🚀

---

## Support

For questions or issues:
- Check [PROJECT_TRACKER.md](./PROJECT_TRACKER.md)
- Review [WINDSURF_PROMPT.md](./WINDSURF_PROMPT.md)
- Contact: support@adoptayoungparent.org
