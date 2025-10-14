# 🚀 DEPLOYMENT CHECKLIST

Complete this checklist before deploying to production.

---

## Pre-Deployment

### Environment Setup
- [ ] Firebase projects created (dev, staging, prod)
- [ ] All environment variables configured
- [ ] Service account keys downloaded (dev only, never commit)
- [ ] Firebase CLI installed and logged in
- [ ] Custom domain purchased and DNS configured

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint passes with no errors
- [ ] All tests passing
- [ ] Code reviewed
- [ ] No console.log statements in production code
- [ ] No hardcoded secrets or API keys

### Security
- [ ] Firestore Rules deployed and tested
- [ ] Storage Rules deployed and tested
- [ ] All webhook secrets configured
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] No sensitive data in client code

### Data
- [ ] Organization settings seeded
- [ ] Roles created
- [ ] Admin user created
- [ ] Test data cleaned up
- [ ] Backup strategy in place

### Integrations
- [ ] Zeffy account created
- [ ] Zeffy form ID configured
- [ ] Zeffy webhook URL configured
- [ ] Stripe account created
- [ ] Stripe API keys configured
- [ ] Stripe webhook URL configured
- [ ] FCM VAPID key generated
- [ ] GA4 property created
- [ ] BigQuery export enabled

---

## Deployment Steps

### 1. Build & Test

```bash
# Build Next.js app
cd apps/web
npm run build

# Build Functions
cd ../../firebase/functions
npm run build

# Run tests
npm test
```

### 2. Deploy Firestore Rules

```bash
cd ../../firebase
firebase deploy --only firestore:rules,firestore:indexes --project prod
```

### 3. Deploy Storage Rules

```bash
firebase deploy --only storage:rules --project prod
```

### 4. Deploy Functions

```bash
firebase deploy --only functions --project prod
```

### 5. Deploy Hosting

```bash
firebase deploy --only hosting --project prod
```

### 6. Verify Deployment

- [ ] Visit production URL
- [ ] Test homepage loads
- [ ] Test login/signup
- [ ] Test donation flow (Zeffy)
- [ ] Test donation flow (Stripe)
- [ ] Verify receipt generation
- [ ] Test FCM notifications
- [ ] Check all portal pages
- [ ] Run Lighthouse audit (score > 90)
- [ ] Run accessibility audit (WCAG 2.2 AA)

---

## Post-Deployment

### Monitoring
- [ ] Firebase Alerts configured
- [ ] Error tracking enabled
- [ ] Uptime monitoring set up
- [ ] Performance monitoring enabled
- [ ] Log aggregation configured

### Documentation
- [ ] Update README with production URL
- [ ] Document any manual steps
- [ ] Update changelog
- [ ] Notify stakeholders

### Backup
- [ ] Firestore backup scheduled
- [ ] Storage backup configured
- [ ] Database export tested

---

## Rollback Plan

If something goes wrong:

```bash
# Rollback to previous version
firebase hosting:rollback --project prod

# Disable problematic function
firebase functions:delete FUNCTION_NAME --project prod

# Revert Firestore rules
firebase deploy --only firestore:rules --project prod
```

---

## Production URLs

- **Website:** https://adoptayoungparent.org
- **Firebase Console:** https://console.firebase.google.com/project/adopt-a-young-parent
- **Zeffy Dashboard:** https://www.zeffy.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com

---

## Emergency Contacts

- **Tech Lead:** [NAME] - [EMAIL]
- **Firebase Support:** https://firebase.google.com/support
- **Stripe Support:** https://support.stripe.com
- **Domain Registrar:** [PROVIDER]

---

## Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates
- [ ] Check donation success rate
- [ ] Verify webhook delivery
- [ ] Monitor function execution times
- [ ] Check database read/write counts
- [ ] Review user feedback
- [ ] Monitor uptime

---

## Weekly Maintenance

- [ ] Review error logs
- [ ] Check security alerts
- [ ] Update dependencies
- [ ] Review analytics
- [ ] Backup verification
- [ ] Performance review

---

**Last Updated:** [DATE]  
**Deployed By:** [NAME]  
**Version:** [VERSION]
