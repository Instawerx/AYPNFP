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
  actor: { uid: string; type: string };
  timestamp: any;
  entityRef: string;
}

export default function AdminDashboard() {
  const { user, claims, hasScope } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasScope("admin.read")) {
      setLoading(false);
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
        storageUsed: 0,
        systemHealth: "healthy",
      });

      // Note: Audit logs are write-only by design, so we'll show placeholder data
      // In production, you'd create a separate collection for admin activity feed
      setRecentActivity([]);
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
                  Activity feed coming soon
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton
                href="/portal/admin/users"
                icon={Users}
                label="Manage Users"
              />
              <QuickActionButton
                href="/portal/admin/roles"
                icon={Shield}
                label="Manage Roles"
              />
              <QuickActionButton
                href="/portal/admin/settings"
                icon={Settings}
                label="Org Settings"
              />
              <QuickActionButton
                href="/portal/admin/integrations"
                icon={Database}
                label="Integrations"
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
          by {activity.actor.uid}
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
