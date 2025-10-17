# Secure Credential Management Guide

**Last Updated:** October 17, 2025
**Status:** 🔒 Production Standard

---

## Table of Contents

1. [Overview](#overview)
2. [Credential Storage Best Practices](#credential-storage-best-practices)
3. [Firebase Service Account Setup](#firebase-service-account-setup)
4. [Environment Variables](#environment-variables)
5. [GitHub Actions Secrets](#github-actions-secrets)
6. [Firebase Secret Manager](#firebase-secret-manager)
7. [Local Development](#local-development)
8. [Production Deployment](#production-deployment)
9. [Credential Rotation](#credential-rotation)
10. [Security Checklist](#security-checklist)

---

## Overview

This project uses multiple types of credentials that must be managed securely:

| Credential Type | Purpose | Storage Method |
|----------------|---------|----------------|
| Firebase Service Account | Admin SDK access | Secret Manager + GitHub Secrets |
| Firebase Web Config | Client-side Firebase | Environment variables (public) |
| SendGrid API Key | Email notifications | Secret Manager |
| airSlate API Key | Form generation | Secret Manager (optional) |

**Golden Rule:**
> **NEVER commit credential files or private keys to Git**

---

## Credential Storage Best Practices

### ✅ DO

- Store credentials outside the Git repository
- Use environment variables for configuration
- Use secret management services (Firebase Secret Manager, GitHub Secrets)
- Encrypt credentials at rest
- Rotate credentials regularly (every 90 days)
- Use least-privilege access (minimal permissions)
- Review access logs regularly
- Document who has access to credentials

### ❌ DON'T

- Commit `.json` service account files to Git
- Hardcode credentials in source code
- Share credentials via email, Slack, or other insecure channels
- Use the same credentials across environments (dev/staging/prod)
- Give service accounts more permissions than needed
- Keep old credentials active after rotation

---

## Firebase Service Account Setup

### Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., "adopt-a-young-parent")
3. Click **Settings** (gear icon) → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** to confirm
7. Save the downloaded JSON file

### Step 2: Store Securely

Choose a storage location OUTSIDE your Git repository:

```powershell
# Recommended: Create a credentials directory outside the project
$credentialsDir = "C:\firebase-credentials"
New-Item -ItemType Directory -Path $credentialsDir -Force

# Move the downloaded file there
Move-Item "C:\Users\$env:USERNAME\Downloads\adopt-a-young-parent-*.json" `
          "$credentialsDir\firebase-service-account.json"
```

### Step 3: Set Permissions (Windows)

```powershell
# Restrict access to the credential file (admins and current user only)
$credFile = "C:\firebase-credentials\firebase-service-account.json"
$acl = Get-Acl $credFile
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $env:USERNAME, "FullControl", "Allow"
)
$acl.AddAccessRule($rule)
Set-Acl $credFile $acl

Write-Host "✅ Credentials secured" -ForegroundColor Green
```

### Step 4: Verify the Key

```powershell
# Verify the service account file
$key = Get-Content C:\firebase-credentials\firebase-service-account.json | ConvertFrom-Json

Write-Host "Service Account Details:" -ForegroundColor Cyan
Write-Host "  Email: $($key.client_email)" -ForegroundColor White
Write-Host "  Project: $($key.project_id)" -ForegroundColor White
Write-Host "  Key ID: $($key.private_key_id)" -ForegroundColor White

# Document this key ID for rotation tracking
Add-Content -Path "C:\firebase-credentials\key-rotation-log.txt" -Value @"
$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") - New key generated
  Key ID: $($key.private_key_id)
  Email: $($key.client_email)
  Next rotation: $(Get-Date).AddDays(90).ToString("yyyy-MM-dd")
"@
```

---

## Environment Variables

### Local Development

Create a PowerShell profile to set environment variables:

```powershell
# Edit your PowerShell profile
notepad $PROFILE

# Add these lines:
$env:FIREBASE_SERVICE_ACCOUNT_PATH = "C:\firebase-credentials\firebase-service-account.json"
$env:NODE_ENV = "development"

# Save and reload
. $PROFILE
```

### Project-specific .env Files

For local development, create `.env.local` (already in .gitignore):

```bash
# .env.local (NEVER commit this file)

# Firebase Web Config (public - OK to commit in .env)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=adopt-a-young-parent.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=adopt-a-young-parent
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=adopt-a-young-parent.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123

# Firebase Admin (NEVER commit - use Secret Manager in production)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SendGrid (NEVER commit)
SENDGRID_API_KEY=SG.xxx...

# airSlate (NEVER commit - optional)
AIRSLATE_API_KEY=xxx...
AIRSLATE_ORGANIZATION_ID=xxx...
```

Verify `.env.local` is in `.gitignore`:

```bash
# Check .gitignore
cat .gitignore | grep ".env.local"
# Should output: .env.local
```

---

## GitHub Actions Secrets

### Add Secrets to GitHub Repository

1. Go to: `https://github.com/Instawerx/AYPNFP/settings/secrets/actions`
2. Click **New repository secret**
3. Add each secret:

| Secret Name | Value | Usage |
|-------------|-------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Entire JSON file contents | CI/CD deployment |
| `SENDGRID_API_KEY` | `SG.xxx...` | Email notifications |
| `AIRSLATE_API_KEY` | API key | Form generation (optional) |

### Use in Workflows

Reference secrets in `.github/workflows/deploy.yml`:

```yaml
- name: Authenticate with GCloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
    create_credentials_file: true

- name: Deploy Functions
  env:
    GOOGLE_APPLICATION_CREDENTIALS: ${{ steps.auth.outputs.credentials_file_path }}
    SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
  run: |
    firebase deploy --only functions
```

---

## Firebase Secret Manager

Firebase App Hosting uses Google Secret Manager for sensitive values.

### Create Secrets

```bash
# Set environment variable for the script
$env:FIREBASE_SERVICE_ACCOUNT_PATH = "C:\firebase-credentials\firebase-service-account.json"

# Run setup script
.\setup-firebase-secret.ps1

# Or manually create secrets
firebase apphosting:secrets:set firebase-admin-private-key `
  --data-file="C:\firebase-credentials\firebase-service-account.json" `
  --project adopt-a-young-parent

# Create SendGrid secret
echo "SG.your-api-key-here" > sendgrid-key.txt
firebase apphosting:secrets:set sendgrid-api-key `
  --data-file=sendgrid-key.txt `
  --project adopt-a-young-parent
Remove-Item sendgrid-key.txt
```

### Reference in apphosting.yaml

```yaml
# apps/web/apphosting.yaml
env:
  # Public environment variables
  - variable: FIREBASE_CLIENT_EMAIL
    value: firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com
    availability:
      - RUNTIME

  # Secret references
  - variable: FIREBASE_PRIVATE_KEY
    secret: firebase-admin-private-key
    availability:
      - RUNTIME

  - variable: SENDGRID_API_KEY
    secret: sendgrid-api-key
    availability:
      - RUNTIME
```

### List Secrets

```bash
# List all secrets
firebase apphosting:secrets:list --project adopt-a-young-parent

# View secret versions
firebase apphosting:secrets:describe firebase-admin-private-key --project adopt-a-young-parent
```

### Update Secrets

```bash
# Update an existing secret
firebase apphosting:secrets:set firebase-admin-private-key `
  --data-file="C:\firebase-credentials\firebase-service-account-new.json" `
  --project adopt-a-young-parent
```

---

## Local Development

### Setup for Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variable:**
   ```powershell
   $env:FIREBASE_SERVICE_ACCOUNT_PATH = "C:\firebase-credentials\firebase-service-account.json"
   ```

3. **Create .env.local:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

### Access Credentials in Code

```typescript
// apps/web/lib/firebase-admin.ts
import admin from 'firebase-admin';

// For local development
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
// For production (uses Secret Manager)
else if (process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] All secrets created in Firebase Secret Manager
- [ ] GitHub Actions secrets configured
- [ ] `apphosting.yaml` references secrets correctly
- [ ] Service account has minimum required permissions
- [ ] Audit logs enabled
- [ ] Budget alerts configured

### Deploy to Production

```bash
# Deploy to Firebase App Hosting
firebase deploy --only apphosting:aaypnfp --project adopt-a-young-parent

# Verify secrets are accessible
firebase apphosting:secrets:access firebase-admin-private-key --project adopt-a-young-parent
```

### Verify Deployment

```bash
# Check application logs
firebase apphosting:logs --project adopt-a-young-parent

# Test API endpoint
curl https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app/api/health
```

---

## Credential Rotation

### Rotation Schedule

| Credential | Frequency | Last Rotated | Next Rotation |
|------------|-----------|--------------|---------------|
| Firebase Service Account | 90 days | 2025-10-17 | 2026-01-15 |
| SendGrid API Key | 180 days | - | - |
| airSlate API Key | 180 days | - | - |

### Rotation Procedure

#### 1. Generate New Credential

```powershell
# Follow "Firebase Service Account Setup" section above
# Save new key with timestamp
$timestamp = Get-Date -Format "yyyyMMdd"
$newKeyPath = "C:\firebase-credentials\firebase-service-account-$timestamp.json"
```

#### 2. Update All Systems

Update in this order to avoid downtime:

1. **Firebase Secret Manager** (add new version)
   ```bash
   firebase apphosting:secrets:set firebase-admin-private-key `
     --data-file="$newKeyPath" `
     --project adopt-a-young-parent
   ```

2. **GitHub Actions** (update secret)
   - Go to repository settings → Secrets
   - Update `FIREBASE_SERVICE_ACCOUNT`

3. **Local Development** (update path)
   ```powershell
   $env:FIREBASE_SERVICE_ACCOUNT_PATH = $newKeyPath
   # Update PowerShell profile
   ```

4. **Deploy Application** (pick up new secret)
   ```bash
   firebase deploy --only apphosting:aaypnfp
   ```

#### 3. Verify New Credential

```bash
# Check logs for successful authentication
firebase apphosting:logs --project adopt-a-young-parent | Select-String "authenticated"

# Test API endpoints
curl https://your-app-url.com/api/health
```

#### 4. Revoke Old Credential

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Find old key by key ID
4. Click **Delete** on the old key
5. Confirm deletion

#### 5. Document Rotation

```powershell
# Update rotation log
Add-Content -Path "C:\firebase-credentials\key-rotation-log.txt" -Value @"

$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") - Key rotated
  Old Key ID: [previous-key-id]
  New Key ID: [new-key-id]
  Rotated by: $env:USERNAME
  Next rotation: $(Get-Date).AddDays(90).ToString("yyyy-MM-dd")
  Systems updated: Firebase Secret Manager, GitHub Actions, Local Dev
"@
```

---

## Security Checklist

### Before Committing Code

- [ ] No `.json` credential files in staging area
- [ ] No private keys in code
- [ ] No API keys hardcoded
- [ ] `.env.local` in `.gitignore`
- [ ] Pre-commit hook installed and working
- [ ] Reviewed `git diff` for sensitive data

### Monthly Security Review

- [ ] Review service account permissions (principle of least privilege)
- [ ] Check Cloud Audit Logs for suspicious activity
- [ ] Review list of users with access to secrets
- [ ] Verify all credentials are still needed
- [ ] Check for unused service accounts (delete if not needed)
- [ ] Review Firebase Authentication users
- [ ] Check Storage bucket permissions
- [ ] Review Firestore security rules

### Quarterly Security Tasks

- [ ] Rotate credentials (90-day cycle)
- [ ] Review and update IAM policies
- [ ] Audit all active service accounts
- [ ] Review Cloud Logging alerts
- [ ] Test incident response procedures
- [ ] Update security documentation
- [ ] Train team on security best practices

---

## Emergency Procedures

### If Credentials Are Exposed

1. **Immediate Actions** (within 1 hour):
   - [ ] Disable/delete the exposed credential in Firebase Console
   - [ ] Generate new credential
   - [ ] Update all systems with new credential
   - [ ] Remove exposed credential from Git history
   - [ ] Force push cleaned history to GitHub

2. **Investigation** (within 4 hours):
   - [ ] Review Cloud Audit Logs for unauthorized access
   - [ ] Check Firebase Auth for new unauthorized users
   - [ ] Check Firestore for unauthorized data changes
   - [ ] Check Storage for unauthorized file access
   - [ ] Check Cloud Billing for unexpected charges

3. **Communication** (within 8 hours):
   - [ ] Notify team members
   - [ ] Document incident
   - [ ] Update security procedures
   - [ ] Schedule post-mortem review

4. **Long-term** (within 30 days):
   - [ ] Implement additional security controls
   - [ ] Update monitoring and alerting
   - [ ] Conduct security training
   - [ ] Review and update incident response plan

---

## Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Document Version:** 1.0
**Last Reviewed:** October 17, 2025
**Next Review:** January 17, 2026
