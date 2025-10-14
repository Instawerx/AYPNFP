# ADOPT A YOUNG PARENT - Nonprofit Management Platform

**Mission:** Empowering young parents through comprehensive support and community engagement.

**Organization:** ADOPT A YOUNG PARENT  
**Jurisdiction:** Michigan, USA  
**State Entity ID:** 803297893  
**Filing Effective:** November 19, 2024

---

## 🎯 Platform Overview

AAA-level nonprofit website and management system featuring:

- **Public Website:** Mission, programs, impact stories, events, transparency
- **Donor Portal:** Donation history, receipts, recurring management, consents
- **Fundraiser Portal:** Donor assignments, tasks, notifications, leaderboards
- **Manager Portal:** Campaign management, team performance, analytics
- **Finance Portal:** Settlements, reconciliation, 990 exports, reporting
- **Admin Portal:** Org settings, RBAC, integrations, audit logs
- **HR/Employee Portal:** Onboarding, document vault, training
- **Mini-Games:** Skill-based fundraising experiences

---

## 🏗️ Architecture

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion

**Backend:**
- Firebase Auth (Email, Google, Apple, Microsoft)
- Cloud Firestore (database)
- Cloud Functions (Node 20)
- Cloud Storage
- Firebase Hosting
- Firebase Cloud Messaging (FCM)

**Payments:**
- Zeffy (primary, fee-free)
- Stripe Checkout (fallback)

**Analytics:**
- Google Analytics 4
- BigQuery export
- Looker Studio dashboards

**Testing:**
- Vitest (unit tests)
- Playwright (E2E tests)
- GitHub Actions (CI/CD)

---

## 📁 Repository Structure

```
adopt-a-young-parent/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/
│       │   ├── (public)/       # Public pages
│       │   ├── portal/         # Role-gated portals
│       │   ├── games/          # Mini-games
│       │   └── api/            # API routes
│       ├── components/         # React components
│       ├── lib/                # Utilities, hooks
│       └── public/             # Static assets
├── firebase/
│   ├── functions/              # Cloud Functions
│   │   └── src/
│   │       ├── webhooks/       # Payment webhooks
│   │       ├── services/       # Business logic
│   │       └── auth/           # RBAC claims
│   ├── firestore.rules         # Security rules
│   ├── firestore.indexes.json  # Database indexes
│   └── storage.rules           # Storage security
├── infra/
│   ├── firebase.json           # Firebase config
│   ├── .firebaserc             # Project aliases
│   └── seed/                   # Initial data
├── packages/                   # Shared packages
├── analytics/                  # BigQuery/Looker
└── .github/workflows/          # CI/CD
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Git

### Installation

```bash
# Clone repository
git clone <repo-url>
cd adopt-a-young-parent

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Firebase config

# Start development server
npm run dev
```

### Firebase Setup

```bash
# Login to Firebase
firebase login

# Select project
firebase use dev

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Functions
cd firebase/functions
npm install
cd ../..
firebase deploy --only functions
```

---

## 🔐 Security & Compliance

### Security Features

- **Deny-by-default Firestore Rules:** All data access explicitly granted
- **RBAC via Custom Claims:** Role-based access control with granular scopes
- **Org Isolation:** Multi-tenant architecture with strict data separation
- **Audit Logs:** Immutable, append-only audit trail
- **Webhook Verification:** Signature validation for all payment webhooks
- **PII Minimization:** Minimal personal data collection and storage

### Compliance

- **IRS Pub. 1771:** Compliant charitable receipt language
- **Michigan Disclosure:** State registration displayed on receipts and site
- **WCAG 2.2 AA:** Accessibility standards for all public pages
- **Skill-Only Games:** No chance mechanics (gambling-free)

---

## 📊 Data Model

### Core Collections

- `orgs/{orgId}/settings` - Organization metadata, branding, legal IDs
- `orgs/{orgId}/roles` - Role definitions with scopes
- `orgs/{orgId}/users` - User profiles with role assignments
- `orgs/{orgId}/donors` - Donor households with consent preferences
- `orgs/{orgId}/donations` - Donation records (webhook-only writes)
- `orgs/{orgId}/receipts` - Tax receipts with IRS-compliant language
- `orgs/{orgId}/employees` - HR profiles and onboarding
- `orgs/{orgId}/campaigns` - Fundraising campaigns
- `orgs/{orgId}/fundraisers` - Fundraiser stats and goals
- `orgs/{orgId}/auditLogs` - Immutable audit trail

### Security Scopes

- `admin.*` - Full organization access
- `crm.*` - Donor/contact management
- `donor.*` - Donor data access
- `campaign.*` - Campaign management
- `finance.*` - Financial data access
- `hr.*` - Employee/HR data access

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y

# Run Firestore Rules tests
cd firebase
npm run test:rules
```

---

## 🚢 Deployment

### Staging

```bash
firebase use staging
npm run build
firebase deploy
```

### Production

```bash
firebase use prod
npm run build
firebase deploy --only hosting,functions
```

### CI/CD

GitHub Actions automatically:
- Runs tests on all PRs
- Deploys to staging on merge to `main`
- Deploys to production on release tags

---

## 📖 Documentation

- [Project Tracker](./PROJECT_TRACKER.md) - Detailed sprint plan and tasks
- [Security Rules](./firebase/firestore.rules) - Firestore security documentation
- [API Documentation](./docs/API.md) - Cloud Functions API reference
- [User Guides](./docs/guides/) - Portal-specific user documentation

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Run linter: `npm run lint`
4. Run tests: `npm test`
5. Commit: `git commit -m "feat: add feature"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request

---

## 📝 License

[Add license information]

---

## 📞 Support

- **Email:** support@adoptayoungparent.org
- **Documentation:** [Link to docs]
- **Issue Tracker:** [GitHub Issues]

---

**Built with ❤️ for young parents in Michigan**
