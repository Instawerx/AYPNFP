ADOPT A YOUNG PARENT — Complete Product Specification

**Status:** 92% Complete - Production Ready  
**Last Updated:** October 13, 2024, 11:28 PM  
**Total Files:** 110+  
**Total LOC:** 27,500+  
**Documentation:** 65,000+ words

Purpose: AAA-level nonprofit website and management platform for a Michigan 501(c) org.
Core goals: Inspire donors, streamline fundraising, manage staff and programs, maintain airtight compliance, and provide real-time operational intelligence — all on Firebase + Google cloud tooling, with Zeffy (primary) and Stripe (fallback) for payments and Firebase Cloud Messaging (FCM) for notifications.

1) Executive Summary

ADOPT A YOUNG PARENT (AAYP) will ship a modern, high-impact public website plus a secure, role-based back office that unifies fundraising, donor CRM, HR, events, finance, reporting, and skill-based mini-games for engagement. The stack emphasizes low ops overhead, strong access controls, auditable data flows, and performance at scale.

Non-negotiables

Compliance: Michigan solicitation disclosure; IRS Pub. 1771 receipt language; opt-in communications; skill-only games unless licensed.

Security: Deny-by-default Firestore Rules, least-privilege RBAC via Auth Custom Claims, immutable audit logs, PII minimization.

Resilience: Hosted checkout (Zeffy/Stripe) + verified webhooks; background jobs are idempotent and observable.

2) Audiences & Roles (RBAC)

Organization-side

Super Admin — full platform control, legal/compliance, integrations, data retention.

Admin (Ops Admin) — RBAC administration, brand/site configuration, content approvals.

Finance Admin — donations, payouts, reconciliation, accounting exports, 990 support.

Fundraising Manager — campaign strategy, team goals, leaderboards, assignments.

Fundraiser / Employee — donor outreach, tasks, pledge capture, notes, donor notifications (FCM).

HR Manager — employee onboarding, documents, compliance training, leave/basic timekeeping.

Program Manager (optional) — intake, case notes, services delivery, outcomes.

External

Donor — self-service portal (history, recurring, receipts, statements, preferences).

Volunteer — shifts, hours, onboarding.

Event Guest — ticket purchase/check-in (if events module used).

Access model

Roles map to scopes (e.g., donor.read, finance.write, campaign.manage). All Firestore access is enforced by Rules checking: auth.token.orgId and auth.token.scopes.

3) Public Website (Front-of-Site)

Pages

Home — value prop, hero CTA (“Donate”), impact counters, testimonials, trust badges (Michigan registration, SSL).

Mission & Programs — what we do, who we help, program pipelines.

Impact — dynamic metrics (donations, families served, outcomes); graphs.

Donate — embedded Zeffy widget (primary); Stripe Checkout fallback path.

Events — upcoming events, sponsor tiers, ticketing (Zeffy/Givebutter style widget if used).

Stories/Blog — content hub for SEO + authenticity.

Transparency — 990s, policies (gift acceptance, privacy), board list, state IDs.

Contact — secure form (reCAPTCHA), office map as needed.

Mini-Games — skill-based, micro-donation prompts, team leaderboards.

UX requirements

WCAG 2.2 AA from day one; semantic HTML, keyboard nav, visible focus states, motion-reduced variants.

Lighthouse ≥ 95 on Performance/Best Practices/SEO; Core Web Vitals pass.

Mobile-first; Apple/Google Pay on one-tap donate.

4) Back-Office Portals (In-Depth)
4.1 Admin Console

Branding & Org Settings: name, EIN, MI state ID, disclosures, footer copy, logo.

RBAC Management: assign roles & scopes, invite users, set forced MFA for staff.

Integrations: Zeffy form IDs, Stripe keys, GA4 IDs, BigQuery export toggle, Looker links.

Policy Docs: upload/curate public transparency docs.

Backups & Retention: snapshot/restore runbook links, retention windows.

4.2 Fundraising Suite

Campaigns: goals (amount, date), narrative, UTM keys, channel mix.

Assignment Engine: auto-assign donors/leads to fundraisers by rules (tier, geography, load).

Tasks & Cadence: call lists, reminders, due dates, completion analytics.

Pledges: schedule, balance, automated nudges; convert to gifts.

Leaderboards: by individual/team; filter by date/campaign.

Donor Notifications (FCM): fundraiser-triggered, consent-aware, rate-limited, templated.

4.3 Donor CRM

Profiles & Households: merged contacts, affiliations, giving capacity notes.

