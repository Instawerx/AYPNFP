"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getSystemMetrics,
  getAllFormAnalytics,
  getTopTemplates,
  getTopUsers,
  getDailyMetrics,
  FormAnalytics,
  UserAnalytics,
  SystemMetrics,
  DailyMetrics,
} from "@/lib/analytics";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user, claims } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [topTemplates, setTopTemplates] = useState<FormAnalytics[]>([]);
  const [topUsers, setTopUsers] = useState<UserAnalytics[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    if (claims?.orgId) {
      loadAnalytics();
    }
  }, [claims?.orgId, timeRange]);

  const loadAnalytics = async () => {
    if (!claims?.orgId) return;

    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);

      // Load all analytics
      const [metrics, templates, users, daily] = await Promise.all([
        getSystemMetrics(claims.orgId),
        getTopTemplates(claims.orgId, 10),
        getTopUsers(claims.orgId, 10),
        getDailyMetrics(
          claims.orgId,
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        ),
      ]);

      setSystemMetrics(metrics);
      setTopTemplates(templates);
      setTopUsers(users);
      setDailyMetrics(daily);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track form submissions, user activity, and system performance
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Submissions"
          value={formatNumber(systemMetrics?.totalSubmissions || 0)}
          icon={<FileText className="h-5 w-5" />}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="Pending Review"
          value={formatNumber(systemMetrics?.pendingSubmissions || 0)}
          icon={<AlertCircle className="h-5 w-5" />}
          trend="3 urgent"
          trendUp={false}
        />
        <MetricCard
          title="Avg Processing Time"
          value={formatHours(systemMetrics?.avgProcessingTime || 0)}
          icon={<Clock className="h-5 w-5" />}
          trend="-15%"
          trendUp={true}
        />
        <MetricCard
          title="Active Templates"
          value={formatNumber(systemMetrics?.totalTemplates || 0)}
          icon={<BarChart3 className="h-5 w-5" />}
          trend={`${formatNumber(systemMetrics?.avgSubmissionsPerDay || 0)}/day`}
          trendUp={true}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Submissions Over Time */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Submissions Over Time</h3>
          <SubmissionsChart data={dailyMetrics} />
        </div>

        {/* Status Distribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <StatusDistribution
            pending={systemMetrics?.pendingSubmissions || 0}
            total={systemMetrics?.totalSubmissions || 0}
          />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Templates */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Templates</h3>
          <div className="space-y-3">
            {topTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data available</p>
            ) : (
              topTemplates.map((template, index) => (
                <div
                  key={template.templateId}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{template.templateName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(template.totalSubmissions)} submissions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {template.approvedSubmissions} approved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.rejectedSubmissions} rejected
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {topUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data available</p>
            ) : (
              topUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.userEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(user.totalSubmissions)} submissions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {user.totalApprovals} approvals
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.totalRejections} rejections
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
        <span
          className={`text-sm font-medium ${
            trendUp ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          {trend}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

// Submissions Chart Component
function SubmissionsChart({ data }: { data: DailyMetrics[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.submissions || 0), 1);

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((day, index) => {
          const height = ((day.submissions || 0) / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end h-48">
                <div
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{ height: `${height}%` }}
                  title={`${day.submissions || 0} submissions`}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Status Distribution Component
function StatusDistribution({
  pending,
  total,
}: {
  pending: number;
  total: number;
}) {
  const completed = total - pending;
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Bars */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completed</span>
            <span className="text-sm text-muted-foreground">
              {completed} ({completedPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${completedPercent}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pending</span>
            <span className="text-sm text-muted-foreground">
              {pending} ({pendingPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${pendingPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
      </div>
    </div>
  );
}
