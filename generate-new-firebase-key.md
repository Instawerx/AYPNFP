# 🔐 Generate New Firebase Service Account Key

**Purpose:** Replace the compromised Firebase service account key
**Status:** Required immediately after Git history cleanup
**Time Required:** 15-20 minutes

---

## ⚠️ Prerequisites

Before starting:
- ✅ Git history has been cleaned (exposed key removed)
- ✅ Repository has been force-pushed to GitHub
- ✅ Old key has been disabled (Google may have done this automatically)
- ✅ You have Owner or Editor role in Firebase project

---

## 📋 Step-by-Step Instructions

### Step 1: Generate New Service Account Key

#### Via Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Project**
   - Click on project: **adopt-a-young-parent**

3. **Navigate to Service Accounts**
   - Click the Settings icon (⚙️) in the left sidebar
   - Select "Project settings"
   - Click the "Service accounts" tab

4. **Generate New Key**
   - Scroll down to "Firebase Admin SDK" section
   - Click "Generate new private key" button
   - A warning dialog will appear
   - Click "Generate key" to confirm

5. **Save the Key Securely**
   - A JSON file will download automatically
   - **Rename it to:** `firebase-service-account.json`
   - **Move it to a secure location OUTSIDE the repository:**
     - Windows: `C:\secure\firebase-service-account.json`
     - Mac/Linux: `~/secure/firebase-service-account.json`
   - **Set secure file permissions:**
     ```bash
     # Mac/Linux
     chmod 600 ~/secure/firebase-service-account.json

     # Windows (PowerShell as Administrator)
     icacls "C:\secure\firebase-service-account.json" /inheritance:r /grant:r "$($env:USERNAME):(F)"
     ```

#### Via gcloud CLI (Alternative)

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project adopt-a-young-parent

# Create new service account key
gcloud iam service-accounts keys create ~/secure/firebase-service-account.json \
  --iam-account=firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com
```

---

### Step 2: Verify the New Key

1. **Check File Contents**
   ```bash
   # View the file (don't share this output!)
   cat ~/secure/firebase-service-account.json
   ```

2. **Verify Required Fields**
   The JSON should contain:
   - ✅ `type`: "service_account"
   - ✅ `project_id`: "adopt-a-young-parent"
   - ✅ `private_key_id`: A new unique ID (different from old key)
   - ✅ `private_key`: BEGIN PRIVATE KEY...
   - ✅ `client_email`: firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com

3. **Document the Key ID**
   ```bash
   # Extract key ID for documentation
   cat ~/secure/firebase-service-account.json | grep "private_key_id"
   ```

   **Save this key ID for your records** (not sensitive, used for tracking)

---

### Step 3: Update GitHub Actions Secret

1. **Go to GitHub Repository Settings**
   - URL: https://github.com/Instawerx/AYPNFP/settings/secrets/actions
   - Or: Repository → Settings → Secrets and variables → Actions

2. **Update FIREBASE_SERVICE_ACCOUNT Secret**
   - Find the secret named: `FIREBASE_SERVICE_ACCOUNT`
   - Click "Update" (or "New repository secret" if it doesn't exist)
   - **Value:** Paste the ENTIRE contents of the JSON file
     ```bash
     # Copy file contents to clipboard (Windows)
     Get-Content C:\secure\firebase-service-account.json | Set-Clipboard

     # Copy file contents to clipboard (Mac)
     cat ~/secure/firebase-service-account.json | pbcopy

     # Copy file contents to clipboard (Linux with xclip)
     cat ~/secure/firebase-service-account.json | xclip -selection clipboard
     ```
   - Click "Update secret"

3. **Verify Secret is Updated**
   - The secret should show "Updated X seconds ago"
   - You won't be able to view the secret value (this is normal)

---

### Step 4: Update Firebase Secret Manager

1. **Extract Private Key**
   ```powershell
   # Windows PowerShell
   $serviceAccount = Get-Content C:\secure\firebase-service-account.json | ConvertFrom-Json
   $privateKey = $serviceAccount.private_key
   $privateKey | Out-File -FilePath C:\secure\temp-private-key.txt -Encoding UTF8 -NoNewline
   ```

   ```bash
   # Mac/Linux
   cat ~/secure/firebase-service-account.json | jq -r '.private_key' > ~/secure/temp-private-key.txt
   ```

2. **Update Secret in Firebase**
   ```bash
   # Update or create the secret
   firebase apphosting:secrets:set firebase-admin-private-key \
     --data-file=C:\secure\temp-private-key.txt \
     --project=adopt-a-young-parent
   ```

3. **Delete Temporary File**
   ```bash
   # Windows
   Remove-Item C:\secure\temp-private-key.txt

   # Mac/Linux
   rm ~/secure/temp-private-key.txt
   ```

4. **Verify Secret in Firebase**
   ```bash
   # List all secrets
   firebase apphosting:secrets:list --project=adopt-a-young-parent

   # Should show: firebase-admin-private-key (with updated timestamp)
   ```

---

### Step 5: Update Environment Variables (Local Development)

1. **Set Environment Variable**
   ```powershell
   # Windows PowerShell (temporary - current session only)
   $env:FIREBASE_SERVICE_ACCOUNT_PATH="C:\secure\firebase-service-account.json"

   # Windows PowerShell (permanent - user level)
   [System.Environment]::SetEnvironmentVariable('FIREBASE_SERVICE_ACCOUNT_PATH', 'C:\secure\firebase-service-account.json', 'User')

   # Mac/Linux (add to ~/.bashrc or ~/.zshrc)
   echo 'export FIREBASE_SERVICE_ACCOUNT_PATH=~/secure/firebase-service-account.json' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Verify Environment Variable**
   ```powershell
   # Windows PowerShell
   $env:FIREBASE_SERVICE_ACCOUNT_PATH

   # Mac/Linux
   echo $FIREBASE_SERVICE_ACCOUNT_PATH
   ```

   Should output the path to your credential file.

