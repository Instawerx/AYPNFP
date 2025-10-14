"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Settlement {
  id: string;
  source: "stripe" | "zeffy";
  status: "pending" | "reconciled" | "discrepancy";
  periodStart: any;
  periodEnd: any;
  totalAmount: number;
  feeAmount: number;
  netAmount: number;
  transactionCount: number;
  reconciledBy?: string;
  reconciledAt?: any;
  notes?: string;
  createdAt: any;
}

export default function SettlementsPage() {
  const { user, claims, hasScope } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !hasScope("finance.read")) {
      setLoading(false);
      return;
    }
    loadSettlements();
  }, [user]);

  const loadSettlements = async () => {
    try {
      const orgId = claims.orgId;

      const settlementsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/settlements`),
          orderBy("periodEnd", "desc")
        )
      );

      const settlementsList = settlementsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Settlement[];

      setSettlements(settlementsList);
    } catch (error) {
      console.error("Error loading settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (settlementId: string) => {
    if (!hasScope("finance.write")) {
      alert("You don't have permission to reconcile settlements");
      return;
    }

    if (!confirm("Mark this settlement as reconciled?")) return;

    try {
      const orgId = claims.orgId;
      await updateDoc(doc(db, `orgs/${orgId}/settlements`, settlementId), {
        status: "reconciled",
        reconciledBy: user.uid,
        reconciledAt: Timestamp.now(),
      });
      loadSettlements();
    } catch (error) {
      console.error("Error reconciling settlement:", error);
      alert("Failed to reconcile settlement");
    }
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
            You don't have permission to view settlements.
          </p>
        </div>
      </div>
    );
  }

  const filteredSettlements = settlements.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
    return true;
  });

  const pendingCount = settlements.filter((s) => s.status === "pending").length;
  const reconciledCount = settlements.filter((s) => s.status === "reconciled").length;
  const discrepancyCount = settlements.filter((s) => s.status === "discrepancy").length;

  const totalPending = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.netAmount, 0);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settlements</h1>
          <p className="text-muted-foreground">
            Track and reconcile payment processor settlements
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending"
            value={pendingCount}
            amount={formatCurrency(totalPending)}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Reconciled"
            value={reconciledCount}
            amount="This month"
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Discrepancies"
            value={discrepancyCount}
            amount="Needs review"
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="Total Settlements"
            value={settlements.length}
            amount="All time"
            icon={DollarSign}
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reconciled">Reconciled</option>
              <option value="discrepancy">Discrepancy</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Sources</option>
              <option value="stripe">Stripe</option>
              <option value="zeffy">Zeffy</option>
            </select>

            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredSettlements.length} of {settlements.length} settlements
            </div>
          </div>
        </div>

        {/* Settlements List */}
        <div className="bg-white rounded-lg shadow">
          {filteredSettlements.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No settlements found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== "all" || sourceFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Settlements will appear here as they are created"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSettlements.map((settlement) => (
                <SettlementRow
                  key={settlement.id}
                  settlement={settlement}
                  onReconcile={handleReconcile}
                  canReconcile={hasScope("finance.write")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component: Stat Card
function StatCard({
  title,
  value,
  amount,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  amount: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
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
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{amount}</div>
    </div>
  );
}

// Component: Settlement Row
function SettlementRow({
  settlement,
  onReconcile,
  canReconcile,
}: {
  settlement: Settlement;
  onReconcile: (id: string) => void;
  canReconcile: boolean;
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    reconciled: "bg-green-100 text-green-700",
    discrepancy: "bg-red-100 text-red-700",
  };

  const sourceColors = {
    stripe: "bg-purple-100 text-purple-700",
    zeffy: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-6 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded ${
                sourceColors[settlement.source]
              }`}
            >
              {settlement.source.toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded ${
                statusColors[settlement.status]
              }`}
            >
              {settlement.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Period</p>
              <p className="font-medium">
                {settlement.periodStart?.toDate
                  ? new Date(settlement.periodStart.toDate()).toLocaleDateString()
                  : "N/A"}{" "}
                -{" "}
                {settlement.periodEnd?.toDate
                  ? new Date(settlement.periodEnd.toDate()).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Gross Amount</p>
              <p className="font-medium">{formatCurrency(settlement.totalAmount)}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Fees</p>
              <p className="font-medium text-red-600">
                -{formatCurrency(settlement.feeAmount)}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Net Amount</p>
              <p className="font-bold text-primary text-lg">
                {formatCurrency(settlement.netAmount)}
              </p>
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            {settlement.transactionCount} transactions
            {settlement.reconciledAt && (
              <span className="ml-4">
                Reconciled on{" "}
                {new Date(settlement.reconciledAt.toDate()).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/portal/finance/settlements/${settlement.id}`}
            className="px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
          {settlement.status === "pending" && canReconcile && (
            <button
              onClick={() => onReconcile(settlement.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Reconcile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
