# 🔐 Secure Credential Management Guide

**Last Updated:** October 17, 2025
**Status:** Active Security Protocol

---

## ⚠️ CRITICAL SECURITY INCIDENT - RESOLVED

### What Happened
On October 17, 2025, we discovered that a Firebase service account credential file was accidentally committed to the public GitHub repository on October 14, 2025.

**Exposed File:** `adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json`
**Commit:** `2df540b3177a3591b27c6fc2d061f2146add7e98`
**Detection:** Google Cloud automated scanning
**Status:** Key disabled by Google, remediation in progress

### Actions Taken
- ✅ Local credential files deleted
- ✅ .gitignore updated with comprehensive patterns
- ✅ Pre-commit hook installed to prevent future exposures
- ✅ Scripts updated to use environment variables
- ⏳ Git history cleanup in progress
- ⏳ New service account key generation needed

---

## 🛡️ Security Best Practices

### NEVER Commit These Files
- ❌ `*-firebase-adminsdk-*.json` - Firebase service account keys
- ❌ `*.pem`, `*.key`, `*.p12`, `*.pfx` - Private keys
- ❌ `.env` files with real credentials
- ❌ `credentials.json`, `secrets.json` - Credential files
- ❌ Files containing API keys, tokens, or passwords

### ALWAYS Do This Instead
- ✅ Use environment variables
- ✅ Use secret management services (Firebase Secret Manager, GitHub Secrets)
- ✅ Store credentials outside the repository
- ✅ Use `.env.example` with placeholder values (never real values)
- ✅ Document required environment variables

---

## 📝 Secure Credential Workflow

### 1. Store Credentials Securely

#### Option A: Environment Variables (Local Development)
```bash
# Set environment variable (Windows PowerShell)
$env:FIREBASE_SERVICE_ACCOUNT_PATH="C:\secure\firebase-service-account.json"

# Set environment variable (Windows CMD)
set FIREBASE_SERVICE_ACCOUNT_PATH=C:\secure\firebase-service-account.json

# Set environment variable (Linux/Mac)
export FIREBASE_SERVICE_ACCOUNT_PATH=/secure/firebase-service-account.json
```

#### Option B: Firebase Secret Manager (Production)
```bash
# Create secret from file
firebase apphosting:secrets:set firebase-admin-private-key --data-file=/path/to/key.txt

# List secrets
firebase apphosting:secrets:list

# Access in code via process.env.FIREBASE_PRIVATE_KEY
```

#### Option C: GitHub Secrets (CI/CD)
1. Go to: `https://github.com/Instawerx/AYPNFP/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste entire JSON content
5. Click "Add secret"

### 2. Reference Credentials in Code

#### ❌ WRONG - Hardcoded Path
```typescript
const serviceAccount = require('./firebase-adminsdk-key.json');
```

#### ✅ CORRECT - Environment Variable
```typescript
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};
```

### 3. Document Required Variables

Create `.env.example`:
```env
# Firebase Configuration (DO NOT PUT REAL VALUES HERE)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-private-key-here

# Note: Actual values should be set in environment or secret manager
# NEVER commit .env files with real credentials
```

---

## 🔄 Credential Rotation Process

### When to Rotate
- ✅ Every 90 days (scheduled rotation)
- ✅ Immediately after exposure or breach
- ✅ When team member with access leaves
- ✅ After suspicious activity detected

### How to Rotate Firebase Service Account Key

#### Step 1: Generate New Key
```bash
# Via Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select project: adopt-a-young-parent
3. Click Settings (⚙️) > Project settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Save as: firebase-service-account-NEW.json
7. Store in secure location OUTSIDE repository
```

#### Step 2: Update Secrets
```bash
# Update Firebase Secret Manager
firebase apphosting:secrets:set firebase-admin-private-key --data-file=/secure/new-key.txt

# Update GitHub Secrets
# Go to: https://github.com/Instawerx/AYPNFP/settings/secrets/actions
# Update: FIREBASE_SERVICE_ACCOUNT
```

#### Step 3: Test New Key
```bash
# Deploy and verify application works
firebase deploy --only apphosting:aaypnfp

