# 📚 DOCUMENTATION INDEX

**Complete guide to all documentation for ADOPT A YOUNG PARENT platform**

---

## 🚀 Getting Started (Start Here!)

1. **[README.md](./README.md)** - Project overview and introduction
2. **[QUICK_START.md](./QUICK_START.md)** - Get running in 15 minutes
3. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
4. **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - What's been built so far

---

## 📋 Project Management

- **[PROJECT_TRACKER.md](./PROJECT_TRACKER.md)** - 17 sprints with detailed tasks and subtasks
- **[WINDSURF_PROMPT.md](./WINDSURF_PROMPT.md)** - AI assistant continuation prompt
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-launch checklist
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

---

## 🏗️ Architecture & Code

### Frontend (Next.js)
- **Location:** `apps/web/`
- **Key Files:**
  - `app/(public)/` - Public pages (homepage, donate, mission, etc.)
  - `app/portal/` - Role-gated portals (donor, admin, manager, etc.)
  - `app/api/` - API routes (receipts, etc.)
  - `lib/` - Utilities (auth, firebase, fcm, utils)
  - `components/` - React components

### Backend (Firebase Functions)
- **Location:** `firebase/functions/src/`
- **Key Files:**
  - `webhooks/` - Payment webhooks (Zeffy, Stripe)
  - `services/` - Business logic (receipts, fcm, audit, donors, games)
  - `auth/` - RBAC and user management
  - `scheduled/` - Cron jobs (metrics, reports)

### Security
- **[firebase/firestore.rules](./firebase/firestore.rules)** - Database security rules
- **[firebase/storage.rules](./firebase/storage.rules)** - File storage security
- **[firebase/firestore.indexes.json](./firebase/firestore.indexes.json)** - Database indexes

### Configuration
- **[firebase/firebase.json](./firebase/firebase.json)** - Firebase project config
- **[firebase/.firebaserc](./firebase/.firebaserc)** - Project aliases
- **[apps/web/next.config.js](./apps/web/next.config.js)** - Next.js config
- **[apps/web/tailwind.config.ts](./apps/web/tailwind.config.ts)** - Tailwind config

---

## 📊 Data & Seed

