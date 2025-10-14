# 🚀 WINDSURF/CURSOR BUILD PROMPT

**Copy and paste this into Windsurf or Cursor to continue the build:**

---

## PROJECT CONTEXT

You are building **ADOPT A YOUNG PARENT**, a Michigan nonprofit management platform.

**Organization Details:**
- Name: ADOPT A YOUNG PARENT
- Jurisdiction: Michigan, USA
- State Entity ID: 803297893
- Filing Effective: November 19, 2024
- Filing Number: 224860800370

**Tech Stack:**
- Frontend: Next.js 14 + React + TypeScript + Tailwind + shadcn/ui
- Backend: Firebase (Auth, Firestore, Functions, Storage, Hosting, FCM)
- Payments: Zeffy (primary) + Stripe (fallback)
- Analytics: GA4 → BigQuery → Looker Studio

---

## CURRENT STATUS

✅ **Completed:**
- Project structure scaffolded
- Firebase Functions (webhooks, services, auth)
- Firestore security rules (deny-by-default, RBAC)
- Firestore indexes
- Next.js app structure
- Public homepage
- Donate page (Zeffy widget)
- Donor portal (basic)
- Receipt API route
- FCM client library
- Firebase service worker
- CI/CD workflow (GitHub Actions)
- Seed data (org settings, roles)

---

## NEXT STEPS (PRIORITY ORDER)

### 1. **Complete Firebase Setup**
```bash
# Initialize Firebase in the project
cd firebase
firebase init

# Select:
# - Firestore (use existing rules and indexes)
# - Functions (use existing source)
# - Hosting (use ../apps/web/out)
# - Storage (use existing rules)

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Set secrets for Functions
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set ZEFFY_WEBHOOK_SECRET
firebase functions:secrets:set DEFAULT_ORG_ID
firebase functions:secrets:set ORG_EIN
```

### 2. **Seed Initial Organization Data**
Create a script to populate Firestore with initial org settings and roles from `infra/seed/initial-org.json`.

**File to create:** `infra/seed/seed.ts`

```typescript
import * as admin from "firebase-admin";
import * as fs from "fs";

admin.initializeApp();
const db = admin.firestore();

async function seedOrg() {
  const data = JSON.parse(fs.readFileSync("./initial-org.json", "utf8"));
  const orgId = "aayp-prod";

  // Create org settings
  await db.collection("orgs").doc(orgId).collection("settings").doc("general").set(data.org);

  // Create roles
  for (const role of data.roles) {
    await db.collection("orgs").doc(orgId).collection("roles").doc(role.id).set(role);
  }

  console.log("✅ Org seeded successfully");
}

seedOrg();
```

Run: `ts-node infra/seed/seed.ts`

### 3. **Create Admin User**
Create a script to set up the first admin user with full permissions.

**File to create:** `infra/seed/create-admin.ts`

```typescript
import * as admin from "firebase-admin";
import { setUserClaims } from "../../firebase/functions/src/auth/claims";

admin.initializeApp();

async function createAdmin(email: string) {
  const user = await admin.auth().createUser({ email, password: "CHANGE_ME" });
  await setUserClaims(user.uid, "aayp-prod", [
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
  ]);
  console.log(`✅ Admin user created: ${email}`);
  console.log(`⚠️ Password: CHANGE_ME (change immediately)`);
}

createAdmin("admin@adoptayoungparent.org");
```

### 4. **Build Remaining Portal Pages**

**Files to create:**

- `apps/web/app/portal/admin/page.tsx` - Admin portal (org settings, RBAC)
- `apps/web/app/portal/manager/page.tsx` - Manager portal (campaigns, teams)
- `apps/web/app/portal/fundraiser/page.tsx` - Fundraiser portal (tasks, donors)
- `apps/web/app/portal/finance/page.tsx` - Finance portal (settlements, reports)
- `apps/web/app/portal/employee/page.tsx` - Employee portal (HR, onboarding)

**Use the donor portal (`apps/web/app/portal/donor/page.tsx`) as a template.**

### 5. **Build Public Pages**

**Files to create:**

- `apps/web/app/(public)/mission/page.tsx`
- `apps/web/app/(public)/programs/page.tsx`
- `apps/web/app/(public)/impact/page.tsx`
- `apps/web/app/(public)/events/page.tsx`
- `apps/web/app/(public)/transparency/page.tsx`
- `apps/web/app/(public)/contact/page.tsx`

