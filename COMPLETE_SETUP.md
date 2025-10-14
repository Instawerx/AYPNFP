# 🚀 Complete Firebase Setup Guide

**Follow these steps in order to get everything working!**

---

## ✅ **STEP 1: Initialize Firebase Project**

### **Option A: Use Existing Firebase Project**

```powershell
# List your Firebase projects
firebase projects:list

# Select your project (replace with your actual project ID)
firebase use your-firebase-project-id

# Or add it with an alias
firebase use --add
```

### **Option B: Create New Firebase Project**

```powershell
# Create new project in Firebase Console first:
# https://console.firebase.google.com

# Then select it
firebase use --add
```

---

## ✅ **STEP 2: Install All Dependencies**

```powershell
# Make sure you're in the root directory
cd c:\AYPNFP

# Install root dependencies
npm install

# Install Functions dependencies
cd firebase\functions
npm install
cd ..\..

# Install Web app dependencies
cd apps\web
npm install
cd ..\..
```

---

## ✅ **STEP 3: Configure airSlate Credentials**

```powershell
# Run this single command (all on one line)
firebase functions:config:set airslate.client_id="b424f954-c331-4754-af4c-86853f1f3006" airslate.client_secret="tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE" airslate.username="tabor.dangelo@gmail.com" airslate.password="TacoBell23!" airslate.organization_id="AFYPNFP"

# Verify it worked
firebase functions:config:get
```

---

## ✅ **STEP 4: Deploy Firestore Rules & Indexes**

```powershell
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

## ✅ **STEP 5: Deploy Storage Rules**

```powershell
firebase deploy --only storage
```

---

## ✅ **STEP 6: Build and Deploy Functions**

```powershell
# Navigate to functions directory
cd firebase\functions

# Build TypeScript
npm run build

# Go back to root
cd ..\..

# Deploy functions
firebase deploy --only functions
```

---

## ✅ **STEP 7: Build and Deploy Web App**

```powershell
# Navigate to web app
cd apps\web

# Build Next.js app
npm run build

# Go back to root
cd ..\..

# Deploy to hosting
firebase deploy --only hosting
```

---

## ✅ **STEP 8: Deploy Everything at Once** (Alternative)

```powershell
# From root directory
firebase deploy
```

---

## 🧪 **STEP 9: Test with Emulators (Optional)**

```powershell
# Start all emulators
firebase emulators:start

# Open Emulator UI
# http://localhost:4000
```

---

## 🌱 **STEP 10: Seed Database**

```powershell
# Download service account key from Firebase Console:
# Settings → Service Accounts → Generate New Private Key
# Save as: firebase/serviceAccountKey.json

# Run seed script
npx ts-node firebase/seed-data.ts
```

---

## 🔍 **TROUBLESHOOTING**

### **Error: No currently active project**

```powershell
# List available projects
firebase projects:list

# Select a project
firebase use your-project-id
```

### **Error: 'next' is not recognized**

```powershell
# Install dependencies in web app
cd apps\web
npm install
cd ..\..
```

### **Error: Not in a Firebase app directory**

```powershell
# Make sure you're in the root directory (c:\AYPNFP)
cd c:\AYPNFP

# Check if firebase.json exists
dir firebase.json
```

### **Error: Cannot find module**

```powershell
# Reinstall all dependencies
npm install
cd firebase\functions && npm install && cd ..\..
cd apps\web && npm install && cd ..\..
```

---

## 📋 **QUICK CHECKLIST**

- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Project selected (`firebase use --add`)
- [ ] Root dependencies installed (`npm install`)
- [ ] Functions dependencies installed
- [ ] Web app dependencies installed
- [ ] airSlate credentials configured
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Storage rules deployed
- [ ] Functions deployed
- [ ] Hosting deployed
- [ ] Database seeded

---

## 🎯 **COMPLETE SETUP SCRIPT**

Run these commands in order:

```powershell
# 1. Navigate to project
cd c:\AYPNFP

# 2. Login to Firebase
firebase login

# 3. Select/create project
firebase use --add

# 4. Install dependencies
npm install
cd firebase\functions && npm install && cd ..\..
cd apps\web && npm install && cd ..\..

# 5. Configure airSlate
firebase functions:config:set airslate.client_id="b424f954-c331-4754-af4c-86853f1f3006" airslate.client_secret="tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE" airslate.username="tabor.dangelo@gmail.com" airslate.password="TacoBell23!" airslate.organization_id="AFYPNFP"

# 6. Deploy everything
firebase deploy

# 7. Done! 🎉
```

---

**Status:** Ready to Deploy!  
**Next:** Follow the steps above in order! 🚀
