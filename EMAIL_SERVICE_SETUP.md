# 📧 EMAIL SERVICE SETUP - SendGrid Integration

**Status:** Ready to Implement  
**Estimated Time:** 1 hour  
**Priority:** High

---

## 🎯 Overview

Integrate SendGrid for transactional emails including:
- Donation receipts
- Welcome emails
- Notification emails
- Event reminders
- Password reset
- Task reminders

---

## 📋 Setup Steps

### 1. Create SendGrid Account

```bash
# Sign up at https://sendgrid.com
# Free tier: 100 emails/day
# Essentials: $19.95/month for 50,000 emails
```

### 2. Get API Key

1. Go to Settings → API Keys
2. Create API Key with "Full Access"
3. Copy key (only shown once!)
4. Add to Firebase Functions config:

```bash
firebase functions:config:set sendgrid.api_key="YOUR_API_KEY"
```

### 3. Verify Sender Domain

1. Go to Settings → Sender Authentication
2. Authenticate Domain (recommended) or Single Sender
3. Add DNS records to your domain
4. Verify domain

---

## 🔧 Implementation

### Email Service (`firebase/functions/src/services/email.ts`)

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(functions.config().sendgrid.api_key);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const msg = {
    to: options.to,
    from: options.from || 'noreply@adoptayoungparent.org',
    subject: options.subject,
    html: options.html,
    text: options.text || '',
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendReceiptEmail(
  donorEmail: string,
  donorName: string,
  amount: number,
  date: Date,
  receiptUrl: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Donation!</h1>
        </div>
        <div class="content">
          <p>Dear ${donorName},</p>
          <p>Thank you for your generous donation of <strong>$${amount.toFixed(2)}</strong> to ADOPT A YOUNG PARENT.</p>
          <p>Your support helps young parents in Michigan build better futures for themselves and their children.</p>
          <p>Date: ${date.toLocaleDateString()}</p>
          <p>
            <a href="${receiptUrl}" class="button">Download Receipt</a>
          </p>
          <p>This receipt serves as your official tax documentation. Please keep it for your records.</p>
          <p>With gratitude,<br>The ADOPT A YOUNG PARENT Team</p>
        </div>
        <div class="footer">
          <p>ADOPT A YOUNG PARENT | Michigan, USA</p>
          <p>This email was sent because you made a donation. If you have questions, please contact us.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: donorEmail,
    subject: 'Thank You - Donation Receipt',
    html,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ADOPT A YOUNG PARENT!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for creating an account with ADOPT A YOUNG PARENT.</p>
          <p>You can now access your donor portal to view donation history, download receipts, and manage your preferences.</p>
          <p>
            <a href="https://adoptayoungparent.org/portal/donor" class="button">Go to Portal</a>
          </p>
          <p>If you have any questions, feel free to reach out to our team.</p>
          <p>Best regards,<br>The ADOPT A YOUNG PARENT Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to ADOPT A YOUNG PARENT',
    html,
  });
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ADOPT A YOUNG PARENT</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          <p>Best regards,<br>The ADOPT A YOUNG PARENT Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}
```

---

## 🔄 Integration Points

### 1. Donation Receipt (Webhook)

```typescript
// In webhooks/zeffy.ts and webhooks/stripe.ts
import { sendReceiptEmail } from '../services/email';

// After creating donation record
await sendReceiptEmail(
  donorEmail,
  donorName,
  amount,
  new Date(),
  receiptUrl
);
```

### 2. Welcome Email (User Creation)

```typescript
// In auth trigger
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  await sendWelcomeEmail(user.email!, user.displayName || 'Friend');
});
```

### 3. Notification System

```typescript
// In notifications function
export const sendNotification = functions.firestore
  .document('orgs/{orgId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (notification.channels.includes('email')) {
      await sendNotificationEmail(
        notification.recipientEmail,
        notification.subject,
        notification.message
      );
    }
  });
```

---

## 📦 Dependencies

Add to `firebase/functions/package.json`:

```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0"
  }
}
```

Install:

```bash
cd firebase/functions
npm install @sendgrid/mail
```

---

## ✅ Testing

### Test Email Function

```typescript
// Test in Firebase Console or locally
const testEmail = functions.https.onRequest(async (req, res) => {
  try {
    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1><p>This is a test email.</p>',
    });
    res.send('Email sent!');
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});
```

---

## 🎨 Email Templates

Create reusable templates in `/firebase/functions/src/templates/`:

- `receipt.html` - Donation receipt
- `welcome.html` - Welcome email
- `notification.html` - General notification
- `reminder.html` - Task/event reminder
- `password-reset.html` - Password reset

---

## 📊 Monitoring

### SendGrid Dashboard
- Track delivery rates
- Monitor bounces
- View open rates
- Check spam reports

### Firebase Logs
```bash
firebase functions:log --only sendEmail
```

---

## 🔒 Security

1. **Never expose API key** - Use Firebase config
2. **Validate email addresses** - Check format before sending
3. **Rate limiting** - Prevent abuse
4. **Unsubscribe links** - Include in marketing emails
5. **GDPR compliance** - Honor opt-outs

---

## 💰 Cost Estimation

**SendGrid Pricing:**
- Free: 100 emails/day
- Essentials ($19.95/mo): 50,000 emails
- Pro ($89.95/mo): 100,000 emails

**Expected Usage:**
- Receipts: ~100/month
- Welcome: ~50/month
- Notifications: ~200/month
- **Total:** ~350/month (Free tier sufficient)

---

## ✅ Checklist

- [ ] Create SendGrid account
- [ ] Get API key
- [ ] Configure Firebase Functions
- [ ] Verify sender domain
- [ ] Install dependencies
- [ ] Create email service
- [ ] Create email templates
- [ ] Integrate with webhooks
- [ ] Add welcome email trigger
- [ ] Test all email types
- [ ] Monitor delivery
- [ ] Document for team

---

**Status:** Ready to implement  
**Time Required:** 1 hour  
**Impact:** High - Essential for user communication
