# ⚡ QUICK START - Get Running in 15 Minutes

**Goal:** Get the platform running locally as fast as possible.

---

## Prerequisites Check

```bash
# Check Node.js version (must be 20+)
node --version

# Check npm version
npm --version

# Install Firebase CLI if needed
npm install -g firebase-tools
```

---

## 1. Install Dependencies (2 min)

```bash
# From project root
cd c:/AYPNFP

# Install web app dependencies
cd apps/web
npm install

# Install functions dependencies
cd ../../firebase/functions
npm install
```

---

## 2. Set Up Environment (3 min)

```bash
# Copy environment template
cd ../../apps/web
copy .env.example .env.local
```

**Edit `.env.local`** with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDWmfX1jYaIsFUucmyno6EBjdZNFTh6k_0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=adopt-a-young-parent.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=adopt-a-young-parent
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=adopt-a-young-parent.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=499950524793
NEXT_PUBLIC_FIREBASE_APP_ID=1:499950524793:web:9016b05e3aa3cc795277a8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FGJDKEK435
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<GET_FROM_FIREBASE_CONSOLE>
NEXT_PUBLIC_ORG_ID=aayp-prod
NEXT_PUBLIC_ZEFFY_FORM_ID=<YOUR_ZEFFY_FORM_ID>
```

---

## 3. Firebase Login (1 min)

```bash
firebase login
```

---

## 4. Start Development Servers (2 min)

**Terminal 1 - Firebase Emulators:**
```bash
cd c:/AYPNFP/firebase
firebase emulators:start
```

**Terminal 2 - Next.js Dev Server:**
```bash
cd c:/AYPNFP/apps/web
npm run dev
```

---

## 5. Open in Browser (1 min)

- **Website:** http://localhost:3000
- **Firebase Emulator UI:** http://localhost:4000

---

## 6. Create Test User (3 min)

1. Go to http://localhost:3000/login
2. Click "Sign up"
3. Create account with email/password
4. You're in!

---

## 7. Test Donation Flow (3 min)

1. Go to http://localhost:3000/donate
2. Fill out Zeffy form (test mode)
3. Check Firebase Emulator UI → Firestore
4. Verify donation document created

---

## ✅ You're Running!

**What works:**
- ✅ Homepage
- ✅ Donate page
- ✅ Login/signup
- ✅ Donor portal (basic)
- ✅ Mission page
- ✅ Transparency page

**What's next:**
- Read `SETUP_GUIDE.md` for production setup
- Read `WINDSURF_PROMPT.md` to continue building
- Check `PROJECT_TRACKER.md` for full roadmap

---

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Firebase Emulators Won't Start

```bash
# Clear emulator data
cd firebase
firebase emulators:start --import=./emulator-data --export-on-exit
```

### Dependencies Won't Install

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Next Steps

1. **Production Setup:** Follow `SETUP_GUIDE.md`
2. **Continue Building:** Use `WINDSURF_PROMPT.md`
3. **Deploy:** `firebase deploy --project prod`

**Happy coding! 🚀**