# Test critical functionality
# - User authentication
# - Firestore operations
# - Storage access
```

#### Step 4: Revoke Old Key
```bash
# Via Firebase Console:
1. Go to Service accounts tab
2. Find the old key (check key ID)
3. Click the key
4. Click "Delete"
5. Confirm deletion
```

#### Step 5: Update Documentation
```bash
# Update this file with:
# - Date of rotation
# - Key ID of new key (not the key itself!)
# - Who performed rotation
```

---

## 🚨 Incident Response Plan

### If Credentials Are Exposed

#### Immediate Actions (Within 15 minutes)
1. **Stop the leak**
   - Remove the file from working directory
   - Do NOT just add to .gitignore (file is in history)

2. **Revoke compromised credentials**
   - Disable the exposed service account key in Firebase Console
   - Google may do this automatically if detected

3. **Notify team**
   - Alert all team members
   - Document the incident

#### Short-term Actions (Within 1 hour)
4. **Generate new credentials**
   - Create new service account key
   - Update all secret stores

5. **Clean Git history**
   - Use git-filter-repo or BFG Repo-Cleaner
   - Force push to update remote repository

6. **Monitor for abuse**
   - Check GCP audit logs
   - Review Firebase usage metrics
   - Watch for unusual activity

#### Long-term Actions (Within 24 hours)
7. **Analyze impact**
   - Review what data was accessible
   - Check for unauthorized access
   - Document timeline of exposure

8. **Improve security**
   - Install git-secrets or similar tools
   - Add pre-commit hooks
   - Update security training

9. **Report if necessary**
   - Notify affected users if data breach
   - Report to management
   - Document lessons learned

---

## 🔍 Monitoring & Detection

### Set Up Alerts

#### GCP Audit Logs
```bash
# Create log-based alert for service account usage
gcloud logging metrics create service_account_usage \
    --description="Service account authentication events" \
    --log-filter='protoPayload.authenticationInfo.principalEmail="firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com"'
```

#### Firebase Usage Monitoring
1. Go to Firebase Console > Usage
2. Set up budget alerts
3. Enable anomaly detection

#### GitHub Secret Scanning
- Already enabled for public repositories
- Configure notifications in repository settings

### Regular Security Audits

#### Weekly
- Review Firebase authentication logs
- Check for new users or unusual activity
- Monitor Firebase usage metrics

#### Monthly
- Audit service account permissions
- Review IAM roles and access
- Check for expired or unused keys

#### Quarterly
- Rotate service account keys
- Review and update security policies
- Train team on security best practices

---

## 📋 Checklist for New Team Members

- [ ] Complete security training
- [ ] Set up environment variables properly
- [ ] Never commit credential files
- [ ] Use .env.example as template
- [ ] Install pre-commit hooks
- [ ] Know who to contact for incidents
- [ ] Understand credential rotation process

---

## 🔗 Resources

### Documentation
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Google Cloud IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

### Tools
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent secrets in Git
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Clean Git history
- [git-filter-repo](https://github.com/newren/git-filter-repo) - Git history rewriting

### Contact
- **Security Issues:** Report immediately to project lead
- **Questions:** Consult this documentation or ask team lead

---

## 📊 Credential Inventory

### Current Credentials (as of Oct 17, 2025)

| Service | Type | Location | Last Rotated | Next Rotation |
|---------|------|----------|--------------|---------------|
| Firebase Admin SDK | Service Account | Secret Manager | Pending | After cleanup |
| GitHub Actions | Repository Secret | GitHub Secrets | Pending | After cleanup |
| SendGrid API | API Key | Secret Manager | Unknown | TBD |
| Firebase Config | Public Keys | apphosting.yaml | N/A | N/A |

**Note:** Service account key was compromised on Oct 14, 2025. New key generation in progress.

---

## ✅ Security Verification

### After Following This Guide

Run these commands to verify security:

```bash
# 1. Check no credential files in working directory
ls -la *.json | grep -i "firebase-adminsdk\|credentials\|service-account"
# Should return no results

# 2. Check .gitignore is working
git check-ignore adopt-a-young-parent-firebase-adminsdk-*.json
# Should return the filename (meaning it's ignored)

# 3. Test pre-commit hook
git add test-credential.json
git commit -m "test"
# Should be blocked if file contains credentials

# 4. Verify Git history is clean (after cleanup)
git log --all --full-history -- "*firebase*adminsdk*.json"
# Should return no results
```

---

## 📝 Change Log

| Date | Change | Who |
|------|--------|-----|
| 2025-10-17 | Initial document created after security incident | Claude Code |
| 2025-10-17 | Added incident response section | Claude Code |
| 2025-10-17 | Added credential rotation process | Claude Code |

---

**Remember: When in doubt, ask! Security is everyone's responsibility.**
