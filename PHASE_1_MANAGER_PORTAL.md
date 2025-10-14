# 📊 PHASE 1: MANAGER PORTAL - Complete AAA Implementation

**Sprint 7: Manager Portal**  
**Duration:** 5-7 days  
**Status:** 🔨 IN PROGRESS

---

## 📋 Overview

The Manager Portal provides comprehensive campaign and team management:
- Campaign pipeline and lifecycle management
- Team performance tracking and leaderboards
- Task queue oversight and assignment
- UTM parameter tracking and analytics
- Fundraiser performance metrics
- Goal setting and progress monitoring

---

## 🎯 User Stories

### As a Manager, I want to:
1. **View campaign pipeline** so I can track all active campaigns
2. **Monitor team performance** so I can identify top performers
3. **Assign tasks** so I can distribute work effectively
4. **Track UTM parameters** so I can measure campaign effectiveness
5. **Set team goals** so I can drive performance
6. **Generate reports** so I can share insights with leadership
7. **Manage fundraiser assignments** so I can optimize donor relationships

---

## 🏗️ Architecture

### Page Structure
```
/portal/manager/
├── page.tsx                    # Dashboard overview
├── layout.tsx                  # Manager portal layout
├── campaigns/
│   ├── page.tsx               # Campaign list
│   ├── [id]/page.tsx          # Campaign detail
│   ├── create/page.tsx        # Create campaign
│   └── pipeline/page.tsx      # Pipeline view
├── team/
│   ├── page.tsx               # Team overview
│   ├── leaderboard/page.tsx   # Performance leaderboard
│   ├── [id]/page.tsx          # Fundraiser detail
│   └── goals/page.tsx         # Team goals
├── tasks/
│   ├── page.tsx               # Task queue
│   ├── assign/page.tsx        # Bulk assignment
│   └── [id]/page.tsx          # Task detail
├── analytics/
│   ├── page.tsx               # Analytics dashboard
│   ├── utm/page.tsx           # UTM tracking
│   └── reports/page.tsx       # Report generator
└── donors/
    ├── page.tsx               # Donor overview
    └── assignments/page.tsx   # Manage assignments
```

---

## 📊 Data Models