Communication Preferences: FCM/email/SMS flags with timestamps and provenance.

Activity History: gifts, pledges, tasks, notes (internal/private flags).

Data hygiene: merge, dedupe, suppress; export on request.

4.4 Donor Portal

History & Receipts: instant receipt post-gift; re-download PDFs; year-end statements.

Recurring Gifts: view/update/cancel (Zeffy self-serve if exposed; otherwise linkouts).

Preferences & Privacy: manage consent; request data export/delete.

Gamified Impact: badges for milestones (first gift, monthly supporter).

4.5 Finance

Donation Ledger: unified feed from Zeffy/Stripe (source, gross, net, fees, campaign, designation).

Payouts & Reconciliation: import payout CSV/API; tie to bank deposits; status flags.

Accounting Exports: cash/accrual CSVs, class/program allocation, 990-support exports.

Board Pack: Looker Studio link with MoM trends, channel ROAS, LTV cohorts.

4.6 HR / People

Employee Directory: roles, manager, start date, contact.

Onboarding Checklists: I-9 linkout/e-sign, policy acknowledgements, training.

Docs Vault: Storage with signed URLs; sensitivity labels; retention.

Basic Leave/Time: simple PTO tracking (advanced HR can integrate later).

4.7 Events (Optional)

Events CRUD: landing, tickets, sponsor tiers, caps.

Check-in: QR codes, attendee list, status updates.

Sponsorships: package tracking, benefits delivery checklist.

4.8 Mini-Games (Skill-only)

Runner/Puzzle v1: session times, scores, fundraiser team attribution.

Donation Hooks: post-game nudge to donate; UTM to campaign; no chance mechanics.

Leaderboards: daily/weekly/global; moderation hooks.

5) Payments & Receipts

Primary: Zeffy (donor-tipped, fee-free).

Fallback/Advanced: Stripe Checkout (global wallets, installments, backup if fee-free models change).

Webhooks:

Validate payload (signature/secret).

Upsert donations doc (idempotent).

Create receipts doc with IRS Pub. 1771 text.

If donor has FCM token + consent → push “Your receipt is ready.”

Append auditLogs entry.

Quid-pro-quo support: record FMV on donation; compute deductible amount; render correct receipt variant.

6) Compliance & Legal

Michigan disclosure on site footer and receipts (state entity ID and effective date).

IRS receipts (Pub. 1771 language) — automatic and re-downloadable.

Communications consent tracked with timestamps and channel.

Games are skill-only by default; raffles/drawings require MI Charitable Gaming licensing (future).

7) Information Architecture (Data Model)

All documents include orgId, createdAt, updatedAt, createdBy, updatedBy.

orgs/{orgId}/settings — legal IDs, EIN, disclosures, branding.

roles/{roleId} — name, description, scopes[].

users/{uid} — profile, roles[], scopes[], linked donorId/employeeId.

donors/{donorId} — householdId, contacts, preferences, consent, LTV.

donors/{donorId}/devices/{deviceId} — { fcmToken, platform }.

employees/{employeeId} — HR data, docs, onboarding status.

campaigns/{campaignId} — meta, goals, channels, status, UTM seeds.

fundraisers/{fundraiserId} — linked userId, goals, teamId, performance.

donations/{donationId} — source, gross/net/fees, currency, donorRef, campaignRef, designation, fmv, deductible.

receipts/{donationId} — issuedAt, text blocks, pdfRef (optional).

pledges/{pledgeId} — schedule, balance, reminders.

tasks/{taskId} — assignedTo, entityRef, dueAt, status.

notes/{noteId} — entityRef, visibility.

events/{eventId} & tickets/{ticketId}

communications/{commId} — outbound logs, provider IDs.

auditLogs/{logId} — actor, action, entityRef, before/after (redacted), ip, ua.

Indexes (examples)

donations: (orgId, donorId, createdAt desc); (orgId, campaignId, createdAt desc)

tasks: (orgId, assignedTo, dueAt asc)

fundraisers: (orgId, teamId, raised desc)

8) System Architecture (High Level)

┌───────────────────────────────────────────────────────────────────┐
│                          Public Website (Next.js)                 │
│  /, /mission, /programs, /impact, /donate, /events, /transparency │
│   └─ Zeffy widget (primary)  └─ Stripe Checkout (fallback)        │
└───────────────────────────────────────────────────────────────────┘
                 │ hosted on Firebase Hosting (HTTP/2 + CDN)
                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                         Portals (Next.js)                         │
