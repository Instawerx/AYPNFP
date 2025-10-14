# 🔐 Admin User Setup Guide

**Last Updated:** Oct 14, 2024, 3:55 AM

This guide will help you create your first admin user and access the full platform.

---

## 📋 **Step-by-Step Setup**

### **Step 1: Start the Web App Locally**

```powershell
cd C:\AYPNFP\apps\web
npm run dev
```

Visit: http://localhost:3000

---

### **Step 2: Create Your First User**

1. **Go to the login page:** http://localhost:3000/login
2. **Sign up with email/password** or use Google/Microsoft sign-in
3. **Note your email address** - you'll need it for the next step

---

### **Step 3: Get Your User ID from Firebase Console**

1. **Open Firebase Console:** https://console.firebase.google.com/project/adopt-a-young-parent/authentication/users
2. **Find your user** in the Authentication > Users list
3. **Copy your User UID** (looks like: `abc123xyz456...`)

---

### **Step 4: Set Admin Custom Claims**

You need to run a script to give yourself admin permissions. We'll use the Firebase Admin SDK.

#### **Option A: Using Firebase CLI (Recommended)**

Create a temporary script to set your admin claims:

**Create file:** `firebase/set-admin.js`

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

async function setAdminClaims(uid) {
  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      orgId: 'aayp-main',
      role: 'admin',
      scopes: [
        'admin.read',
        'admin.write',
        'finance.read',
        'finance.write',
        'hr.read',
        'hr.write',
        'campaign.read',
        'campaign.write',
        'donor.read',
        'donor.write'
      ]
    });

    console.log('✅ Admin claims set successfully!');
    console.log('User UID:', uid);
    console.log('Role: admin');
    console.log('Organization: aayp-main');
    
    // Verify claims
    const user = await admin.auth().getUser(uid);
    console.log('\nCustom Claims:', user.customClaims);
    
  } catch (error) {
    console.error('❌ Error setting claims:', error);
  }
}

// Replace with your User UID
const YOUR_USER_UID = 'PASTE_YOUR_UID_HERE';

setAdminClaims(YOUR_USER_UID)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Run the script:**

```powershell
cd C:\AYPNFP\firebase
node set-admin.js
```

---

#### **Option B: Using Firebase Console (Manual)**

Unfortunately, Firebase Console doesn't have a UI for custom claims. You must use Option A or Option C.

---

#### **Option C: Using Cloud Functions (One-time)**

Create a temporary HTTP function to set admin claims:

**Add to `firebase/functions/src/index.ts`:**

```typescript
export const setAdminClaims = onRequest(async (req, res) => {
  // SECURITY: Remove this function after first use!
  const { uid, secret } = req.body;
  
  // Simple secret check (change this!)
  if (secret !== 'CHANGE_ME_PLEASE') {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    await admin.auth().setCustomUserClaims(uid, {
      orgId: 'aayp-main',
      role: 'admin',
      scopes: [
        'admin.read',
        'admin.write',
        'finance.read',
        'finance.write',
        'hr.read',
        'hr.write',
        'campaign.read',
        'campaign.write',
        'donor.read',
        'donor.write'
      ]
    });

    res.json({ success: true, message: 'Admin claims set!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Deploy the function:**

```powershell
cd C:\AYPNFP
firebase deploy --only functions:setAdminClaims
```

**Call the function:**

```powershell
curl -X POST https://us-central1-adopt-a-young-parent.cloudfunctions.net/setAdminClaims `
  -H "Content-Type: application/json" `
  -d '{"uid":"YOUR_USER_UID","secret":"CHANGE_ME_PLEASE"}'
```

**⚠️ IMPORTANT:** Delete this function after use for security!

---

### **Step 5: Create Organization Document**

Your organization data needs to exist in Firestore:

**Go to Firebase Console:** https://console.firebase.google.com/project/adopt-a-young-parent/firestore

**Create a new document:**
- **Collection:** `orgs`
- **Document ID:** `aayp-main`
- **Fields:**

```json
{
  "name": "ADOPT A YOUNG PARENT",
  "ein": "83-0297893",
  "stateEntityId": "803297893",
  "filingNumber": "224860800370",
  "jurisdiction": "Michigan",
  "address": {
    "street": "Your Street Address",
    "city": "Your City",
    "state": "MI",
    "zip": "48000"
  },
  "contact": {
    "email": "info@adoptayoungparent.org",
    "phone": "(555) 123-4567"
  },
  "branding": {
    "primaryColor": "#667eea",
    "logo": ""
  },
  "createdAt": "2024-10-14T08:00:00Z",
  "updatedAt": "2024-10-14T08:00:00Z"
}
```

---

### **Step 6: Log Out and Log Back In**

1. **Log out** of the web app
2. **Log back in** with the same account
3. **Your admin claims will now be active!**

---

### **Step 7: Verify Admin Access**

Once logged in, you should see:

1. **Admin Portal** in the navigation
2. **All portal sections** accessible:
   - Admin
   - Finance
   - Manager
   - Fundraiser
   - Employee
   - Donor

3. **Full permissions** to:
   - Create users
   - Manage roles
   - View all data
   - Access all features

---

## 🎯 **Quick Test Checklist**

After setup, test these features:

- [ ] Login works
- [ ] Admin portal accessible
- [ ] Can view users (Admin > Users)
- [ ] Can create campaigns (Manager > Campaigns)
- [ ] Can view donations (Finance > Transactions)
- [ ] Can manage employees (Employee portal)
- [ ] Can view donor portal

---

## 🔧 **Troubleshooting**

### **"Access Denied" after login**

**Cause:** Custom claims not set or not refreshed

**Solution:**
1. Log out completely
2. Clear browser cache
3. Log back in
4. Check Firebase Console > Authentication > Users > Your user > Custom claims

### **"Organization not found"**

**Cause:** Organization document doesn't exist in Firestore

**Solution:**
1. Go to Firestore Console
2. Create `orgs/aayp-main` document (see Step 5)

### **Can't access certain portals**

**Cause:** Missing scopes in custom claims

**Solution:**
1. Re-run the set-admin script with all scopes
2. Log out and log back in

---

## 📝 **Recommended: Create More Users**

Once you have admin access, you can create users with different roles:

### **Finance User:**
```json
{
  "orgId": "aayp-main",
  "role": "finance",
  "scopes": ["finance.read", "finance.write"]
}
```

### **Fundraiser:**
```json
{
  "orgId": "aayp-main",
  "role": "fundraiser",
  "scopes": ["campaign.read", "donor.read", "donor.write"]
}
```

### **Donor (Regular User):**
```json
{
  "orgId": "aayp-main",
  "role": "donor",
  "scopes": ["donor.read"]
}
```

---

## 🚀 **Next Steps**

After admin setup:

1. ✅ Test all portal features
2. ✅ Create test campaigns
3. ✅ Add test donors
4. ✅ Test donation flow (use Stripe test mode)
5. ✅ Implement navigation (see NAVIGATION_IMPLEMENTATION.md)

---

**Need Help?** Check the Firebase Console logs or contact support.
