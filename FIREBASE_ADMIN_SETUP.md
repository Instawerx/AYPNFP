# 🔐 Firebase Admin SDK Setup Guide

**Required for:** User and Role Management API Routes

---

## 📋 WHAT YOU NEED

The API routes need Firebase Admin SDK credentials to:
- Create users in Firebase Authentication
- Set custom claims (roles, scopes)
- Delete users
- Generate password reset links

---

## 🎯 STEP 1: Get Service Account Key

### Option A: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **adopt-a-young-parent**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** (downloads a JSON file)
7. **IMPORTANT:** Keep this file secure! Never commit to git!

### Option B: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **adopt-a-young-parent**
3. Go to **IAM & Admin** → **Service Accounts**
4. Find the Firebase Admin SDK service account
5. Click **Actions** (⋮) → **Manage Keys**
6. Click **Add Key** → **Create New Key**
7. Choose **JSON** format
8. Click **Create** (downloads JSON file)

---

## 🎯 STEP 2: Extract Required Values

Open the downloaded JSON file. You need these 3 values:

```json
{
  "type": "service_account",
  "project_id": "adopt-a-young-parent",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@adopt-a-young-parent.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**Extract:**
1. `project_id` → Already have this (adopt-a-young-parent)
2. `client_email` → Copy this value
3. `private_key` → Copy this value (including the `-----BEGIN/END-----` lines)

---

## 🎯 STEP 3: Add to Firebase App Hosting

### Update apphosting.yaml

Add these environment variables to `apps/web/apphosting.yaml`:

```yaml
env:
  # ... existing variables ...
  
  # Firebase Admin SDK (for API routes)
  - variable: FIREBASE_CLIENT_EMAIL
    value: firebase-adminsdk-xxxxx@adopt-a-young-parent.iam.gserviceaccount.com
    availability:
      - RUNTIME
  
  - variable: FIREBASE_PRIVATE_KEY
    secret: firebase-admin-private-key
```

### Create Secret for Private Key

**IMPORTANT:** The private key must be stored as a **secret**, not a plain value!

#### Using Firebase CLI:

```bash
# Navigate to project root
cd c:/AYPNFP

# Create secret (you'll be prompted to paste the key)
firebase apphosting:secrets:set firebase-admin-private-key

# When prompted, paste the ENTIRE private key including:
# -----BEGIN PRIVATE KEY-----
# ... (the key content)
# -----END PRIVATE KEY-----
```

#### Using Google Cloud Console:

1. Go to [Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Click **Create Secret**
3. Name: `firebase-admin-private-key`
4. Secret value: Paste the entire private key
5. Click **Create Secret**
6. Grant access to Firebase App Hosting service account

---

## 🎯 STEP 4: Update apphosting.yaml (Complete)

Here's the complete environment section:

```yaml
env:
  # Firebase Configuration (existing)
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSyDWmfX1jYaIsFUucmyno6EBjdZNFTh6k_0
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: adopt-a-young-parent.firebaseapp.com
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: adopt-a-young-parent
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: adopt-a-young-parent.firebasestorage.app
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "499950524793"
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: 1:499950524793:web:9016b05e3aa3cc795277a8
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    value: G-FGJDKEK435
    availability:
      - BUILD
      - RUNTIME
  
  # App Configuration (existing)
  - variable: NEXT_PUBLIC_ORG_ID
    value: aayp-main
    availability:
      - BUILD
      - RUNTIME
  
  - variable: NEXT_PUBLIC_APP_URL
    value: https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app
    availability:
      - BUILD
      - RUNTIME
  
  # Firebase Admin SDK (NEW)
  - variable: FIREBASE_CLIENT_EMAIL
    value: YOUR_CLIENT_EMAIL_HERE
    availability:
      - RUNTIME
  
  - variable: FIREBASE_PRIVATE_KEY
    secret: firebase-admin-private-key
```

---

## 🎯 STEP 5: Deploy

After adding the environment variables:

```bash
firebase deploy --only apphosting:aaypnfp
```

---

## ✅ VERIFICATION

After deployment, test the API routes:

### Test User Invite:
```bash
curl -X POST https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "displayName": "Test User",
    "roles": ["donor"],
    "sendEmail": false,
    "orgId": "aayp-main"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "userId": "abc123...",
  "message": "User invited successfully"
}
```

---

## 🔒 SECURITY NOTES

### DO:
- ✅ Store private key as a secret
- ✅ Use environment variables
- ✅ Keep service account JSON file secure
- ✅ Never commit credentials to git
- ✅ Rotate keys periodically

### DON'T:
- ❌ Hardcode credentials in code
- ❌ Commit service account JSON to git
- ❌ Share private keys via email/chat
- ❌ Store keys in plain text files
- ❌ Use the same key for dev and prod

---

## 🐛 TROUBLESHOOTING

### Error: "Firebase Admin initialization error"
- Check that `FIREBASE_CLIENT_EMAIL` is set correctly
- Verify `FIREBASE_PRIVATE_KEY` secret exists
- Ensure private key includes `-----BEGIN/END-----` lines

### Error: "Failed to create user"
- Verify service account has correct permissions
- Check Firebase Authentication is enabled
- Ensure email is not already in use

### Error: "Permission denied"
- Grant service account "Firebase Admin SDK Administrator" role
- Check IAM permissions in Google Cloud Console

---

## 📊 REQUIRED PERMISSIONS

The service account needs these roles:
- **Firebase Admin SDK Administrator Service Agent** (default)
- **Service Account Token Creator** (for custom claims)

These are usually granted automatically when you create the service account.

---

## 🎯 NEXT STEPS

After setup:
1. ✅ Deploy with new environment variables
2. ✅ Test user invite endpoint
3. ✅ Test role creation endpoint
4. ✅ Verify custom claims are set
5. ✅ Test full user management flow

---

**Last Updated:** October 14, 2024, 4:30 PM