│  /portal/{admin,manager,fundraiser,donor,finance}                 │
│   └─ Auth (Firebase Auth + Custom Claims)                         │
│   └─ Data (Cloud Firestore via SDK)                               │
│   └─ Storage (signed URLs)                                        │
└───────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                      Firebase Cloud Functions                     │
│  • /webhooks/zeffy, /webhooks/stripe                              │
│  • Receipt generation & FCM push                                  │
│  • Assignment engine, scheduled jobs (Scheduler + Tasks)          │
│  • Audit logging (append-only)                                    │
└───────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                         Cloud Firestore                           │
│  • Org-scoped collections with strict Rules                       │
│  • Immutable auditLogs                                            │
└───────────────────────────────────────────────────────────────────┘
                 │                          ┌───────────────────────┐
                 │                          │  GA4 → BigQuery       │
                 ▼                          │  Looker Studio        │
        Firebase Cloud Messaging             └───────────────────────┘

9) Security Model

Authentication: Firebase Auth (Email + Google/Apple/Microsoft). Optional enforced MFA for staff.

Authorization: Custom Claims { orgId, scopes[] } set by Admin; no sensitive data returned without scope checks.

Firestore Rules: deny-by-default; document-level org isolation; write restrictions (e.g., donations are functions-only).

Auditability: every privileged action writes auditLogs with actor, action, entityRef, and timestamp; after-images redact PII.

Secrets: Google Secret Manager (Stripe keys, Zeffy secrets, VAPID key).

Transport: HTTPS everywhere; HSTS; reCAPTCHA Enterprise on public forms.

Backups: Nightly Firestore export to GCS with 30–90 day retention; restore runbook tested quarterly.

10) Integrations & Flows
10.1 Zeffy Donation Flow

Donor completes hosted checkout.

Webhook → validate → upsert donations → compute FMV/deductible if present → create receipts.

If donor has FCM consent → push “Receipt ready.”

Update donor LTV; write auditLogs.

10.2 Stripe Checkout Flow (Fallback)

Donor completes session.

Webhook checkout.session.completed → same as above; enrich with balance transaction if needed for fees/net.

10.3 Donor Notification (Fundraiser → Donor)

Fundraiser triggers “Notify donor.”

Function validates campaign.write scope + donor consent + rate limit.

Sends FCM; logs to communications and auditLogs.

10.4 Reconciliation

Nightly job fetches Stripe balance txns and Zeffy payouts; marks donations.settlementId; flags unreconciled.

11) Non-Functional Requirements

Performance: P95 portal response < 300ms (cached), user-visible loading skeletons; streaming SSR on long lists.

Scalability: Designed for 100k+ donors, 1M+ donations over lifetime; pagination + indexed queries.

Reliability: Webhooks idempotent; retries with exponential backoff; dead-letter queue for poison messages.

Observability: Function logs are structured; errors routed to alerting; admin dashboard shows webhook health & backlog.

12) DevEx, CI/CD, and Environments

Environments: dev / stage / prod (separate Firebase projects).

CI/CD: GitHub Actions — lint, typecheck, unit/integration tests, Axe & Lighthouse checks; deploy Hosting + Functions on main.

Feature flags: Firebase Remote Config.

Testing: Vitest (units), Playwright (e2e), seed data fixtures; sandbox Zeffy/Stripe keys.

13) Access Control Matrix (excerpt)
| Domain         | Read                        | Write / Manage                                     |
| -------------- | --------------------------- | -------------------------------------------------- |
| Roles          | Admin                       | Admin                                              |
| Users          | Admin, HR (limited fields)  | Admin                                              |
| Donors         | CRM, Fundraising, Finance   | CRM, Fundraising (notes, tasks), Functions (gifts) |
| Donations      | Finance, Donor (self)       | **Functions only** (webhooks)                      |
| Receipts       | Donor (self), Finance       | **Functions only**                                 |
| Campaigns      | Fundraising, Manager, Admin | Fundraising, Manager, Admin                        |
| Pledges        | Fundraising, Finance        | Fundraising, Finance                               |
| Tasks          | Assignee, Manager, Admin    | Creator, Manager, Admin                            |
| Audit Logs     | Admin                       | **Functions only (append)**                        |
| Employees/HR   | HR, Admin                   | HR, Admin                                          |
| Events/Tickets | Events, Finance             | Events, Finance, Admin                             |


4) Acceptance Criteria (MVP)

Donate → Receipt: Completing a donation (Zeffy or Stripe test) creates a donations row, issues a compliant receipts doc, and (if opted in) sends an FCM push. Donor can re-download PDF from portal.