---

### Step 6: Test the New Key

1. **Test Locally**
   ```bash
   # Run the Firebase setup script
   .\setup-firebase-secret.ps1

   # Should detect the environment variable and use it
   ```

2. **Test GitHub Actions**
   ```bash
   # Push a commit to trigger CI/CD
   git add .
   git commit -m "test: verify new Firebase credentials"
   git push origin main
   ```

   - Go to: https://github.com/Instawerx/AYPNFP/actions
   - Watch the workflow run
   - Verify "deploy-functions" job succeeds

3. **Test Firebase Deployment**
   ```bash
   # Deploy to Firebase App Hosting
   firebase deploy --only apphosting:aaypnfp --project=adopt-a-young-parent
   ```

   - Should complete without authentication errors
   - Check for "Deploy complete!" message

4. **Verify Application Functions**
   - Visit your application URL
   - Test user authentication
   - Test Firestore operations (if applicable)
   - Check Firebase Functions logs for errors

---

### Step 7: Revoke Old Key (CRITICAL)

**⚠️ IMPORTANT:** Only do this AFTER verifying the new key works!

1. **Go to Service Accounts Page**
   - Firebase Console → Project settings → Service accounts
   - Or GCP Console: https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Find the Old Key**
   - Service account: `firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com`
   - Look for key ID: `813342c77db74eea85ab569b136749aa6702b8eb`
   - Status may already be "Disabled" (Google may have disabled it)

3. **Delete the Old Key**
   - Click on the service account
   - Go to the "Keys" tab
   - Find the old key
   - Click the three dots (⋮) menu
   - Select "Delete"
   - Confirm deletion

4. **Verify Key is Gone**
   ```bash
   # List all keys for service account
   gcloud iam service-accounts keys list \
     --iam-account=firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com

   # Old key ID (813342c77d...) should NOT appear
   ```

---

### Step 8: Update Documentation

1. **Update SECURITY_CREDENTIAL_MANAGEMENT.md**
   - Update the "Credential Inventory" table
   - Set "Last Rotated" date to today
   - Set "Next Rotation" date to 90 days from now
   - Add new key ID to tracking

2. **Update PROJECT_STATUS.md**
   - Mark service account as secured
   - Update deployment status

3. **Log the Change**
   - Add entry to change log in security documentation
   - Include date, what was changed, and who did it

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] New service account key generated and saved securely
- [ ] File is stored OUTSIDE the repository
- [ ] File permissions are restricted (600 or equivalent)
- [ ] GitHub Actions secret updated
- [ ] Firebase Secret Manager updated
- [ ] Environment variables set for local development
- [ ] Local development tested successfully
- [ ] GitHub Actions workflow tested successfully
- [ ] Firebase deployment tested successfully
- [ ] Application functions correctly
- [ ] Old key deleted from Firebase/GCP
- [ ] Documentation updated
- [ ] Key ID recorded for tracking
- [ ] Team notified of credential change

---

## 🚨 Troubleshooting

### Error: "Permission denied" when accessing key file

**Solution:**
```bash
# Mac/Linux
chmod 600 ~/secure/firebase-service-account.json

# Windows (PowerShell as Administrator)
icacls "C:\secure\firebase-service-account.json" /inheritance:r /grant:r "$($env:USERNAME):(F)"
```

### Error: "Could not authenticate with Firebase"

**Check:**
1. Verify key file path is correct
2. Verify JSON file is valid (use a JSON validator)
3. Verify service account has required permissions
4. Check if service account is enabled in GCP

**Solution:**
```bash
# Verify service account status
gcloud iam service-accounts describe firebase-adminsdk-fbsvc@adopt-a-young-parent.iam.gserviceaccount.com
```

### Error: "Secret not found" in GitHub Actions

**Solution:**
1. Go to repository settings → Secrets
2. Verify `FIREBASE_SERVICE_ACCOUNT` exists
3. Re-add the secret if missing
4. Ensure it's a repository secret, not environment secret

### Deployment fails with authentication error

**Check:**
1. Verify Firebase Secret Manager has the correct key
2. Check apphosting.yaml references the correct secret name
3. Verify service account has Firebase Admin permissions

**Solution:**
```bash
# Check secret exists
firebase apphosting:secrets:list

# Check service account permissions
gcloud projects get-iam-policy adopt-a-young-parent \
  --flatten="bindings[].members" \
  --filter="bindings.members:firebase-adminsdk-fbsvc@*"
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the [SECURITY_CREDENTIAL_MANAGEMENT.md](./SECURITY_CREDENTIAL_MANAGEMENT.md) documentation
2. Review Firebase Admin SDK setup guide
3. Contact the project lead
4. For security emergencies, escalate immediately

---

## 📊 Post-Completion Tracking

**Record this information:**

| Field | Value |
|-------|-------|
| Date Generated | [Today's date] |
| New Key ID | [from private_key_id field] |
| Old Key ID | 813342c77db74eea85ab569b136749aa6702b8eb |
| Generated By | [Your name] |
| Reason | Credential exposure incident |
| Verified Working | [ ] Yes [ ] No |
| Old Key Deleted | [ ] Yes [ ] No |
| Next Rotation Due | [90 days from today] |

---

**✅ Key Generation Complete!**

Remember:
- 🔒 Never commit this key file to Git
- 📍 Store it securely outside the repository
- 🔄 Rotate every 90 days
- 📝 Keep documentation updated
