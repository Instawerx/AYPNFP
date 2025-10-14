# 🚀 WHAT'S NEXT - Development Roadmap

**Current Progress:** 58% Complete  
**Remaining Work:** 42%  
**Estimated Time:** 6-8 hours (2-3 sessions)

---

## 🎯 IMMEDIATE PRIORITIES (Next Session)

### **1. Complete Fundraiser Portal** (Est: 2-3 hours)

#### **Pages to Build:**

**A. Donors List (`/portal/fundraiser/donors/page.tsx`)**
- Search and filter assigned donors
- Sort by last contact, donation amount, status
- Quick actions (call, email, add task)
- Donor status indicators
- Export to CSV

**B. Donor Detail (`/portal/fundraiser/donors/[id]/page.tsx`)**
- Donor profile and contact info
- Donation history timeline
- Interaction notes
- Task list for this donor
- Send notification button (consent-aware)
- Pledge tracking

**C. Task Management (`/portal/fundraiser/tasks/page.tsx`)**
- Task list with filters (status, priority, due date)
- Create task modal
- Bulk actions
- Calendar view
- Completion tracking

**D. Task Detail (`/portal/fundraiser/tasks/[id]/page.tsx`)**
- Task details and notes
- Edit functionality
- Mark complete
- Related donor info
- Activity log

**E. Pledges (`/portal/fundraiser/pledges/page.tsx`)**
- Pledge pipeline (pending, committed, converted)
- Convert pledge to donation
- Follow-up reminders
- Success rate tracking

**F. Leaderboard (`/portal/fundraiser/leaderboard/page.tsx`)**
- Team rankings
- Personal stats
- Monthly/quarterly/annual views
- Achievement badges
- Goal progress

---

### **2. Complete Finance Portal** (Est: 2-3 hours)

#### **Pages to Build:**

**A. Settlements List (`/portal/finance/settlements/page.tsx`)**
- All settlements with status
- Filter by source, date, status
- Reconciliation status
- Quick reconcile action

**B. Settlement Detail (`/portal/finance/settlements/[id]/page.tsx`)**
- Settlement details
- Transaction list
- Reconciliation tool
- Discrepancy notes
- Mark as reconciled

**C. Transactions (`/portal/finance/transactions/page.tsx`)**
- All transactions
- Advanced filtering
- Export functionality
- Search by donor, amount, date

**D. Stripe Integration (`/portal/finance/stripe/page.tsx`)**
- Balance overview
- Payout schedule
- Sync button
- Transaction fees
- Dispute tracking

**E. Zeffy Integration (`/portal/finance/zeffy/page.tsx`)**
- Payout tracking
- Import CSV
- Fee-free verification
- Donor tip tracking

**F. 990 Export (`/portal/finance/reports/990/page.tsx`)**
- Year selection
- Data preview
- Export to CSV/Excel
- IRS-ready format
- Program allocation breakdown

**G. Board Pack (`/portal/finance/reports/board-pack/page.tsx`)**
- Month selection
- Financial summary
- Key metrics
- Charts and graphs
- PDF export

---

### **3. Complete Manager Portal** (Est: 2-3 hours)

#### **Pages to Build:**

**A. Campaign Pipeline (`/portal/manager/campaigns/pipeline/page.tsx`)**
- Kanban board view
- Drag-and-drop status changes
- Campaign cards with progress
- Filter and search
- Quick stats

**B. Campaign Detail (`/portal/manager/campaigns/[id]/page.tsx`)**
- Campaign overview
- Goal progress
- Assigned fundraisers
- Donor list
- UTM tracking
- Edit campaign

**C. Create Campaign (`/portal/manager/campaigns/create/page.tsx`)**
- Campaign form
- Goal setting
- Date range
- Fundraiser assignment
- UTM parameter setup

**D. Team Leaderboard (`/portal/manager/team/leaderboard/page.tsx`)**
- Detailed rankings
- Multiple metrics
- Time period selection
- Export functionality
- Recognition system

**E. Team Member Detail (`/portal/manager/team/[id]/page.tsx`)**
- Fundraiser profile
- Performance metrics
- Assigned donors
- Task completion rate
- Goal tracking
- Performance reviews

**F. Task Queue (`/portal/manager/tasks/page.tsx`)**
- All team tasks
- Assignment tool
- Priority management
- Due date tracking
- Completion rates

**G. UTM Analytics (`/portal/manager/analytics/utm/page.tsx`)**
- UTM parameter tracking
- Conversion rates by source
- Campaign effectiveness
- Charts and visualizations
- Export reports

---

## 📋 SECONDARY PRIORITIES (Following Session)

### **4. Build Employee Portal** (Est: 2-3 hours)

#### **Pages to Build:**

**A. Dashboard (`/portal/employee/page.tsx`)**
- Welcome message
- Onboarding progress
- Upcoming tasks
- Recent documents
- Training status

**B. Onboarding (`/portal/employee/onboarding/page.tsx`)**
- Checklist of tasks
- Progress tracking
- Document uploads
- Form completion
- Manager approval

**C. HR Documents (`/portal/employee/documents/page.tsx`)**
- Document vault
- Upload/download
- Categories (policies, forms, benefits)
- Search functionality
- Version control

**D. Training (`/portal/employee/training/page.tsx`)**
- Available courses
- Completed training
- Certificates
- Progress tracking
- Quiz/assessment

**E. Time-off (`/portal/employee/time-off/page.tsx`)**
- Request time-off
- View balance
- Approval status
- Calendar view
- History

---

### **5. Email Service Integration** (Est: 1-2 hours)

