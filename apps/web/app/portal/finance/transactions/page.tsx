"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DollarSign,
  Download,
  Search,
  Filter,
  Calendar,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  donationId: string;
  settlementId?: string;
  source: "stripe" | "zeffy";
  type: "donation" | "refund" | "fee";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  processedAt: any;
  donorName?: string;
  campaignId?: string;
  metadata?: any;
}

export default function TransactionsPage() {
  const { user, claims, hasScope } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    if (!user || !hasScope("finance.read")) {
      setLoading(false);
      return;
    }
    loadTransactions();
  }, [user, dateRange]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, sourceFilter, statusFilter]);

  const loadTransactions = async () => {
    try {
      const orgId = claims.orgId;
      
      // Calculate date filter
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const transactionsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/transactions`),
          orderBy("processedAt", "desc"),
          limit(500)
        )
      );

      const transactionsList = transactionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];

      setTransactions(transactionsList);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.donorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.donationId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((t) => t.source === sourceFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Transaction ID",
      "Donor",
      "Type",
      "Source",
      "Amount",
      "Status",
    ];
    const rows = filteredTransactions.map((t) => [
      t.processedAt?.toDate
        ? new Date(t.processedAt.toDate()).toLocaleDateString()
        : "N/A",
      t.id,
      t.donorName || "Unknown",
      t.type,
      t.source,
      t.amount,
      t.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("finance.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to view transactions.
          </p>
        </div>
      </div>
    );
  }

  const totalAmount = filteredTransactions
    .filter((t) => t.type === "donation" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFees = filteredTransactions
    .filter((t) => t.type === "fee")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = filteredTransactions
    .filter((t) => t.type === "refund")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            View and export all payment transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Donations"
            value={formatCurrency(totalAmount)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Fees"
            value={formatCurrency(totalFees)}
            icon={CreditCard}
            color="red"
          />
          <StatCard
            title="Refunds"
            value={formatCurrency(totalRefunds)}
            icon={RefreshCw}
            color="orange"
          />
          <StatCard
            title="Transactions"
            value={filteredTransactions.length.toString()}
            icon={DollarSign}
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="donation">Donation</option>
              <option value="refund">Refund</option>
              <option value="fee">Fee</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sources</option>
              <option value="stripe">Stripe</option>
              <option value="zeffy">Zeffy</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))
                )}
              </tbody>
            </table>
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
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
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

// Component: Transaction Row
function TransactionRow({ transaction }: { transaction: Transaction }) {
  const typeColors = {
    donation: "bg-green-100 text-green-700",
    refund: "bg-orange-100 text-orange-700",
    fee: "bg-red-100 text-red-700",
  };

  const statusColors = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  const sourceColors = {
    stripe: "bg-purple-100 text-purple-700",
    zeffy: "bg-blue-100 text-blue-700",
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {transaction.processedAt?.toDate
          ? new Date(transaction.processedAt.toDate()).toLocaleDateString()
          : "N/A"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {transaction.donorName || "Unknown"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            typeColors[transaction.type]
          }`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            sourceColors[transaction.source]
          }`}
        >
          {transaction.source.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
        {transaction.type === "refund" || transaction.type === "fee" ? "-" : ""}
        {formatCurrency(transaction.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            statusColors[transaction.status]
          }`}
        >
          {transaction.status}
        </span>
      </td>
    </tr>
  );
}
