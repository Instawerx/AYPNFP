"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  ExternalLink,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface UTMData {
  source: string;
  medium: string;
  campaign: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const { user, claims, hasScope } = useAuth();
  const [utmData, setUtmData] = useState<UTMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "quarter">("month");

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadAnalytics();
  }, [user, timePeriod]);

  const loadAnalytics = async () => {
    try {
      const orgId = claims.orgId;

      // Load UTM tracking data
      const utmSnap = await getDocs(
        collection(db, `orgs/${orgId}/utmTracking`)
      );

      // Aggregate data by source/medium/campaign
      const aggregated: { [key: string]: UTMData } = {};

      utmSnap.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.source}-${data.medium}-${data.campaign}`;

        if (!aggregated[key]) {
          aggregated[key] = {
            source: data.source || "direct",
            medium: data.medium || "none",
            campaign: data.campaign || "none",
            clicks: 0,
            conversions: 0,
            revenue: 0,
            conversionRate: 0,
          };
        }

        aggregated[key].clicks += 1;
        if (data.converted) {
          aggregated[key].conversions += 1;
          aggregated[key].revenue += data.conversionValue || 0;
        }
      });

      // Calculate conversion rates
      const dataList = Object.values(aggregated).map((item) => ({
        ...item,
        conversionRate: item.clicks > 0 ? item.conversions / item.clicks : 0,
      }));

      // Sort by revenue
      dataList.sort((a, b) => b.revenue - a.revenue);

      setUtmData(dataList);
    } catch (error) {
      console.error("Error loading analytics:", error);
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
            You don't have permission to view analytics.
          </p>
        </div>
      </div>
    );
  }

  const totalClicks = utmData.reduce((sum, item) => sum + item.clicks, 0);
  const totalConversions = utmData.reduce((sum, item) => sum + item.conversions, 0);
  const totalRevenue = utmData.reduce((sum, item) => sum + item.revenue, 0);
  const avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            UTM Analytics
          </h1>
          <p className="text-muted-foreground">
            Track campaign performance and conversion sources
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Time Period:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTimePeriod("week")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === "week"
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimePeriod("month")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === "month"
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimePeriod("quarter")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === "quarter"
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Clicks"
            value={totalClicks.toString()}
            icon={MousePointerClick}
            color="blue"
          />
          <StatCard
            title="Conversions"
            value={totalConversions.toString()}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Conversion Rate"
            value={`${(avgConversionRate * 100).toFixed(1)}%`}
            icon={BarChart3}
            color="orange"
          />
        </div>

        {/* UTM Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold">Campaign Performance</h2>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {utmData.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tracking data yet</h3>
              <p className="text-muted-foreground">
                UTM tracking data will appear here as campaigns are tracked
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Medium
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conversions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conv. Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {utmData.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.source}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.medium}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.campaign}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {item.conversions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{
                                width: `${Math.min(item.conversionRate * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {(item.conversionRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performers */}
        {utmData.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <TopPerformerCard
              title="Best Conversion Rate"
              data={[...utmData].sort((a, b) => b.conversionRate - a.conversionRate)[0]}
              metric="conversionRate"
            />
            <TopPerformerCard
              title="Most Revenue"
              data={[...utmData].sort((a, b) => b.revenue - a.revenue)[0]}
              metric="revenue"
            />
            <TopPerformerCard
              title="Most Clicks"
              data={[...utmData].sort((a, b) => b.clicks - a.clicks)[0]}
              metric="clicks"
            />
          </div>
        )}
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
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Component: Top Performer Card
function TopPerformerCard({
  title,
  data,
  metric,
}: {
  title: string;
  data: UTMData;
  metric: "conversionRate" | "revenue" | "clicks";
}) {
  const getValue = () => {
    switch (metric) {
      case "conversionRate":
        return `${(data.conversionRate * 100).toFixed(1)}%`;
      case "revenue":
        return formatCurrency(data.revenue);
      case "clicks":
        return data.clicks.toString();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="mb-2">
        <p className="text-sm text-white/80">Source / Medium</p>
        <p className="text-xl font-bold">
          {data.source} / {data.medium}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-white/80">Campaign</p>
        <p className="font-medium">{data.campaign}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-3xl font-bold">{getValue()}</p>
      </div>
    </div>
  );
}
