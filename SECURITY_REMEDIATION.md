# Security Incident Remediation Guide

**Date:** October 17, 2025
**Incident:** Firebase Service Account Credential Exposure
**Status:** 🔴 CRITICAL - Immediate Action Required

---

## Executive Summary

A Firebase service account private key was committed to the GitHub repository and detected by Google Cloud's automated security scanning. The key has been **disabled by Google** to prevent abuse.

**Exposed Credential:**
- **File:** `adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json`
- **Key ID:** `813342c77db74eea85ab569b136749aa6702b8eb`
- **Commit:** `2df540b3177a3591b27c6fc2d061f2146add7e98`
- **Date Exposed:** October 14, 2025
- **Service Account:** `firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com`

---

## Immediate Actions Completed

### ✅ Phase 1: Local Cleanup (Completed)

1. **Deleted Local Credential Files**
   - Removed `adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json` (compromised)
   - Removed `firebase-admin-key-new.json` (untracked replacement)

2. **Updated Scripts to Use Environment Variables**
   - Modified `setup-firebase-secret.ps1` to use `$env:FIREBASE_SERVICE_ACCOUNT_PATH`
   - Added prompts for missing environment variables
   - Added security warnings

3. **Enhanced .gitignore**
   - Added comprehensive patterns for Firebase credentials
   - Added patterns for Google Cloud credentials
   - Added patterns for AWS credentials
   - Added patterns for private keys and certificates

4. **Created Pre-commit Hook**
   - Installed Git hook at `.git/hooks/pre-commit`
   - Scans for sensitive files before commits
   - Blocks commits containing credentials
   - Provides security guidance

---

## Critical Actions Required (Next Steps)

### 🔴 STEP 1: Clean Git History (CRITICAL - Do This First)

The exposed credential file is still in Git history and publicly visible on GitHub. You **MUST** remove it.

#### Option A: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Backup your repository first
cd C:\AYPNFP
git clone --mirror . ../AYPNFP-backup

# Remove the exposed file from all commits
git filter-repo --path adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json --invert-paths --force

# Verify the file is gone
git log --all --full-history -- "*firebase*adminsdk*.json"
# Should return NOTHING

# Force push to GitHub (this rewrites history)
git remote add origin https://github.com/Instawerx/AYPNFP.git
git push origin --force --all
git push origin --force --tags
```

#### Option B: Using BFG Repo-Cleaner

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Place bfg.jar in C:\AYPNFP

# Backup first
git clone --mirror . ../AYPNFP-backup

# Remove the file
java -jar bfg.jar --delete-files adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

**⚠️ WARNING:** Force pushing rewrites Git history. Coordinate with team members before doing this.

---

### 🔴 STEP 2: Generate New Service Account Key

The old key is compromised and disabled. Create a new one:

#### In Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **"adopt-a-young-parent"**
3. Click **Settings** (gear icon) → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** (confirm)
7. Save the downloaded file as `firebase-service-account.json`
8. **Store it OUTSIDE your Git repository** (e.g., `C:\firebase-credentials\`)

#### Verify the New Key:

```powershell
# Check the key file
$key = Get-Content C:\firebase-credentials\firebase-service-account.json | ConvertFrom-Json
Write-Host "Service Account: $($key.client_email)"
Write-Host "Project ID: $($key.project_id)"
Write-Host "Key ID: $($key.private_key_id)"
```

---

### 🔴 STEP 3: Update GitHub Actions Secret

The GitHub Actions workflow uses `FIREBASE_SERVICE_ACCOUNT` secret.

1. Go to: https://github.com/Instawerx/AYPNFP/settings/secrets/actions
2. Find `FIREBASE_SERVICE_ACCOUNT` secret
3. Click **Update**
4. Paste the **entire contents** of your new `firebase-service-account.json` file
5. Click **Update secret**

---

### 🔴 STEP 4: Update Firebase Secret Manager

Your app uses Firebase App Hosting secrets for the private key.

```bash
# Set environment variable
$env:FIREBASE_SERVICE_ACCOUNT_PATH = "C:\firebase-credentials\firebase-service-account.json"

# Run the setup script
.\setup-firebase-secret.ps1

# Or manually create the secret
firebase apphosting:secrets:set firebase-admin-private-key --data-file="C:\firebase-credentials\firebase-service-account.json" --project adopt-a-young-parent
```

---

### 🟡 STEP 5: Review GCP Audit Logs (High Priority)

Check if the compromised key was used maliciously:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project **"adopt-a-young-parent"**
3. Navigate to **Logging** → **Logs Explorer**
4. Run this query:

```
resource.type="service_account"
protoPayload.authenticationInfo.principalEmail="firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com"
timestamp>="2025-10-14T00:00:00Z"
severity>="WARNING"
```

5. Look for:
   - Unusual API calls
   - Failed authentication attempts
   - Unauthorized data access
   - Resource modifications
   - Unexpected geographic locations

---

### 🟡 STEP 6: Review Firebase Console (High Priority)

Check for suspicious activity:

#### Firestore Database:
1. Go to **Firestore Database** in Firebase Console
2. Review recent document changes
3. Look for unauthorized data modifications
4. Check for new collections you didn't create

#### Authentication:
1. Go to **Authentication** → **Users**
2. Look for new users you didn't create
3. Check for disabled or deleted admin users
4. Review recent sign-in activity

#### Storage:
1. Go to **Storage** in Firebase Console
2. Check for new files you didn't upload
3. Look for deleted files
4. Review bucket usage for unexpected spikes

#### Functions:
1. Go to **Functions** in Firebase Console
2. Check for new functions you didn't deploy
3. Review function logs for errors or unusual activity

---

### 🟢 STEP 7: Verify Cleanup (Medium Priority)

After completing steps 1-4, verify everything is clean:

#### Verify Git History:

```bash
# Should return NO results
git log --all --full-history -- "*firebase*adminsdk*.json"

