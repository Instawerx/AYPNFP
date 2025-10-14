# Navigation Implementation Plan

**Last Updated:** Oct 14, 2024, 3:05 AM  
**Status:** 🚀 Ready to Implement

---

## 🎯 OVERVIEW

This document outlines the implementation plan for site-wide navigation, including:
- Public site navigation
- Portal navigation (role-based)
- Mobile responsiveness
- Accessibility features
- Breadcrumbs
- Search functionality

---

## 📋 NAVIGATION STRUCTURE

### **Public Site Navigation**

```
┌─────────────────────────────────────────────┐
│  ADOPT A YOUNG PARENT          [Donate] [Login] │
├─────────────────────────────────────────────┤
│  Home | Mission | Programs | Impact | Events │
│  Transparency | Contact                      │
└─────────────────────────────────────────────┘
```

**Components Needed:**
- `components/navigation/PublicNav.tsx`
- `components/navigation/MobileMenu.tsx`
- `components/navigation/DonateButton.tsx`

**Features:**
- Sticky header on scroll
- Mobile hamburger menu
- Prominent "Donate" CTA
- Active link highlighting
- Smooth scroll to sections
- Keyboard navigation (Tab, Enter, Escape)

---

### **Portal Navigation (Role-Based)**

```
┌─────────────────────────────────────────────┐
│  AAYP Portal    [Notifications] [Profile ▼]  │
├─────────────────────────────────────────────┤
│  Sidebar:                                    │
│  ├─ Dashboard                                │
│  ├─ [Role-Specific Items]                    │
│  ├─ Settings                                 │
│  └─ Logout                                   │
└─────────────────────────────────────────────┘
```

**Role-Based Navigation Items:**

#### **Donor Portal**
- Dashboard
- Donation History
- Receipts
- Settings (Consent Management)

#### **Fundraiser Portal**
- Dashboard
- My Donors
- Tasks
- Pledges
- Leaderboard
- Notifications

#### **Manager Portal**
- Dashboard
- Campaigns
- Team Performance
- Analytics
- Tasks

#### **Finance Portal**
- Dashboard
- Transactions
- Settlements
- Reports
  - Form 990
  - Board Pack
- Integrations
  - Stripe
  - Zeffy

#### **Admin Portal**
- Dashboard
- Users & Roles
- Organization Settings
- Integrations
- Audit Logs

#### **Employee Portal**
- Dashboard
- Onboarding
- Documents
- Training
- Time Off
- Directory

**Components Needed:**
- `components/navigation/PortalSidebar.tsx`
- `components/navigation/PortalHeader.tsx`
- `components/navigation/UserMenu.tsx`
- `components/navigation/NotificationBell.tsx`
- `components/navigation/RoleBasedNav.tsx`

---

## 🛠️ IMPLEMENTATION TASKS

### **Phase 1: Public Navigation** (2-3 hours)

- [ ] **1.1** Create `PublicNav.tsx` component
  - Logo/branding
  - Navigation links
  - Donate button (prominent)
  - Login button
  - Mobile menu toggle

- [ ] **1.2** Create `MobileMenu.tsx` component
  - Slide-in drawer
  - Full-screen overlay
  - Close button (X)
  - Touch-friendly links
  - Smooth animations (Framer Motion)

- [ ] **1.3** Implement sticky header
  - Show/hide on scroll
  - Background blur effect
  - Shadow on scroll

- [ ] **1.4** Add active link highlighting
  - Use Next.js `usePathname()`
  - Highlight current page
  - Underline animation

- [ ] **1.5** Accessibility features
  - ARIA labels
  - Keyboard navigation
  - Focus indicators
  - Skip to content link

**Acceptance Criteria:**
- Navigation works on desktop and mobile
- Active page is highlighted
- Keyboard navigation works (Tab, Enter, Escape)
- WCAG 2.2 AA compliant

---

### **Phase 2: Portal Sidebar Navigation** (3-4 hours)

- [ ] **2.1** Create `PortalSidebar.tsx` component
  - Collapsible sidebar
  - Role-based menu items
  - Active link highlighting
  - Nested navigation (expandable sections)
  - Icons for each item (Lucide React)