**Requirements:**
- Mobile-responsive
- WCAG 2.2 AA compliant
- SEO optimized (metadata, structured data)
- Michigan disclosure in footer

### 6. **Build Mini-Game (Skill-Only Runner)**

**File to create:** `apps/web/app/games/runner/page.tsx`

**Requirements:**
- Canvas-based game engine
- Skill-only mechanics (no chance)
- Leaderboard by fundraiser team
- Donation prompt after game
- Anti-cheat validation
- Accessibility (keyboard controls, motion-reduced variant)

### 7. **Implement Authentication UI**

**Files to create:**

- `apps/web/app/login/page.tsx` - Login page
- `apps/web/app/signup/page.tsx` - Signup page
- `apps/web/components/auth/AuthProvider.tsx` - Auth context
- `apps/web/components/auth/ProtectedRoute.tsx` - Route guard

**Providers to support:**
- Email/password
- Google
- Apple
- Microsoft

### 8. **Build shadcn/ui Components**

Install shadcn/ui components as needed:

```bash
cd apps/web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

### 9. **Configure Webhooks**

**Zeffy:**
1. Log into Zeffy dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://YOUR_DOMAIN/zeffyWebhook`
4. Copy webhook secret and add to Firebase secrets

**Stripe:**
1. Log into Stripe dashboard
2. Go to Developers → Webhooks
3. Add endpoint: `https://YOUR_DOMAIN/stripeWebhook`
4. Select event: `checkout.session.completed`
5. Copy signing secret and add to Firebase secrets

### 10. **Test Donation Flow**

**End-to-end test:**
1. Make test donation via Zeffy
2. Verify donation document created in Firestore
3. Verify receipt document created
4. Verify FCM push sent (if donor consented)
5. Verify receipt downloadable from donor portal

**Test with Stripe:**
1. Make test donation via Stripe Checkout
2. Verify same flow as Zeffy

### 11. **Deploy to Firebase**

```bash
# Build Next.js app
cd apps/web
npm run build

# Deploy everything
cd ../../firebase
firebase deploy --project prod

# Or deploy incrementally
firebase deploy --only hosting --project prod
firebase deploy --only functions --project prod
firebase deploy --only firestore:rules --project prod
```

---

## CRITICAL REQUIREMENTS

### Security
- ✅ Firestore Rules: deny-by-default
- ✅ RBAC: Custom claims with scopes
- ✅ Org isolation: All queries filtered by orgId
- ✅ Audit logs: Immutable, append-only
- ✅ Webhook verification: Signature validation
- ⚠️ PII redaction: Never log sensitive data

### Compliance
- ✅ IRS Pub. 1771: Receipt language
- ✅ Michigan disclosure: On receipts and site
- ✅ WCAG 2.2 AA: Accessibility
- ✅ Skill-only games: No chance mechanics

### Performance
- Target: Lighthouse score > 90
- Target: TTI < 3s
- Target: FCP < 1.5s

---

## USEFUL COMMANDS

```bash
# Start local development
cd apps/web && npm run dev

# Start Firebase emulators
cd firebase && firebase emulators:start

# Run tests
cd apps/web && npm test
cd firebase/functions && npm test

# Deploy to staging
firebase use staging && firebase deploy

# Deploy to production
firebase use prod && firebase deploy
```

---

## DOCUMENTATION REFERENCES

- [PROJECT_TRACKER.md](./PROJECT_TRACKER.md) - Detailed sprint plan
- [README.md](./README.md) - Project overview
- [firebase/firestore.rules](./firebase/firestore.rules) - Security rules
- [firebase/firestore.indexes.json](./firebase/firestore.indexes.json) - Database indexes

---

## QUESTIONS TO RESOLVE

1. **EIN:** What is the organization's EIN? (Update in seed data)
2. **Legal Address:** What is the legal address? (Update in seed data)
3. **Logo:** Where is the logo hosted? (Update in seed data)
4. **Zeffy Form ID:** What is the Zeffy form ID? (Update in .env)
5. **Domain:** What is the production domain? (Configure in Firebase Hosting)

---

**Ready to build! Start with Step 1 (Firebase Setup) and work through the list sequentially.**
