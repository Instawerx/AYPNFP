# 📧 SENDGRID SETUP GUIDE

**Date:** October 14, 2024, 5:50 PM  
**Status:** Ready to Configure

---

## ⚠️ IMPORTANT: DNS ISSUE

You **cannot** add DNS records to the Firebase App Hosting domain:
- `aaypnfp--adopt-a-young-parent.us-central1.hosted.app`

This domain is controlled by Google/Firebase, not you.

---

## ✅ RECOMMENDED SOLUTION: Single Sender Verification

Use SendGrid's **Single Sender Verification** instead of domain authentication. This is perfect for getting started quickly.

### **Advantages:**
- ✅ No DNS configuration needed
- ✅ Works immediately after verification
- ✅ Perfect for development and testing
- ✅ Can send 100 emails/day (free tier)
- ✅ Easy to set up (5 minutes)

### **Limitations:**
- ⚠️ Emails come from your personal email (e.g., vrdivebar@gmail.com)
- ⚠️ Not ideal for production at scale
- ⚠️ May have lower deliverability than authenticated domain

---

## 🚀 SETUP STEPS

### **Step 1: Create SendGrid Account**

1. Go to https://sendgrid.com/
2. Sign up for free account
3. Verify your email
4. Complete onboarding

---

### **Step 2: Verify Single Sender**

1. In SendGrid dashboard, go to:
   - **Settings** → **Sender Authentication**
   
2. Click **"Verify a Single Sender"**

3. Fill in the form:
   - **From Name:** AYPNFP
   - **From Email Address:** vrdivebar@gmail.com
   - **Reply To:** vrdivebar@gmail.com
   - **Company Address:** Your address
   - **City:** Your city
   - **State:** Your state
   - **Zip Code:** Your zip
   - **Country:** United States

4. Click **"Create"**

5. **Check your email** (vrdivebar@gmail.com)

6. Click the verification link

7. ✅ **Sender verified!**

---

### **Step 3: Create API Key**

1. In SendGrid dashboard, go to:
   - **Settings** → **API Keys**

2. Click **"Create API Key"**

3. Configure:
   - **API Key Name:** AYPNFP Production
   - **API Key Permissions:** Full Access (or Mail Send only)

4. Click **"Create & View"**

5. **Copy the API key** (starts with `SG.`)
   - ⚠️ You can only see this once!

6. Save it securely

---

### **Step 4: Create Firebase Secret**

```bash
# Save API key to file
echo "SG.your-api-key-here" > sendgrid-key.txt

# Create secret in Firebase
firebase apphosting:secrets:set sendgrid-api-key --data-file=sendgrid-key.txt --project adopt-a-young-parent

# Delete the file
Remove-Item sendgrid-key.txt
```

---

### **Step 5: Verify Configuration**

Your `apphosting.yaml` is already configured:

```yaml
- variable: SENDGRID_API_KEY
  secret: sendgrid-api-key

- variable: SENDGRID_FROM_EMAIL
  value: vrdivebar@gmail.com
  availability:
    - RUNTIME

- variable: SENDGRID_FROM_NAME
  value: AYPNFP
  availability:
    - RUNTIME
```

✅ **Ready to deploy!**

---

## 🎯 ALTERNATIVE: Custom Domain (Future)

If you want professional emails (e.g., noreply@aypnfp.org), you need your own domain.

### **Option A: Buy a Domain**

1. **Buy domain:** aypnfp.org (from Namecheap, Google Domains, etc.)
2. **Add DNS records** from SendGrid to your domain registrar
3. **Verify domain** in SendGrid
4. **Update** `SENDGRID_FROM_EMAIL` to `noreply@aypnfp.org`

### **Option B: Use Existing Domain**

If you already own a domain:
1. Go to SendGrid → Sender Authentication → Authenticate Your Domain
2. Add the DNS records to your domain registrar
3. Wait for verification (can take 24-48 hours)
4. Update `SENDGRID_FROM_EMAIL` in `apphosting.yaml`

---

## 📧 EMAIL TEMPLATES

Your application will send these emails:

### **1. Form Submission Notification**
- **To:** Approvers
- **From:** vrdivebar@gmail.com (AYPNFP)
- **Subject:** New Form Submission: [Template Name]
- **Content:** Form details + review link

### **2. Approval Notification**
- **To:** Submitter
- **From:** vrdivebar@gmail.com (AYPNFP)
- **Subject:** Form Approved: [Template Name]
- **Content:** Approval details + download link

### **3. Rejection Notification**
- **To:** Submitter
- **From:** vrdivebar@gmail.com (AYPNFP)
- **Subject:** Form Rejected: [Template Name]
- **Content:** Rejection reason + comments

---

## 🧪 TESTING

After deployment, test emails:

### **Test 1: Form Submission**
1. Submit a form
2. Check if approver receives email
3. Verify email content and links

### **Test 2: Approval**
1. Approve a submission
2. Check if submitter receives email
3. Verify download link works

### **Test 3: Rejection**
1. Reject a submission
2. Check if submitter receives email
3. Verify rejection reason is clear

---

## 📊 SENDGRID FREE TIER LIMITS

**Free Plan:**
- ✅ 100 emails per day
- ✅ Unlimited contacts
- ✅ Email API
- ✅ Email validation
- ✅ Basic analytics

**If you need more:**
- **Essentials:** $19.95/month (40,000 emails)
- **Pro:** $89.95/month (100,000 emails)

---

## 🔧 TROUBLESHOOTING

### **Issue: Emails not sending**

**Check:**
1. API key is valid
2. Secret is created in Firebase
3. Sender email is verified in SendGrid
4. Check Cloud Run logs for errors

**View logs:**
```bash
firebase apphosting:logs --project adopt-a-young-parent
```

### **Issue: Emails going to spam**

**Solutions:**
1. Verify single sender in SendGrid
2. Ask recipients to whitelist your email
3. Consider domain authentication (requires custom domain)
4. Improve email content (avoid spam triggers)

### **Issue: "Sender not verified" error**

**Solution:**
1. Go to SendGrid → Settings → Sender Authentication
2. Verify your email address
3. Check your inbox for verification email
4. Click the verification link

---

## ✅ QUICK START CHECKLIST

- [ ] Create SendGrid account
- [ ] Verify single sender (vrdivebar@gmail.com)
- [ ] Create API key
- [ ] Save API key to file
- [ ] Create Firebase secret
- [ ] Delete API key file
- [ ] Deploy application
- [ ] Test emails

**Time:** ~10 minutes

---

## 🚀 READY TO DEPLOY

Once you've completed the checklist:

```bash
# Deploy application
firebase deploy --only apphosting:aaypnfp --project adopt-a-young-parent
```

Your emails will work immediately after deployment!

---

## 💡 TIPS

### **For Development:**
- Single sender verification is perfect
- Fast setup, no DNS needed
- 100 emails/day is plenty for testing

### **For Production:**
- Consider buying a custom domain
- Set up domain authentication
- Upgrade SendGrid plan if needed
- Monitor email analytics

### **Best Practices:**
- Keep API key secure (never commit to git)
- Use descriptive "From Name" (AYPNFP)
- Test emails before going live
- Monitor delivery rates in SendGrid dashboard

---

**Status:** ✅ Configuration updated  
**Next:** Create SendGrid account and verify sender  
**Time:** ~10 minutes to complete