- [ ] **2.2** Create `RoleBasedNav.tsx` hook
  - Read user's custom claims
  - Filter navigation items by scopes
  - Return only accessible routes

- [ ] **2.3** Implement sidebar collapse/expand
  - Toggle button
  - Persist state (localStorage)
  - Smooth animation
  - Icon-only mode when collapsed

- [ ] **2.4** Add navigation groups
  - Collapsible sections (e.g., "Reports")
  - Group headers
  - Expand/collapse icons

- [ ] **2.5** Mobile sidebar
  - Slide-in drawer
  - Overlay backdrop
  - Close on route change
  - Swipe to close

**Acceptance Criteria:**
- Sidebar shows only accessible routes based on user role
- Sidebar collapses/expands smoothly
- Mobile sidebar works on touch devices
- Active route is highlighted

---

### **Phase 3: Portal Header** (2-3 hours)

- [ ] **3.1** Create `PortalHeader.tsx` component
  - Organization logo
  - Page title/breadcrumbs
  - Search bar (future)
  - Notification bell
  - User menu dropdown

- [ ] **3.2** Create `NotificationBell.tsx` component
  - Badge count (unread notifications)
  - Dropdown panel
  - Mark as read
  - View all link

- [ ] **3.3** Create `UserMenu.tsx` component
  - User avatar/initials
  - User name + role
  - Settings link
  - Logout button
  - Profile link

- [ ] **3.4** Implement breadcrumbs
  - Auto-generate from route
  - Clickable links
  - Home icon
  - Separator (/)

**Acceptance Criteria:**
- Header shows current page title
- Notification bell shows unread count
- User menu opens on click
- Breadcrumbs navigate correctly

---

### **Phase 4: Search Functionality** (3-4 hours)

- [ ] **4.1** Create `SearchBar.tsx` component
  - Input field
  - Search icon
  - Keyboard shortcut (Cmd/Ctrl + K)
  - Clear button

- [ ] **4.2** Create `SearchResults.tsx` component
  - Dropdown panel
  - Grouped results (Donors, Campaigns, Tasks, etc.)
  - Keyboard navigation (arrow keys)
  - Click to navigate

- [ ] **4.3** Implement search service
  - Firestore queries (name, email, campaign title)
  - Debounced search (300ms)
  - Limit results (10 per category)
  - Scope-based filtering

- [ ] **4.4** Add search shortcuts
  - Cmd/Ctrl + K to open
  - Escape to close
  - Arrow keys to navigate
  - Enter to select

**Acceptance Criteria:**
- Search works across all portal data
- Results filtered by user's scopes
- Keyboard shortcuts work
- Search is fast (<500ms)

---

### **Phase 5: Responsive Design** (2-3 hours)

- [ ] **5.1** Mobile breakpoints
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

- [ ] **5.2** Mobile navigation
  - Bottom tab bar (optional)
  - Hamburger menu
  - Full-screen menu
  - Touch-friendly targets (44px min)

- [ ] **5.3** Tablet navigation
  - Collapsible sidebar
  - Responsive header
  - Touch-optimized

- [ ] **5.4** Desktop navigation
  - Full sidebar
  - Hover effects
  - Keyboard shortcuts

**Acceptance Criteria:**
- Navigation works on all screen sizes
- Touch targets are 44px minimum
- No horizontal scroll on mobile
- Responsive images/icons

---

### **Phase 6: Accessibility** (2-3 hours)

- [ ] **6.1** ARIA labels
  - Navigation landmarks
  - Button labels
  - Link descriptions
  - Icon-only buttons

- [ ] **6.2** Keyboard navigation
  - Tab order
  - Focus indicators
  - Escape to close menus
  - Arrow keys for dropdowns

- [ ] **6.3** Screen reader support
  - Semantic HTML
  - ARIA roles
  - Live regions for notifications
  - Skip links

- [ ] **6.4** Focus management
  - Trap focus in modals
  - Return focus on close
  - Visible focus indicators
  - Focus on first item in menus

**Acceptance Criteria:**
- WCAG 2.2 AA compliant
- Keyboard navigation works
- Screen reader announces correctly
- Focus indicators visible

---

### **Phase 7: Animations & Polish** (2-3 hours)

- [ ] **7.1** Framer Motion animations
  - Slide-in sidebar
  - Fade-in dropdowns
  - Smooth transitions
  - Stagger children

