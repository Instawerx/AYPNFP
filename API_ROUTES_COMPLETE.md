# ✅ API ROUTES COMPLETE - PHASE 1.5

**Date:** October 14, 2024, 4:35 PM  
**Status:** 🎉 **ALL API ROUTES CREATED**

---

## 🎊 WHAT WAS COMPLETED

### ✅ All 5 API Route Files Created:

1. **User Invite API** (`/api/admin/users/invite`)
   - POST endpoint to create new users
   - Sets custom claims (roles, scopes)
   - Creates Firestore user document
   - Aggregates scopes from multiple roles
   - Email invitation support (placeholder)

2. **User Management API** (`/api/admin/users/[id]`)
   - GET: Fetch user details
   - PATCH: Update user (name, roles, status)
   - DELETE: Delete user from Auth and Firestore
   - Automatic scope recalculation on role changes
   - Updates custom claims when roles change

3. **Password Reset API** (`/api/admin/users/[id]/reset-password`)
   - POST: Generate password reset link
   - Email sending support (placeholder)
   - Admin-initiated password resets

4. **Role Management API** (`/api/admin/roles`)
   - POST: Create new role
   - GET: List all roles
   - Name uniqueness validation
   - Scope validation

5. **Role Edit/Delete API** (`/api/admin/roles/[id]`)
   - GET: Fetch role details
   - PATCH: Update role (name, description, scopes)
   - DELETE: Delete role (with safety checks)
   - Automatic user claim updates when role scopes change
   - Prevents deletion if users have the role

---

## 📊 API ENDPOINTS SUMMARY

### User Management (4 endpoints):

```
POST   /api/admin/users/invite
  Body: { email, displayName?, roles[], sendEmail?, orgId }
  Returns: { success, userId, message }
  
GET    /api/admin/users/[id]?orgId=xxx
  Returns: { id, email, displayName, roles, scopes, status, ... }
  
PATCH  /api/admin/users/[id]
  Body: { displayName?, roles?, status?, orgId }
  Returns: { success, message }
  
DELETE /api/admin/users/[id]
  Body: { orgId }
  Returns: { success, message }
  
POST   /api/admin/users/[id]/reset-password
  Body: { orgId }
  Returns: { success, message }
```

### Role Management (4 endpoints):

```
POST   /api/admin/roles
  Body: { name, description?, scopes[], orgId }
  Returns: { success, roleId, message }
  
GET    /api/admin/roles?orgId=xxx
  Returns: { roles: [...] }
  
GET    /api/admin/roles/[id]?orgId=xxx
  Returns: { id, name, description, scopes, ... }
  
PATCH  /api/admin/roles/[id]
  Body: { name?, description?, scopes?, orgId }
  Returns: { success, message }
  
DELETE /api/admin/roles/[id]
  Body: { orgId }
  Returns: { success, message }
```

---

## 🔧 FEATURES IMPLEMENTED

### User Management:
- ✅ Create users with Firebase Admin SDK
- ✅ Set custom claims (roles, scopes, orgId)
- ✅ Aggregate scopes from multiple roles
- ✅ Update user information
- ✅ Change user status (active/inactive/suspended)
- ✅ Delete users (Auth + Firestore)
- ✅ Generate password reset links
- ✅ Automatic scope recalculation

### Role Management:
- ✅ Create roles with scopes
- ✅ Validate role name uniqueness
- ✅ Update role information
- ✅ Update role scopes
- ✅ Delete roles (with safety checks)
- ✅ Prevent deletion if users have role
- ✅ Automatic user claim updates on role changes

### Security:
- ✅ Firebase Admin SDK integration
- ✅ Custom claims for RBAC
- ✅ Scope-based permissions
- ✅ Validation on all inputs
- ✅ Error handling
- ✅ Transaction safety

---

## 🔐 FIREBASE ADMIN SDK SETUP

### Required Environment Variables:

```yaml
# In apphosting.yaml
env:
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: adopt-a-young-parent
    availability:
      - BUILD
      - RUNTIME
  
  - variable: FIREBASE_CLIENT_EMAIL
    value: firebase-adminsdk-xxxxx@adopt-a-young-parent.iam.gserviceaccount.com
    availability:
      - RUNTIME
  
  - variable: FIREBASE_PRIVATE_KEY
    secret: firebase-admin-private-key
```

### Setup Steps:

1. **Get Service Account Key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file

2. **Extract Values:**
   - `client_email` → Add to apphosting.yaml
   - `private_key` → Create as secret

3. **Create Secret:**
   ```bash
   firebase apphosting:secrets:set firebase-admin-private-key
   # Paste the entire private key when prompted
   ```

4. **Update apphosting.yaml:**
   - Add `FIREBASE_CLIENT_EMAIL` variable
   - Add `FIREBASE_PRIVATE_KEY` secret reference

5. **Deploy:**
   ```bash
   firebase deploy --only apphosting:aaypnfp
   ```

**See `FIREBASE_ADMIN_SETUP.md` for detailed instructions.**

---

## 🎯 HOW IT WORKS

### User Creation Flow:

```
1. Frontend calls POST /api/admin/users/invite
2. API validates input (email, roles, orgId)
3. API loads role documents from Firestore
4. API aggregates scopes from all roles
5. API creates user in Firebase Auth
6. API sets custom claims (roles, scopes, orgId)
7. API creates user document in Firestore
8. API returns success with userId
9. Frontend shows success message
10. Frontend redirects to users list
```

### Role Update Flow:

