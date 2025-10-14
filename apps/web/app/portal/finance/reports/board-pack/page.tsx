"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BoardPackData {
  period: string;
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    growth: number;
  };
  donors: {
    total: number;
    new: number;
    retained: number;
    lapsed: number;
  };
  campaigns: {
    active: number;
    completed: number;
    totalRaised: number;
  };
  expenses: {
    total: number;
    programExpenses: number;
    adminExpenses: number;
    fundraisingExpenses: number;
  };
  netIncome: number;
}

export default function BoardPackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [boardPackData, setBoardPackData] = useState<BoardPackData | null>(null);

  useEffect(() => {
    if (user) {
      fetchBoardPackData();
    }
  }, [user, selectedPeriod]);

  const fetchBoardPackData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      let endDate = now;
      let periodLabel = "";

      switch (selectedPeriod) {
        case "current-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          break;
        case "last-month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          periodLabel = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          break;
        case "current-quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          periodLabel = `Q${quarter + 1} ${now.getFullYear()}`;
          break;
        case "ytd":
          startDate = new Date(now.getFullYear(), 0, 1);
          periodLabel = `YTD ${now.getFullYear()}`;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }

      // Fetch donations for the period
      const donationsRef = collection(db, "donations");
      const donationsQuery = query(
        donationsRef,
        where("orgId", "==", user.orgId),
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "desc")
      );

      const donationsSnap = await getDocs(donationsQuery);
      const donations = donationsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate revenue metrics
      const totalRevenue = donations.reduce((sum, d: any) => sum + (d.amount || 0), 0);
      const recurringRevenue = donations
        .filter((d: any) => d.isRecurring)
        .reduce((sum, d: any) => sum + (d.amount || 0), 0);
      const oneTimeRevenue = totalRevenue - recurringRevenue;

      // Fetch previous period for growth calculation
      const prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      const prevEndDate = new Date(endDate);
      prevEndDate.setMonth(prevEndDate.getMonth() - 1);

      const prevDonationsQuery = query(
        donationsRef,
        where("orgId", "==", user.orgId),
        where("createdAt", ">=", Timestamp.fromDate(prevStartDate)),
        where("createdAt", "<=", Timestamp.fromDate(prevEndDate))
      );

      const prevDonationsSnap = await getDocs(prevDonationsQuery);
      const prevRevenue = prevDonationsSnap.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      );
      const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      // Fetch donor metrics
      const donorsRef = collection(db, "donors");
      const donorsQuery = query(donorsRef, where("orgId", "==", user.orgId));
      const donorsSnap = await getDocs(donorsQuery);

      const uniqueDonorIds = new Set(donations.map((d: any) => d.donorId).filter(Boolean));
      const newDonors = donorsSnap.docs.filter((doc) => {
        const data = doc.data();
        return (
          data.firstDonationDate &&
          data.firstDonationDate.toDate() >= startDate &&
          data.firstDonationDate.toDate() <= endDate
        );
      }).length;

      // Fetch campaign metrics
      const campaignsRef = collection(db, "campaigns");
      const campaignsQuery = query(campaignsRef, where("orgId", "==", user.orgId));
      const campaignsSnap = await getDocs(campaignsQuery);

      const activeCampaigns = campaignsSnap.docs.filter(
        (doc) => doc.data().status === "active"
      ).length;
      const completedCampaigns = campaignsSnap.docs.filter(
        (doc) => doc.data().status === "completed"
      ).length;

      // Mock expense data (would come from accounting system)
      const mockExpenses = {
        total: totalRevenue * 0.35, // 35% expense ratio
        programExpenses: totalRevenue * 0.25,
        adminExpenses: totalRevenue * 0.07,
        fundraisingExpenses: totalRevenue * 0.03,
      };

      setBoardPackData({
        period: periodLabel,
        revenue: {
          total: totalRevenue,
          recurring: recurringRevenue,
          oneTime: oneTimeRevenue,
          growth,
        },
        donors: {
          total: uniqueDonorIds.size,
          new: newDonors,
          retained: uniqueDonorIds.size - newDonors,
          lapsed: 0, // Would calculate from historical data
        },
        campaigns: {
          active: activeCampaigns,
          completed: completedCampaigns,
          totalRaised: totalRevenue,
        },
        expenses: mockExpenses,
        netIncome: totalRevenue - mockExpenses.total,
      });
    } catch (error) {
      console.error("Error fetching board pack data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    // In production, this would call a Cloud Function to generate a PDF
    alert("PDF generation would be implemented here using a service like PDFKit or Puppeteer");
  };

  const exportToCSV = () => {
    if (!boardPackData) return;

    const csvContent = `Board Pack Report - ${boardPackData.period}

REVENUE SUMMARY
Total Revenue,${formatCurrency(boardPackData.revenue.total)}
Recurring Revenue,${formatCurrency(boardPackData.revenue.recurring)}
One-Time Revenue,${formatCurrency(boardPackData.revenue.oneTime)}
Growth vs Previous Period,${boardPackData.revenue.growth.toFixed(1)}%

DONOR METRICS
Total Donors,${boardPackData.donors.total}
New Donors,${boardPackData.donors.new}
Retained Donors,${boardPackData.donors.retained}
Lapsed Donors,${boardPackData.donors.lapsed}

CAMPAIGN METRICS
Active Campaigns,${boardPackData.campaigns.active}
Completed Campaigns,${boardPackData.campaigns.completed}
Total Raised,${formatCurrency(boardPackData.campaigns.totalRaised)}

EXPENSE SUMMARY
Total Expenses,${formatCurrency(boardPackData.expenses.total)}
Program Expenses,${formatCurrency(boardPackData.expenses.programExpenses)}
Administrative Expenses,${formatCurrency(boardPackData.expenses.adminExpenses)}
Fundraising Expenses,${formatCurrency(boardPackData.expenses.fundraisingExpenses)}

NET INCOME
Net Income,${formatCurrency(boardPackData.netIncome)}
`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `board-pack-${boardPackData.period.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Board Pack</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive financial and operational report for board meetings
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="w-4 h-4" />
            Generate PDF
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {[
          { value: "current-month", label: "Current Month" },
          { value: "last-month", label: "Last Month" },
          { value: "current-quarter", label: "Current Quarter" },
          { value: "ytd", label: "Year to Date" },
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === period.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {boardPackData && (
        <>
          {/* Period Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Reporting Period</span>
            </div>
            <h2 className="text-3xl font-bold">{boardPackData.period}</h2>
          </div>

          {/* Revenue Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Revenue Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(boardPackData.revenue.total)}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={`text-sm font-medium ${
                      boardPackData.revenue.growth >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {boardPackData.revenue.growth >= 0 ? "+" : ""}
                    {boardPackData.revenue.growth.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs previous period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Recurring Revenue</span>
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(boardPackData.revenue.recurring)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {((boardPackData.revenue.recurring / boardPackData.revenue.total) * 100).toFixed(
                    0
                  )}
                  % of total
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">One-Time Revenue</span>
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(boardPackData.revenue.oneTime)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {((boardPackData.revenue.oneTime / boardPackData.revenue.total) * 100).toFixed(0)}
                  % of total
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Net Income</span>
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(boardPackData.netIncome)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {((boardPackData.netIncome / boardPackData.revenue.total) * 100).toFixed(0)}% net
                  margin
                </div>
              </div>
            </div>
          </div>

          {/* Donor Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Donor Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">Total Donors</span>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {boardPackData.donors.total}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">New Donors</span>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  +{boardPackData.donors.new}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">Retained Donors</span>
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {boardPackData.donors.retained}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">Avg Gift Size</span>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(boardPackData.revenue.total / boardPackData.donors.total)}
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Campaign Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">Active Campaigns</span>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {boardPackData.campaigns.active}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">Completed Campaigns</span>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {boardPackData.campaigns.completed}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-sm text-gray-600">Total Raised</span>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(boardPackData.campaigns.totalRaised)}
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-600" />
              Expense Breakdown
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Program Expenses</div>
                    <div className="text-sm text-gray-500">Direct program delivery costs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(boardPackData.expenses.programExpenses)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(
                        (boardPackData.expenses.programExpenses / boardPackData.expenses.total) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Administrative Expenses</div>
                    <div className="text-sm text-gray-500">Operations and overhead</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(boardPackData.expenses.adminExpenses)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(
                        (boardPackData.expenses.adminExpenses / boardPackData.expenses.total) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Fundraising Expenses</div>
                    <div className="text-sm text-gray-500">Development and donor acquisition</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(boardPackData.expenses.fundraisingExpenses)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(
                        (boardPackData.expenses.fundraisingExpenses / boardPackData.expenses.total) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex items-center justify-between">
                  <div className="font-bold text-gray-900">Total Expenses</div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(boardPackData.expenses.total)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Revenue {boardPackData.revenue.growth >= 0 ? "increased" : "decreased"} by{" "}
                  {Math.abs(boardPackData.revenue.growth).toFixed(1)}% compared to the previous
                  period
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Recurring revenue represents{" "}
                  {((boardPackData.revenue.recurring / boardPackData.revenue.total) * 100).toFixed(
                    0
                  )}
                  % of total revenue, providing stable funding
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Program expenses account for{" "}
                  {(
                    (boardPackData.expenses.programExpenses / boardPackData.expenses.total) *
                    100
                  ).toFixed(0)}
                  % of total expenses, demonstrating strong mission focus
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Net margin of{" "}
                  {((boardPackData.netIncome / boardPackData.revenue.total) * 100).toFixed(0)}%
                  indicates {boardPackData.netIncome >= 0 ? "healthy" : "concerning"} financial
                  sustainability
                </span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