- [ ] **7.2** Hover effects
  - Link hover states
  - Button hover states
  - Icon hover states
  - Tooltip delays

- [ ] **7.3** Loading states
  - Skeleton loaders
  - Spinner for search
  - Progress bars
  - Shimmer effects

- [ ] **7.4** Error states
  - Failed to load navigation
  - Network errors
  - Retry button
  - Fallback UI

**Acceptance Criteria:**
- Animations are smooth (60fps)
- No layout shift
- Loading states are clear
- Error states are helpful

---

## 📁 FILE STRUCTURE

```
apps/web/
├── components/
│   ├── navigation/
│   │   ├── PublicNav.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── PortalSidebar.tsx
│   │   ├── PortalHeader.tsx
│   │   ├── UserMenu.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SearchResults.tsx
│   │   ├── Breadcrumbs.tsx
│   │   └── RoleBasedNav.tsx
│   └── ui/
│       ├── dropdown-menu.tsx (shadcn)
│       ├── sheet.tsx (shadcn)
│       └── command.tsx (shadcn - for search)
├── lib/
│   ├── navigation.ts (navigation config)
│   └── search.ts (search service)
└── hooks/
    ├── useNavigation.ts
    └── useSearch.ts
```

---

## 🎨 DESIGN TOKENS

### **Colors**
```typescript
const navigationColors = {
  background: 'bg-white dark:bg-gray-900',
  text: 'text-gray-900 dark:text-white',
  textMuted: 'text-gray-600 dark:text-gray-400',
  active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  border: 'border-gray-200 dark:border-gray-800',
};
```

### **Spacing**
```typescript
const navigationSpacing = {
  sidebarWidth: '16rem', // 256px
  sidebarCollapsed: '4rem', // 64px
  headerHeight: '4rem', // 64px
  mobileHeaderHeight: '3.5rem', // 56px
};
```

### **Animations**
```typescript
const navigationAnimations = {
  duration: 200, // ms
  easing: 'ease-in-out',
  slideIn: { x: [-280, 0], opacity: [0, 1] },
  fadeIn: { opacity: [0, 1] },
};
```

---

## 🧪 TESTING CHECKLIST

### **Unit Tests**
- [ ] Navigation config generates correct items
- [ ] Role-based filtering works
- [ ] Search service returns correct results
- [ ] Breadcrumb generation works

### **Integration Tests**
- [ ] Navigation renders for each role
- [ ] Active link highlighting works
- [ ] Search returns scoped results
- [ ] Notification bell updates

### **E2E Tests**
- [ ] User can navigate public site
- [ ] User can log in and see portal nav
- [ ] User can search and navigate to result
- [ ] Mobile menu works on touch devices

### **Accessibility Tests**
- [ ] Axe scan passes (0 violations)
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible

---

## 📊 SUCCESS METRICS

- **Performance:** Navigation renders < 100ms
- **Accessibility:** WCAG 2.2 AA compliant (Axe scan passes)
- **Mobile:** Touch targets ≥ 44px
- **Search:** Results < 500ms
- **Animations:** 60fps (no jank)

---

## 🚀 DEPLOYMENT PLAN

### **Phase 1: Public Nav** (Deploy to staging)
- Test on multiple devices
- Verify accessibility
- Get stakeholder approval

### **Phase 2: Portal Nav** (Deploy to staging)
- Test with each role
- Verify scope filtering
- Test mobile sidebar

### **Phase 3: Search** (Deploy to staging)
- Test search performance
- Verify scoped results
- Test keyboard shortcuts

### **Phase 4: Production** (Deploy to production)
- Monitor error rates
- Collect user feedback
- Iterate based on feedback

---

## 📝 NOTES

- Use shadcn/ui components for consistency
- Use Lucide React icons
- Use Framer Motion for animations
- Use Tailwind CSS for styling
- Follow existing code patterns
- Maintain AAA-level quality

---

**Estimated Total Time:** 16-24 hours  
**Priority:** High  
**Dependencies:** None (can start immediately)

---

**Next Steps:**
1. Review this plan with stakeholders
2. Start with Phase 1 (Public Nav)
3. Deploy to staging after each phase
4. Collect feedback and iterate