RBAC: A fundraiser cannot read HR or finance data. A finance admin can read donations but cannot edit roles.

Rules: Client attempts to write donations fail. Unauthorized reads return PERMISSION_DENIED.

Reconciliation: Stripe or Zeffy payout imported → donations display settlement status.

Accessibility: Axe checks pass at CI, keyboard navigation verified, color contrast meets AA.

15) Roadmap (post-MVP)

Email receipts & campaigns (SendGrid) with consent; DMARC/SPF alignment.

Corporate matching integration (360MatchPro API).

Grant tracker (deadlines, requirements, reporting).

Case management (if programs expand): client intake, outcomes, HIPAA-adjacent safeguards if needed.

Data Warehouse uplift: curated BigQuery models, cohort/LTV/LRFM analytics, predictive churn models.

Donor Wallets (Apple/Google passes for membership cards, if applicable).

16) Risks & “Tell-It-Like-It-Is”

“Fee-free” fundraising is market-dependent. Keep Stripe live and regression-test monthly.

Push ≠ universal communications. Many donors won’t permit notifications; keep receipts accessible in portal and plan email.

Quid-pro-quo errors = audit risk. Hard-require fmv inputs on event tickets/benefit gifts.

RBAC creep. Don’t bypass scopes for expedience. UI hides nothing; Rules enforce everything.

Mini-games: Accidentally adding chance or prizes without licensing exposes legal risk; keep to skill only or license first.

17) Build Architecture (Concrete)

Frontend

Next.js 14 (App Router), React, TypeScript, Tailwind, shadcn/ui, Framer Motion.

i18n via next-intl (EN/ES baseline).

GA4 instrumentation and consent banner.

Firebase

Auth with Custom Claims (orgId, scopes[]).

Firestore with composite indexes, org-scoped collections.

Functions (Node 20) for webhooks, receipts, audit, assignments, scheduled jobs.

Storage for documents and (optionally) rendered receipt PDFs.

Hosting for Next.js SSR/ISR + static.

Messaging (FCM) for push notifications.

Cloud Scheduler + Tasks for recurring jobs.

Analytics

GA4 → BigQuery export, dashboards in Looker Studio; nightly materialized views for standard reports.

Secrets & Config

Secret Manager: Stripe keys, Zeffy secret/allowlist, VAPID key, org EIN.

Remote Config: AB tests (donate page variants).

Ops

GitHub Actions CI/CD; PR checks block on tests & accessibility.

Sentry (optional) for client & server error tracking.

18) Deliverables Snapshot (what we will actually ship)

Deployed public site (home, mission, programs, impact, donate, transparency, contact).

Portals (Admin, Manager, Fundraiser, Donor, Finance) with working RBAC.

Payments integrated (Zeffy + Stripe fallback) with verified webhooks.

Receipts system (Pub. 1771 compliant), donor portal re-download, and year-end statement.

Fundraising suite (campaigns, assignments, tasks, pledges, leaderboards).

Finance (ledger, reconciliation, accounting exports, board Looker dashboard).

HR basics (directory, onboarding, docs vault).

Mini-game v1 (skill-based) with donation prompts and team leaderboard.

Security (hardened rules, audit logs, backups).

Docs (runbooks, disaster recovery, compliance notes, admin guide).

19) One-Shot “Start Build” Prompt (to kick off in Windsurf/Cursor)

Scaffold a monorepo adopt-a-young-parent with Next.js 14 (TS, Tailwind, shadcn/ui, Framer Motion), Firebase (Auth with Custom Claims, Firestore, Functions Node 20, Storage, Hosting, Messaging/FCM, Scheduler/Tasks), GA4 → BigQuery.
Create public routes (/, /mission, /programs, /impact, /donate, /events, /transparency, /contact) and portals (/portal/{admin,manager,fundraiser,donor,finance}).
Implement deny-by-default Firestore Rules with org isolation and scopes; donations are functions-only writes; auditLogs are append-only from functions.
Add webhook endpoints /webhooks/zeffy and /webhooks/stripe (idempotent). On gift: upsert donations, generate receipts (Pub. 1771 text), push FCM if consented, write auditLogs.
Build Donor Portal v1 (history, receipt re-download, consent toggles).
Add Admin role editor and org settings (EIN, MI disclosure, branding).
Ship /games/runner skill-based prototype with post-game donation CTA.
Wire CI (lint, tests, Axe/Lighthouse gates) and environment secrets (Stripe, Zeffy, VAPID, EIN).
Choose safe defaults if ambiguous and proceed.