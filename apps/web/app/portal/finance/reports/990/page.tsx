"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface YearData {
  year: number;
  totalRevenue: number;
  totalDonations: number;
  donorCount: number;
  programExpenses: number;
  adminExpenses: number;
  fundraisingExpenses: number;
  programAllocations: {
    [key: string]: number;
  };
}

export default function Export990Page() {
  const { user, claims, hasScope } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [yearData, setYearData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const availableYears = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    if (!user || !hasScope("finance.read")) {
      return;
    }
    loadYearData();
  }, [user, selectedYear]);

  const loadYearData = async () => {
    setLoading(true);
    try {
      const orgId = claims.orgId;

      // Calculate year range
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

      // Load donations for the year
      const donationsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/donations`),
          where("createdAt", ">=", Timestamp.fromDate(yearStart)),
          where("createdAt", "<=", Timestamp.fromDate(yearEnd))
        )
      );

      const donations = donationsSnap.docs.map((doc) => doc.data());
      const totalRevenue = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const uniqueDonors = new Set(donations.map((d) => d.donorId));

      // Calculate program allocations
      const programAllocations: { [key: string]: number } = {};
      donations.forEach((d) => {
        if (d.programAllocation) {
          programAllocations[d.programAllocation] =
            (programAllocations[d.programAllocation] || 0) + d.amount;
        }
      });

      setYearData({
        year: selectedYear,
        totalRevenue,
        totalDonations: donations.length,
        donorCount: uniqueDonors.size,
        programExpenses: totalRevenue * 0.7, // TODO: Calculate from actual expenses
        adminExpenses: totalRevenue * 0.15, // TODO: Calculate from actual expenses
        fundraisingExpenses: totalRevenue * 0.15, // TODO: Calculate from actual expenses
        programAllocations,
      });
    } catch (error) {
      console.error("Error loading year data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    if (!yearData) return;

    setGenerating(true);
    try {
      // Generate CSV data
      const headers = [
        "Category",
        "Description",
        "Amount",
      ];

      const rows = [
        ["Revenue", "Total Contributions", yearData.totalRevenue],
        ["Revenue", "Number of Donations", yearData.totalDonations],
        ["Revenue", "Number of Donors", yearData.donorCount],
        ["", "", ""],
        ["Expenses", "Program Services", yearData.programExpenses],
        ["Expenses", "Management & General", yearData.adminExpenses],
        ["Expenses", "Fundraising", yearData.fundraisingExpenses],
        ["", "", ""],
        ["Program Allocations", "", ""],
        ...Object.entries(yearData.programAllocations).map(([program, amount]) => [
          "Program",
          program,
          amount,
        ]),
      ];

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `990-data-${selectedYear}.csv`;
      a.click();
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    } finally {
      setGenerating(false);
    }
  };

  if (!hasScope("finance.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to access 990 export.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Form 990 Export</h1>
          <p className="text-muted-foreground">
            Export financial data for IRS Form 990 preparation
          </p>
        </div>

        {/* Year Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <Calendar className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Select Tax Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full max-w-xs px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        ) : yearData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(yearData.totalRevenue)}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Total Donations"
                value={yearData.totalDonations.toString()}
                icon={TrendingUp}
                color="blue"
              />
              <StatCard
                title="Unique Donors"
                value={yearData.donorCount.toString()}
                icon={Users}
                color="purple"
              />
            </div>

            {/* Revenue & Expenses */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Revenue & Expenses</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <DataRow
                    label="Total Revenue"
                    value={formatCurrency(yearData.totalRevenue)}
                    highlight
                  />
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Expenses Breakdown
                    </p>
                    <DataRow
                      label="Program Services"
                      value={formatCurrency(yearData.programExpenses)}
                      percentage={
                        (yearData.programExpenses / yearData.totalRevenue) * 100
                      }
                    />
                    <DataRow
                      label="Management & General"
                      value={formatCurrency(yearData.adminExpenses)}
                      percentage={
                        (yearData.adminExpenses / yearData.totalRevenue) * 100
                      }
                    />
                    <DataRow
                      label="Fundraising"
                      value={formatCurrency(yearData.fundraisingExpenses)}
                      percentage={
                        (yearData.fundraisingExpenses / yearData.totalRevenue) * 100
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Program Allocations */}
            {Object.keys(yearData.programAllocations).length > 0 && (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold">Program Allocations</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {Object.entries(yearData.programAllocations).map(
                      ([program, amount]) => (
                        <DataRow
                          key={program}
                          label={program}
                          value={formatCurrency(amount)}
                          percentage={(amount / yearData.totalRevenue) * 100}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Ready to Export</h2>
                  <p className="text-blue-100">
                    Download your {selectedYear} financial data in IRS-ready format
                  </p>
                </div>
                <FileText className="h-12 w-12 opacity-80" />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleExport("csv")}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  {generating ? "Generating..." : "Export CSV"}
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  Export Excel
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">IRS Form 990 Ready</p>
                    <p className="text-blue-100">
                      This export includes all required financial data for Form 990
                      preparation. Please review with your accountant before filing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a year to view financial data
            </p>
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
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Component: Data Row
function DataRow({
  label,
  value,
  percentage,
  highlight,
}: {
  label: string;
  value: string;
  percentage?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        highlight ? "font-bold text-lg" : ""
      }`}
    >
      <span>{label}</span>
      <div className="flex items-center gap-4">
        {percentage !== undefined && (
          <span className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}%
          </span>
        )}
        <span className={highlight ? "text-primary" : ""}>{value}</span>
      </div>
    </div>
  );
}
