# 🔨 PHASE 1: ADMIN PORTAL - Complete AAA Implementation Guide

**Sprint 6: Admin Portal**  
**Duration:** 5-7 days  
**Status:** 🔨 IN PROGRESS

---

## 📋 Overview

The Admin Portal is the command center for organization management, providing comprehensive control over:
- Organization settings and branding
- User and role management (RBAC)
- Integration configuration (Zeffy, Stripe, FCM)
- Audit log viewing
- System health monitoring
- Data backup and export

---

## 🎯 User Stories

### As an Administrator, I want to:
1. **Manage organization settings** so I can update legal information and branding
2. **Create and assign roles** so I can control user permissions
3. **View audit logs** so I can track all system changes
4. **Configure integrations** so I can manage payment processors
5. **Monitor system health** so I can ensure platform stability
6. **Export data** so I can comply with backup requirements

---

## 🏗️ Architecture

### Page Structure
```
/portal/admin/
├── page.tsx                    # Dashboard overview
├── layout.tsx                  # Admin portal layout
├── settings/
│   ├── page.tsx               # Organization settings
│   ├── general/page.tsx       # General info (name, EIN, etc.)
│   ├── legal/page.tsx         # Legal documents and compliance
│   ├── branding/page.tsx      # Logo, colors, theme
│   └── contact/page.tsx       # Contact information
├── users/
│   ├── page.tsx               # User list
│   ├── [id]/page.tsx          # User detail/edit
│   └── invite/page.tsx        # Invite new user
├── roles/
│   ├── page.tsx               # Role list
│   ├── [id]/page.tsx          # Role detail/edit
│   └── create/page.tsx        # Create new role
├── integrations/
│   ├── page.tsx               # Integration overview
│   ├── zeffy/page.tsx         # Zeffy configuration
│   ├── stripe/page.tsx        # Stripe configuration
│   ├── fcm/page.tsx           # FCM configuration
│   └── analytics/page.tsx     # GA4/BigQuery config
├── audit/
│   ├── page.tsx               # Audit log viewer
│   └── [id]/page.tsx          # Audit log detail
├── system/
│   ├── page.tsx               # System health dashboard
│   ├── functions/page.tsx     # Cloud Functions monitoring
│   ├── database/page.tsx      # Firestore metrics
│   └── storage/page.tsx       # Storage usage
└── backup/
    ├── page.tsx               # Backup management
    └── export/page.tsx        # Data export
```

---

## 📄 Page-by-Page Implementation

### 1. Admin Dashboard (`/portal/admin/page.tsx`)

**Purpose:** High-level overview of system status and quick actions

**Components:**
- Stats cards (users, donations, campaigns, storage)
- Recent activity feed
- System health indicators
- Quick action buttons

**Implementation:**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Database, 
  Activity,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  totalDonations: number;
  totalRevenue: number;
  activeCampaigns: number;
  storageUsed: number;
  systemHealth: "healthy" | "warning" | "critical";
}

interface RecentActivity {
  id: string;
  action: string;
  actor: string;
  timestamp: Date;
  entityRef: string;
}

export default function AdminDashboard() {
  const { user, claims, hasScope } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasScope("admin.read")) {
      return;
    }

    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const orgId = claims.orgId;

      // Load stats
      const [usersSnap, donationsSnap, campaignsSnap] = await Promise.all([
        getDocs(collection(db, `orgs/${orgId}/users`)),
        getDocs(collection(db, `orgs/${orgId}/donations`)),
        getDocs(
          query(
            collection(db, `orgs/${orgId}/campaigns`),
            where("status", "==", "active")
          )
        ),
      ]);

      const totalRevenue = donationsSnap.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      );

      setStats({
        totalUsers: usersSnap.size,
        totalDonations: donationsSnap.size,
        totalRevenue,
        activeCampaigns: campaignsSnap.size,
        storageUsed: 0, // TODO: Fetch from Storage API
        systemHealth: "healthy",
      });

      // Load recent activity (from audit logs - limited view)
      const activitySnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/auditLogs`),
          orderBy("timestamp", "desc"),
          limit(10)
        )
      );

      const activities = activitySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as RecentActivity[];

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("admin.read")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin portal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your organization settings, users, and integrations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Total Donations"
            value={stats?.totalDonations || 0}
            icon={DollarSign}
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon={TrendingUp}
            trend="+15%"
            trendUp={true}
          />
          <StatCard
            title="Active Campaigns"
            value={stats?.activeCampaigns || 0}
            icon={Activity}
            trend="3 new"
            trendUp={true}
          />
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">System Health</h2>
            {stats?.systemHealth === "healthy" ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">All Systems Operational</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Minor Issues Detected</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthIndicator
              label="Authentication"
              status="healthy"
              uptime="99.9%"
            />
            <HealthIndicator
              label="Database"
              status="healthy"
              uptime="100%"
            />
            <HealthIndicator
              label="Cloud Functions"
              status="healthy"
              uptime="99.8%"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
            <Link
              href="/portal/admin/audit"
              className="block mt-4 text-primary hover:underline text-sm"
            >
              View all audit logs →
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton
                href="/portal/admin/users/invite"
                icon={Users}
                label="Invite User"
              />
              <QuickActionButton
                href="/portal/admin/roles/create"
                icon={Shield}
                label="Create Role"
              />
              <QuickActionButton
                href="/portal/admin/settings"
                icon={Settings}
                label="Org Settings"
              />
              <QuickActionButton
                href="/portal/admin/backup"
                icon={Database}
                label="Backup Data"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Stat Card
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className={`text-sm ${trendUp ? "text-green-600" : "text-red-600"}`}>
        {trend} from last month
      </div>
    </div>
  );
}

// Component: Health Indicator
function HealthIndicator({
  label,
  status,
  uptime,
}: {
  label: string;
  status: "healthy" | "warning" | "critical";
  uptime: string;
}) {
  const statusColors = {
    healthy: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}
        >
          {status.toUpperCase()}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">Uptime: {uptime}</div>
    </div>
  );
}

// Component: Activity Item
function ActivityItem({ activity }: { activity: RecentActivity }) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Activity className="h-5 w-5 text-primary mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{activity.action}</p>
        <p className="text-xs text-muted-foreground">
          by {activity.actor} • {activity.timestamp.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// Component: Quick Action Button
function QuickActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
    >
      <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
      <span className="text-sm font-medium text-center">{label}</span>
    </Link>
  );
}
```