# Should return 0
git log --all -p -S "813342c77db74eea85ab569b136749aa6702b8eb" | wc -l

# Check GitHub directly
# Go to: https://github.com/Instawerx/AYPNFP
# Search for: 813342c77db74eea85ab569b136749aa6702b8eb
# Should find NOTHING
```

#### Verify New Credentials Work:

```bash
# Test GitHub Actions (push a small change)
git add .gitignore
git commit -m "Test new credentials"
git push

# Check GitHub Actions tab - deployment should succeed
```

---

## Long-term Security Improvements

### 1. Credential Rotation Schedule

Set up a calendar reminder to rotate credentials every 90 days:

```
Next rotation date: January 15, 2026
```

### 2. Enable Additional Security Features

#### Cloud Audit Logs:
```bash
gcloud services enable cloudaudit.googleapis.com --project adopt-a-young-parent
```

#### Security Command Center (if available):
```bash
gcloud services enable securitycenter.googleapis.com --project adopt-a-young-parent
```

#### Budget Alerts (detect abuse):
1. Go to: https://console.cloud.google.com/billing/budgets
2. Create budget alert for $10/month
3. Set email notifications at 50%, 90%, 100%

### 3. Apply Principle of Least Privilege

Review service account permissions:

```bash
# List current permissions
gcloud projects get-iam-policy adopt-a-young-parent \
  --flatten="bindings[].members" \
  --filter="bindings.members:firebase-adminsdk-fbsvc@*"

# Remove unnecessary roles (example)
gcloud projects remove-iam-policy-binding adopt-a-young-parent \
  --member="serviceAccount:firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com" \
  --role="roles/editor"

# Add specific roles instead
gcloud projects add-iam-policy-binding adopt-a-young-parent \
  --member="serviceAccount:firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"
```

### 4. Set Up Security Monitoring

Create monitoring alerts for unusual activity:

```yaml
# Example: Alert on high API usage
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Firebase API Usage" \
  --condition-display-name="API requests > 10000/min" \
  --condition-threshold-value=10000 \
  --condition-threshold-duration=60s
```

---

## Team Communication

### Notify Team Members

Send this message to all developers:

```
SECURITY ALERT: Git History Rewritten

We've removed an exposed credential from our Git repository history.

ACTION REQUIRED for all developers:
1. Save any uncommitted work
2. Delete your local repository clone
3. Fresh clone: git clone https://github.com/Instawerx/AYPNFP.git
4. DO NOT try to merge or rebase old branches

The force push was necessary to remove sensitive data from Git history.

Questions? Contact [security lead]
```

---

## Prevention Checklist

Use this checklist for all future projects:

- [ ] Add comprehensive `.gitignore` before first commit
- [ ] Install pre-commit hooks immediately
- [ ] Use environment variables for all secrets
- [ ] Store credentials outside repository
- [ ] Use secret management (Firebase Secret Manager, AWS Secrets Manager, etc.)
- [ ] Enable automated security scanning (GitHub Advanced Security, GitGuardian, etc.)
- [ ] Rotate credentials every 90 days
- [ ] Review IAM permissions quarterly
- [ ] Train team on security best practices
- [ ] Document incident response procedures

---

## Additional Resources

- **Firebase Security Best Practices:** https://firebase.google.com/docs/admin/setup#security
- **Git History Rewriting:** https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning
- **Google Cloud Security:** https://cloud.google.com/security/best-practices

---

## Status Tracking

| Task | Status | Completed |
|------|--------|-----------|
| Delete local credential files | ✅ Complete | 2025-10-17 |
| Update scripts to use env vars | ✅ Complete | 2025-10-17 |
| Enhance .gitignore | ✅ Complete | 2025-10-17 |
| Install pre-commit hook | ✅ Complete | 2025-10-17 |
| Clean Git history | ⏳ Pending | - |
| Generate new service account key | ⏳ Pending | - |
| Update GitHub Actions secret | ⏳ Pending | - |
| Update Firebase Secret Manager | ⏳ Pending | - |
| Review audit logs | ⏳ Pending | - |
| Verify cleanup | ⏳ Pending | - |

---

**Last Updated:** October 17, 2025
**Document Owner:** Security Team
**Next Review:** After all remediation steps complete