- **[infra/seed/initial-org.json](./infra/seed/initial-org.json)** - Organization settings template
- **Data Model:** See [PROJECT_TRACKER.md](./PROJECT_TRACKER.md#data-model)

---

## 🔐 Security & Compliance

### Security Features
- Deny-by-default Firestore Rules
- RBAC via Custom Claims
- Org isolation (multi-tenant)
- Immutable audit logs
- Webhook signature verification
- PII redaction

### Compliance
- **IRS Pub. 1771:** Receipt language in `services/receipts.ts`
- **Michigan Disclosure:** In all public pages and receipts
- **WCAG 2.2 AA:** Accessibility standards
- **Skill-only games:** No gambling mechanics

---

## 🎯 Key Features

### Payments
- **Zeffy** (primary, fee-free) - `webhooks/zeffy.ts`
- **Stripe** (fallback) - `webhooks/stripe.ts`
- **Receipts** - `services/receipts.ts`

### Notifications
- **FCM** (push) - `services/fcm.ts`, `lib/fcm.ts`
- **Service Worker** - `public/firebase-messaging-sw.js`
- **Consent Management** - In donor portal

### Portals
- **Donor Portal** - `app/portal/donor/page.tsx`
- **Admin Portal** - TODO
- **Manager Portal** - TODO
- **Fundraiser Portal** - TODO
- **Finance Portal** - TODO
- **Employee Portal** - TODO

### Public Pages
- **Homepage** - `app/(public)/page.tsx`
- **Donate** - `app/(public)/donate/page.tsx`
- **Mission** - `app/(public)/mission/page.tsx`
- **Transparency** - `app/(public)/transparency/page.tsx`
- **Programs, Impact, Events, Contact** - TODO

---

## 🧪 Testing

### Test Files
- Unit tests: `*.test.ts`
- E2E tests: `*.spec.ts`
- Rules tests: `firebase/functions/test/`

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:a11y
```

---

## 🚢 Deployment

### Environments
- **Development:** `adopt-a-young-parent-dev`
- **Staging:** `adopt-a-young-parent-staging`
- **Production:** `adopt-a-young-parent`

### Deploy Commands
```bash
# Deploy everything
firebase deploy --project prod

# Deploy hosting only
firebase deploy --only hosting --project prod

# Deploy functions only
firebase deploy --only functions --project prod

# Deploy rules only
firebase deploy --only firestore:rules,storage:rules --project prod
```

### CI/CD
- **GitHub Actions:** `.github/workflows/deploy.yml`
- **Auto-deploy:** Staging on merge to `main`, Production on release tags

---

## 📈 Monitoring & Analytics

### Firebase
- **Authentication:** User management
- **Firestore:** Database
- **Functions:** Serverless backend
- **Hosting:** Static site hosting
- **Storage:** File storage
- **Messaging:** FCM push notifications

### Analytics
- **GA4:** Google Analytics 4
- **BigQuery:** Data warehouse
- **Looker Studio:** Dashboards

---

## 🛠️ Development Tools

### Required
- Node.js 20+
- Firebase CLI
- Git

### Recommended
- VS Code / Cursor / Windsurf
- Firebase Emulator Suite
- Postman (API testing)

---

## 📞 Support & Resources

### Internal
- **Tech Lead:** [NAME]
- **Project Manager:** [NAME]
- **Email:** dev@adoptayoungparent.org

### External
- **Firebase Docs:** https://firebase.google.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Zeffy Support:** https://www.zeffy.com/support

---

## 🗺️ Roadmap

### Sprint Status (See [PROJECT_TRACKER.md](./PROJECT_TRACKER.md))
- ✅ Sprint 0: Foundation (100%)
- 🟡 Sprint 1: Auth & RBAC (60%)
- ✅ Sprint 2: Donate + Webhooks (100%)
- ✅ Sprint 3: Donor Portal (90%)
- ⚪ Sprint 4-17: In planning

### Next Milestones
1. Complete remaining portals
2. Build public pages
3. Implement mini-game
4. Add email service
5. Set up analytics dashboards
6. Write comprehensive tests
7. Launch to production

---

## 📝 Quick Reference

### File Locations
```
Configuration:
- Environment: apps/web/.env.local
- Firebase: firebase/firebase.json
- Next.js: apps/web/next.config.js

Security:
- Firestore Rules: firebase/firestore.rules
- Storage Rules: firebase/storage.rules
- Auth Claims: firebase/functions/src/auth/claims.ts

Features:
- Webhooks: firebase/functions/src/webhooks/
- Services: firebase/functions/src/services/
- Pages: apps/web/app/
- Components: apps/web/components/
- Utilities: apps/web/lib/

Documentation:
- Setup: SETUP_GUIDE.md
- Tracker: PROJECT_TRACKER.md
- Summary: BUILD_SUMMARY.md
- Deploy: DEPLOYMENT_CHECKLIST.md
```

### Common Commands
```bash
# Development
npm run dev                    # Start Next.js dev server
firebase emulators:start       # Start Firebase emulators

# Build
npm run build                  # Build Next.js app
npm run build:functions        # Build Cloud Functions

# Test
npm test                       # Run all tests
npm run lint                   # Run linter

# Deploy
firebase deploy --project prod # Deploy to production
firebase use staging           # Switch to staging
```

---

## 🎓 Learning Path

**For New Developers:**

1. Read [README.md](./README.md)
2. Follow [QUICK_START.md](./QUICK_START.md)
3. Review [PROJECT_TRACKER.md](./PROJECT_TRACKER.md)
4. Study security rules in `firebase/firestore.rules`
5. Explore existing code in `apps/web/` and `firebase/functions/`
6. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
7. Start with small tasks from PROJECT_TRACKER.md

**For AI Assistants:**

1. Read [BUILD_SUMMARY.md](./BUILD_SUMMARY.md)
2. Use [WINDSURF_PROMPT.md](./WINDSURF_PROMPT.md) as context
3. Reference [PROJECT_TRACKER.md](./PROJECT_TRACKER.md) for tasks
4. Follow patterns in existing code
5. Maintain security and compliance standards

---

## 🔄 Document Updates

This index is maintained alongside the project. Last updated: 2024-10-13

**To update this index:**
1. Add new documentation files
2. Update relevant sections
3. Keep file paths accurate
4. Maintain consistent formatting

---

**Need help? Start with [QUICK_START.md](./QUICK_START.md) or contact the team!**