#### **Implementation Steps:**

**A. Choose Provider**
- SendGrid (recommended) or Postmark
- Set up account
- Get API keys
- Configure DNS (SPF, DKIM)

**B. Create Email Service (`firebase/functions/src/services/email.ts`)**
```typescript
- sendReceiptEmail()
- sendNotificationEmail()
- sendWelcomeEmail()
- sendReminderEmail()
```

**C. Create Templates**
- Receipt email (HTML + text)
- Notification email
- Welcome email
- Task reminder email
- Event reminder email

**D. Add to Functions**
- Trigger on donation creation
- Trigger on notification send
- Trigger on user creation
- Queue system for bulk emails

---

### **6. Mini-Game Implementation** (Est: 3-4 hours)

#### **Game: Skill-Based Runner**

**A. Game Engine (`/apps/web/app/games/runner/page.tsx`)**
- Canvas-based rendering
- Player character
- Obstacle generation
- Collision detection
- Score calculation
- Lives/health system

**B. Controls**
- Keyboard (arrow keys, space)
- Touch (mobile)
- Accessibility mode (slower, easier)

**C. Leaderboard (`/apps/web/app/games/runner/leaderboard/page.tsx`)**
- Top scores
- Team rankings
- Personal best
- Daily/weekly/all-time

**D. Anti-Cheat**
- Server-side score validation
- Timestamp verification
- Pattern detection
- Rate limiting

**E. Donation Prompts**
- Game over screen
- High score achievement
- Team milestone reached
- Subtle, non-intrusive

---

## 🔧 TECHNICAL TASKS

### **7. Analytics Setup** (Est: 2 hours)

**A. Google Analytics 4**
- Create GA4 property
- Add tracking code
- Configure events (donate, signup, portal access)
- Set up conversions

**B. BigQuery Export**
- Enable BigQuery export
- Create dataset
- Schedule exports
- Create views

**C. Looker Studio Dashboards**
- Donor funnel dashboard
- Campaign performance
- Website analytics
- Board pack template

---

### **8. Testing Suite** (Est: 3-4 hours)

**A. Unit Tests (Vitest)**
- Utility functions
- Component logic
- Service functions
- Auth helpers

**B. E2E Tests (Playwright)**
- Donation flow
- Login/signup
- Portal navigation
- Form submissions

**C. Accessibility Tests (Axe)**
- All public pages
- All portal pages
- Fix violations
- Document standards

---

## 📝 DOCUMENTATION TASKS

### **9. User Documentation** (Est: 1-2 hours)

**A. User Guides**
- Donor portal guide
- Fundraiser portal guide
- Admin portal guide
- Manager portal guide
- Finance portal guide

**B. Video Tutorials**
- How to donate
- How to use donor portal
- How to manage campaigns
- How to reconcile settlements

**C. FAQ**
- Common questions
- Troubleshooting
- Contact information

---

## 🚀 DEPLOYMENT TASKS

### **10. Pre-Launch Checklist** (Est: 2 hours)

**A. Environment Setup**
- Production Firebase project
- Environment variables
- Secrets configuration
- Custom domain

**B. Data Migration**
- Seed production data
- Create admin user
- Set up roles
- Configure integrations

**C. Testing**
- Smoke tests
- Load testing
- Security audit
- Accessibility audit

**D. Monitoring**
- Error tracking
- Performance monitoring
- Uptime monitoring
- Alert configuration

---

## 📊 ESTIMATED TIMELINE

### **Week 1 (Current)**
- ✅ Foundation (100%)
- ✅ Public pages (100%)
- ✅ Portal dashboards (4 built)
- **Progress:** 58%

### **Week 2 (Next)**
- Complete portal detail pages
- Build employee portal
- Add email service
- **Target Progress:** 85%

### **Week 3 (Final)**
- Mini-game
- Analytics
- Testing
- Launch prep
- **Target Progress:** 100%

---

## 🎯 SUCCESS METRICS

### **By End of Week 2**
- [ ] All portals 100% functional
- [ ] Email service working
- [ ] Employee portal complete
- [ ] 85% overall progress

### **By End of Week 3**
- [ ] Mini-game live
- [ ] Analytics tracking
- [ ] Test coverage > 80%
- [ ] Production deployed
- [ ] 100% complete

---

## 💡 QUICK WINS

### **Can Complete in < 1 Hour Each**
1. Add loading skeletons to all pages
2. Create 404 and 500 error pages
3. Add breadcrumbs to portal pages
4. Implement search functionality
5. Add export to CSV buttons
6. Create email templates
7. Set up GA4 tracking
8. Write README updates
9. Create deployment scripts
10. Add more documentation

---

## 🔄 CONTINUOUS IMPROVEMENTS

### **Ongoing Tasks**
- Refactor components for reusability
- Optimize bundle size
- Improve accessibility
- Add more tests
- Update documentation
- Monitor performance
- Fix bugs
- Respond to feedback

---

## 📞 GETTING STARTED

### **Next Session Checklist**
1. [ ] Read this file (WHATS_NEXT.md)
2. [ ] Review PROJECT_STATUS_DASHBOARD.md
3. [ ] Check ROADMAP.md for priorities
4. [ ] Read relevant PHASE_1_*.md guides
5. [ ] Set up development environment
6. [ ] Start with highest priority task

### **Development Commands**
```bash
# Start development
npm run dev

# Start emulators
npm run emulators

# Run tests
npm test

# Deploy
npm run deploy
```

---

**Ready to continue building! Pick any task above and start coding.** 🚀

**Questions?** Check the documentation or START_HERE.md