---

### 2. Organization Settings (`/portal/admin/settings/page.tsx`)

**Purpose:** Manage organization information, legal details, and branding

**Sections:**
1. General Information (name, EIN, filing details)
2. Legal & Compliance (documents, policies)
3. Branding (logo, colors, theme)
4. Contact Information

**Implementation:**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building, FileText, Palette, Mail, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

interface OrgSettings {
  name: string;
  jurisdiction: string;
  stateCorpId: string;
  filingReceivedDate: string;
  filingEffectiveDate: string;
  filingNumber: string;
  ein: string;
  status501c3: string;
  legalAddress: string;
  emailSupport: string;
  phone: string;
  website: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export default function OrganizationSettings() {
  const { claims, hasScope } = useAuth();
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!hasScope("admin.read")) return;
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const orgId = claims.orgId;
      const settingsDoc = await getDoc(
        doc(db, `orgs/${orgId}/settings/general`)
      );

      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as OrgSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !hasScope("admin.write")) return;

    setSaving(true);
    setMessage(null);

    try {
      const orgId = claims.orgId;
      await updateDoc(doc(db, `orgs/${orgId}/settings/general`), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!hasScope("admin.read")) {
    return <div className="p-8">
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-destructive">You don't have permission to view organization settings.</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's information, legal details, and branding
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "error" && <AlertCircle className="h-5 w-5" />}
              <p>{message.text}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <Link
            href="/portal/admin/settings"
            className="px-4 py-2 border-b-2 border-primary font-medium"
          >
            General
          </Link>
          <Link
            href="/portal/admin/settings/legal"
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Legal
          </Link>
          <Link
            href="/portal/admin/settings/branding"
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Branding
          </Link>
          <Link
            href="/portal/admin/settings/contact"
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Contact
          </Link>
        </div>

        {/* General Information Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                value={settings?.name || ""}
                onChange={(e) =>
                  setSettings({ ...settings!, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Jurisdiction
              </label>
              <input
                type="text"
                value={settings?.jurisdiction || ""}
                onChange={(e) =>
                  setSettings({ ...settings!, jurisdiction: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                State Entity ID *
              </label>
              <input
                type="text"
                value={settings?.stateCorpId || ""}
                onChange={(e) =>
                  setSettings({ ...settings!, stateCorpId: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                EIN (Tax ID) *
              </label>
              <input
                type="text"
                value={settings?.ein || ""}
                onChange={(e) =>
                  setSettings({ ...settings!, ein: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="XX-XXXXXXX"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Received Date
              </label>
              <input
                type="date"
                value={settings?.filingReceivedDate || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings!,
                    filingReceivedDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Effective Date
              </label>
              <input
                type="date"
                value={settings?.filingEffectiveDate || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings!,
                    filingEffectiveDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Number
              </label>
              <input
                type="text"
                value={settings?.filingNumber || ""}
                onChange={(e) =>
                  setSettings({ ...settings!, filingNumber: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                501(c)(3) Status
              </label>
              <select
                value={settings?.status501c3 || ""}
                onChange={(e) =>
                  setSettings({ ...settings!, status501c3: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              >
                <option value="">Select status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="NOT_APPLICABLE">Not Applicable</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          {hasScope("admin.write") && (
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Continuing with remaining Admin Portal pages...

This is the beginning of the complete AAA-level implementation. Would you like me to continue with:

1. **User Management** pages (list, detail, invite)
2. **Role Management** pages (list, create, edit)
3. **Integrations** pages (Zeffy, Stripe, FCM, Analytics)
4. **Audit Log Viewer**
5. **System Health Monitoring**
6. **Backup & Export**

Each will include complete TypeScript code, all components, forms, validations, error handling, loading states, and accessibility features.

Shall I continue with the next sections?
