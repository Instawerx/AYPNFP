# 🔑 airSlate Credentials Setup - Quick Reference

**Your airSlate Account:** tabor.dangelo@gmail.com  
**Authentication Method:** API Password Grant (OAuth 2.0)

---

## 📋 YOUR CREDENTIALS

### **Client ID**
```
b424f954-c331-4754-af4c-86853f1f3006
```

### **Client Secret**
```
tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE
```

### **Username**
```
tabor.dangelo@gmail.com
```

### **Password**
```
[Your airSlate account password]
```

### **Organization ID**
```
[Get this from airSlate dashboard]
```

---

## 🚀 QUICK SETUP

### **Step 1: Set Firebase Functions Config**

Open PowerShell/Terminal and run:

```bash
firebase functions:config:set \
  airslate.client_id="b424f954-c331-4754-af4c-86853f1f3006" \
  airslate.client_secret="tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE" \
  airslate.username="tabor.dangelo@gmail.com" \
  airslate.password="YOUR_ACTUAL_PASSWORD_HERE" \
  airslate.organization_id="YOUR_ORG_ID_HERE"
```

**Replace:**
- `YOUR_ACTUAL_PASSWORD_HERE` with your airSlate password
- `YOUR_ORG_ID_HERE` with your organization ID from airSlate

### **Step 2: Verify Configuration**

```bash
firebase functions:config:get
```

You should see:
```json
{
  "airslate": {
    "client_id": "b424f954-c331-4754-af4c-86853f1f3006",
    "client_secret": "tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE",
    "username": "tabor.dangelo@gmail.com",
    "password": "[hidden]",
    "organization_id": "your_org_id"
  }
}
```

---

## 🔍 HOW TO GET ORGANIZATION ID

### **Method 1: airSlate Dashboard**
1. Log in to https://www.airslate.com
2. Go to **Settings** → **Organization**
3. Copy the **Organization ID**

### **Method 2: API Call**
```bash
curl --location 'https://api.airslate.com/v1/organizations' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 🧪 TEST YOUR CREDENTIALS

### **Test Authentication (cURL)**

```bash
curl --location 'https://oauth.airslate.com/public/oauth/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=api_password' \
  --data-urlencode 'client_id=b424f954-c331-4754-af4c-86853f1f3006' \
  --data-urlencode 'client_secret=tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE' \
  --data-urlencode 'username=tabor.dangelo@gmail.com' \
  --data-urlencode 'password=YOUR_PASSWORD' \
  --data-urlencode 'scope=openid email profile'
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "scope": "openid email profile"
}
```

---

## 📝 AUTHENTICATION FLOW

### **How It Works**

1. **Initial Request:** Firebase Function requests access token using your credentials
2. **Token Caching:** Token is cached in Firestore (expires in 1 hour)
3. **Automatic Refresh:** Token is automatically refreshed before expiration
4. **Workflow Execution:** Cached token is used for all airSlate API calls

### **Security**

- ✅ Credentials stored securely in Firebase Functions Config
- ✅ Tokens cached in Firestore (function-only access)
- ✅ Automatic token refresh
- ✅ No credentials exposed to client

---

## 🔧 TROUBLESHOOTING

### **Error: Invalid Credentials**
```
Failed to authenticate with airSlate: invalid_grant
```

**Solution:**
- Verify username and password are correct
- Check if account is active
- Ensure 2FA is not blocking API access

### **Error: Missing Configuration**
```
airSlate configuration missing
```

**Solution:**
```bash
# Check current config
firebase functions:config:get

# Set missing values
firebase functions:config:set airslate.password="YOUR_PASSWORD"
```

### **Error: Invalid Organization ID**
```
Organization not found
```

**Solution:**
- Get correct organization ID from airSlate dashboard
- Update config:
```bash
firebase functions:config:set airslate.organization_id="correct_org_id"
```

---

## 📊 NEXT STEPS

### **1. Set Up Workflows in airSlate**
- Create Form 990 workflow
- Create Financial Statements workflow
- Create Board Pack workflow
- Get workflow IDs

### **2. Update Firestore**
Update the `airslate_workflows` collection with your workflow IDs:

```javascript
// In Firebase Console or via script
db.collection('airslate_workflows').doc('workflow-form990').update({
  workflowId: 'your_actual_workflow_id_from_airslate'
});
```

### **3. Deploy Functions**
```bash
cd firebase/functions
npm run build
firebase deploy --only functions
```

### **4. Test Form 990 Generation**
```bash
# Call the function
firebase functions:call generateForm990HTTP \
  --data '{"orgId":"aayp-main","taxYear":2024}'
```

---

## 🔐 SECURITY BEST PRACTICES

### **DO:**
- ✅ Use Firebase Functions Config for credentials
- ✅ Rotate passwords regularly
- ✅ Monitor access logs
- ✅ Use strong passwords
- ✅ Enable 2FA on airSlate account (if supported)

### **DON'T:**
- ❌ Commit credentials to Git
- ❌ Share credentials in plain text
- ❌ Use weak passwords
- ❌ Store credentials in client-side code
- ❌ Expose credentials in logs

---

## 📞 SUPPORT

### **airSlate Support**
- Documentation: https://docs.airslate.io
- Support: https://www.airslate.com/support
- Email: support@airslate.com

### **Firebase Support**
- Documentation: https://firebase.google.com/docs
- Console: https://console.firebase.google.com

---

## ✅ CHECKLIST

- [ ] Client ID configured
- [ ] Client Secret configured
- [ ] Username configured
- [ ] Password configured
- [ ] Organization ID configured
- [ ] Configuration verified
- [ ] Test authentication successful
- [ ] Workflows created in airSlate
- [ ] Workflow IDs added to Firestore
- [ ] Functions deployed
- [ ] End-to-end test successful

---

**Status:** Ready to Configure  
**Your Account:** tabor.dangelo@gmail.com  
**Next Step:** Run the Firebase config command with your password and org ID!

**Need Help?** Check FIREBASE_CLI_DEPLOYMENT_GUIDE.md for complete deployment instructions.