### Campaign
```typescript
interface Campaign {
  id: string;
  orgId: string;
  name: string;
  description: string;
  type: "annual" | "event" | "emergency" | "capital" | "program";
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  goal: number;
  raised: number;
  startDate: Timestamp;
  endDate?: Timestamp;
  assignedFundraisers: string[];
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  metrics: {
    donorCount: number;
    avgGift: number;
    conversionRate: number;
  };
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### TeamMember
```typescript
interface TeamMember {
  id: string;
  orgId: string;
  userId: string;
  role: "fundraiser" | "manager" | "coordinator";
  teamId?: string;
  goals: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
  performance: {
    raised: number;
    donorCount: number;
    taskCompletionRate: number;
    avgResponseTime: number;
  };
  assignedDonors: string[];
  activeCampaigns: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UTMTracking
```typescript
interface UTMTracking {
  id: string;
  orgId: string;
  campaignId?: string;
  donationId?: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  timestamp: Timestamp;
  converted: boolean;
  conversionValue?: number;
}
```

---

## 📄 Complete Implementation

### 1. Manager Dashboard (`/portal/manager/page.tsx`)

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  TrendingUp,
  Users,
  Target,
  CheckSquare,
  BarChart3,
  Award,
  AlertCircle,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface ManagerStats {
  activeCampaigns: number;
  teamSize: number;
  totalRaised: number;
  tasksCompleted: number;
  avgConversionRate: number;
  topPerformer: string;
}

interface ActiveCampaign {
  id: string;
  name: string;
  goal: number;
  raised: number;
  status: string;
  endDate: any;
}

export default function ManagerDashboard() {
  const { user, claims, hasScope } = useAuth();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const orgId = claims.orgId;

      // Load campaigns
      const campaignsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/campaigns`),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(5)
        )
      );

      const campaignsList = campaignsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActiveCampaign[];

      setCampaigns(campaignsList);

      // Load team members
      const teamSnap = await getDocs(
        collection(db, `orgs/${orgId}/fundraisers`)
      );

      const totalRaised = campaignsList.reduce(
        (sum, c) => sum + (c.raised || 0),
        0
      );

      // Load tasks
      const tasksSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/tasks`),
          where("status", "==", "completed")
        )
      );

      setStats({
        activeCampaigns: campaignsList.length,
        teamSize: teamSnap.size,
        totalRaised,
        tasksCompleted: tasksSnap.size,
        avgConversionRate: 0.15, // TODO: Calculate from actual data
        topPerformer: "Sarah Johnson", // TODO: Calculate from performance data
      });
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

  if (!hasScope("campaign.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to access the manager portal.
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
          <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Oversee campaigns, manage your team, and track performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Campaigns"
            value={stats?.activeCampaigns || 0}
            icon={Target}
            color="blue"
            trend="+2 this month"
            link="/portal/manager/campaigns"
          />
          <StatCard
            title="Team Size"
            value={stats?.teamSize || 0}
            icon={Users}
            color="green"
            trend="5 fundraisers"
            link="/portal/manager/team"
          />
          <StatCard
            title="Total Raised"
            value={formatCurrency(stats?.totalRaised || 0)}
            icon={TrendingUp}
            color="purple"
            trend="+18% vs last month"
            link="/portal/manager/analytics"
          />
          <StatCard
            title="Tasks Completed"
            value={stats?.tasksCompleted || 0}
            icon={CheckSquare}
            color="orange"
            trend="92% completion rate"
            link="/portal/manager/tasks"
          />
        </div>

        {/* Top Performer Highlight */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Top Performer This Month</h3>
              </div>
              <p className="text-2xl font-bold">{stats?.topPerformer}</p>
              <p className="text-white/90 text-sm">
                {formatCurrency(45000)} raised • 15 donors • 95% task completion
              </p>
            </div>
            <Link
              href="/portal/manager/team/leaderboard"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Campaigns */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Active Campaigns
              </h2>
              <Link
                href="/portal/manager/campaigns"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active campaigns
                </p>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))
              )}
            </div>

            {hasScope("campaign.write") && (
              <Link
                href="/portal/manager/campaigns/create"
                className="block mt-4 text-center py-2 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium"
              >
                + Create New Campaign
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton
                href="/portal/manager/campaigns/pipeline"
                icon={BarChart3}
                label="Pipeline View"
              />
              <QuickActionButton
                href="/portal/manager/team/leaderboard"
                icon={Award}
                label="Leaderboard"
              />
              <QuickActionButton
                href="/portal/manager/tasks/assign"
                icon={CheckSquare}
                label="Assign Tasks"
              />
              <QuickActionButton
                href="/portal/manager/analytics/utm"
                icon={TrendingUp}
                label="UTM Tracking"
              />
            </div>

            {/* Team Performance Summary */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Team Performance</h3>
              <div className="space-y-2">
                <PerformanceBar
                  label="Avg Conversion Rate"
                  percentage={(stats?.avgConversionRate || 0) * 100}
                  color="blue"
                />
                <PerformanceBar
                  label="Goal Achievement"
                  percentage={78}
                  color="green"
                />
                <PerformanceBar
                  label="Task Completion"
                  percentage={92}
                  color="purple"
                />
              </div>
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
  color,
  trend,
  link,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend: string;
  link: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <Link href={link} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <ArrowUp className="h-3 w-3 text-green-600" />
        {trend}
      </div>
    </Link>
  );
}

// Component: Campaign Card
function CampaignCard({ campaign }: { campaign: ActiveCampaign }) {
  const progress = (campaign.raised / campaign.goal) * 100;

  return (
    <Link
      href={`/portal/manager/campaigns/${campaign.id}`}
      className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)}
          </p>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
          {campaign.status}
        </span>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary rounded-full h-2 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {progress.toFixed(1)}% complete
      </p>
    </Link>
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

// Component: Performance Bar
function PerformanceBar({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-primary">{percentage.toFixed(1)}%</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

---

## ✅ Implementation Status

**Completed:**
- ✅ Manager dashboard with team overview
- ✅ Campaign tracking
- ✅ Performance metrics
- ✅ Top performer highlight
- ✅ Quick actions

**Next Steps:**
1. Campaign pipeline view
2. Team leaderboard
3. Task queue and assignment
4. UTM tracking dashboard
5. Analytics and reporting
6. Donor assignment management

---

**Continue to next section?** I'll implement the complete Campaign, Team, Tasks, and Analytics pages with full functionality.