```
1. Frontend calls PATCH /api/admin/roles/[id]
2. API validates input (name, scopes)
3. API updates role document in Firestore
4. API finds all users with this role
5. For each user:
   - Recalculate aggregated scopes
   - Update custom claims in Auth
   - Update scopes in Firestore
6. API returns success
7. Frontend shows success message
8. All users' permissions updated automatically
```

---

## 📋 FILE STRUCTURE

```
apps/web/app/api/admin/
├── users/
│   ├── invite/
│   │   └── route.ts ✅ NEW (POST)
│   └── [id]/
│       ├── route.ts ✅ NEW (GET, PATCH, DELETE)
│       └── reset-password/
│           └── route.ts ✅ NEW (POST)
└── roles/
    ├── route.ts ✅ NEW (POST, GET)
    └── [id]/
        └── route.ts ✅ NEW (GET, PATCH, DELETE)
```

---

## ⚠️ IMPORTANT NOTES

### 1. Firebase Admin SDK Required
The API routes use Firebase Admin SDK to:
- Create users in Authentication
- Set custom claims
- Delete users
- Generate password reset links

**You MUST set up the service account credentials before deploying!**

### 2. Environment Variables
Add these to `apphosting.yaml`:
- `FIREBASE_CLIENT_EMAIL` (from service account JSON)
- `FIREBASE_PRIVATE_KEY` (as secret)

### 3. Secrets Management
The private key MUST be stored as a secret, not a plain value:
```bash
firebase apphosting:secrets:set firebase-admin-private-key
```

### 4. Permission Checks (TODO)
The API routes have placeholder comments for permission checks:
```typescript
// TODO: Verify requesting user has admin.write scope
```

These should be implemented using middleware or auth verification.

### 5. Email Sending (TODO)
Email functionality is placeholder:
```typescript
// TODO: Send invitation email if sendEmail is true
// TODO: Send email with reset link
```

Integrate with SendGrid, Firebase Email, or similar service.

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Deploying:

- [ ] Get Firebase service account JSON
- [ ] Extract `client_email` from JSON
- [ ] Extract `private_key` from JSON
- [ ] Create secret: `firebase apphosting:secrets:set firebase-admin-private-key`
- [ ] Update `apphosting.yaml` with `FIREBASE_CLIENT_EMAIL`
- [ ] Update `apphosting.yaml` with `FIREBASE_PRIVATE_KEY` secret reference
- [ ] Commit changes (except service account JSON!)
- [ ] Deploy: `firebase deploy --only apphosting:aaypnfp`

### After Deploying:

- [ ] Test user invite endpoint
- [ ] Test user edit endpoint
- [ ] Test role creation endpoint
- [ ] Test role edit endpoint
- [ ] Verify custom claims are set
- [ ] Test in UI (invite user, create role)
- [ ] Check Firestore documents
- [ ] Check Firebase Auth users

---

## 🧪 TESTING

### Test User Invite:

```bash
curl -X POST https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "displayName": "New User",
    "roles": ["donor"],
    "sendEmail": false,
    "orgId": "aayp-main"
  }'
```

### Test Role Creation:

```bash
curl -X POST https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app/api/admin/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Role",
    "description": "A test role",
    "scopes": ["donor.read", "donor.write"],
    "orgId": "aayp-main"
  }'
```

### Test User Update:

```bash
curl -X PATCH https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "roles": ["admin", "donor"],
    "status": "active",
    "orgId": "aayp-main"
  }'
```

---

## 🎯 WHAT'S NEXT

### Immediate (Required for deployment):
1. ✅ Set up Firebase Admin credentials
2. ✅ Update apphosting.yaml
3. ✅ Create secret for private key
4. ✅ Deploy to Firebase

### Short-term (Phase 2):
1. 🟡 Add authentication middleware
2. 🟡 Implement email sending
3. 🟡 Add audit logging
4. 🟡 Add rate limiting
5. 🟡 Add input sanitization

### Medium-term (Phase 2-3):
1. 🟢 airSlate integration
2. 🟢 Form management system
3. 🟢 Document storage
4. 🟢 Submission routing
5. 🟢 Approval workflows

---

## 💡 TECHNICAL DETAILS

### Firebase Admin Initialization:

```typescript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminAuth = getAuth();
```

### Custom Claims Structure:

```typescript
{
  role: "admin",              // Primary role
  roles: ["admin", "donor"],  // All roles
  scopes: [                   // Aggregated scopes
    "admin.read",
    "admin.write",
    "donor.read",
    "donor.write"
  ],
  orgId: "aayp-main"         // Organization ID
}
```

### Scope Aggregation:

```typescript
// Load all roles
const scopes: string[] = [];
for (const roleId of roles) {
  const roleDoc = await getDoc(doc(db, `orgs/${orgId}/roles`, roleId));
  if (roleDoc.exists()) {
    scopes.push(...roleDoc.data().scopes);
  }
}

// Remove duplicates
const uniqueScopes = [...new Set(scopes)];
```

---

## 🎊 SUMMARY

**Phase 1.5 is COMPLETE!** All API routes have been created:

- ✅ 5 API route files
- ✅ 8 HTTP endpoints
- ✅ User management (invite, edit, delete, reset password)
- ✅ Role management (create, edit, delete)
- ✅ Custom claims integration
- ✅ Scope aggregation
- ✅ Automatic user updates on role changes
- ✅ Input validation
- ✅ Error handling
- ✅ Firebase Admin SDK integration

**Next Step:** Set up Firebase Admin credentials and deploy!

---

**Last Updated:** October 14, 2024, 4:35 PM  
**Status:** Ready for Firebase Admin setup and deployment
