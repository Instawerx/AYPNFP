"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Pledge {
  id: string;
  donorId: string;
  donorName: string;
  amount: number;
  status: "pending" | "committed" | "converted" | "lost";
  expectedDate?: any;
  notes?: string;
  createdAt: any;
  convertedAt?: any;
  fundraiserId: string;
}

export default function PledgesPage() {
  const { user, claims, hasScope } = useAuth();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadPledges();
  }, [user]);

  const loadPledges = async () => {
    try {
      const orgId = claims.orgId;
      const fundraiserId = claims.fundraiserId || user.uid;

      const pledgesSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/pledges`),
          where("fundraiserId", "==", fundraiserId),
          orderBy("createdAt", "desc")
        )
      );

      const pledgesList = pledgesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pledge[];

      setPledges(pledgesList);
    } catch (error) {
      console.error("Error loading pledges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertPledge = async (pledgeId: string) => {
    if (!confirm("Mark this pledge as converted to a donation?")) return;

    try {
      const orgId = claims.orgId;
      await updateDoc(doc(db, `orgs/${orgId}/pledges`, pledgeId), {
        status: "converted",
        convertedAt: new Date(),
      });
      loadPledges();
    } catch (error) {
      console.error("Error converting pledge:", error);
      alert("Failed to convert pledge");
    }
  };

  const handleMarkLost = async (pledgeId: string) => {
    if (!confirm("Mark this pledge as lost?")) return;

    try {
      const orgId = claims.orgId;
      await updateDoc(doc(db, `orgs/${orgId}/pledges`, pledgeId), {
        status: "lost",
      });
      loadPledges();
    } catch (error) {
      console.error("Error marking pledge as lost:", error);
      alert("Failed to update pledge");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredPledges =
    statusFilter === "all"
      ? pledges
      : pledges.filter((p) => p.status === statusFilter);

  const pendingPledges = pledges.filter((p) => p.status === "pending");
  const committedPledges = pledges.filter((p) => p.status === "committed");
  const convertedPledges = pledges.filter((p) => p.status === "converted");
  const lostPledges = pledges.filter((p) => p.status === "lost");

  const totalPending = pendingPledges.reduce((sum, p) => sum + p.amount, 0);
  const totalCommitted = committedPledges.reduce((sum, p) => sum + p.amount, 0);
  const totalConverted = convertedPledges.reduce((sum, p) => sum + p.amount, 0);

  const conversionRate =
    pledges.length > 0
      ? (convertedPledges.length / pledges.length) * 100
      : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pledge Pipeline</h1>
          <p className="text-muted-foreground">
            Track and convert pledges to donations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending"
            value={formatCurrency(totalPending)}
            count={pendingPledges.length}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Committed"
            value={formatCurrency(totalCommitted)}
            count={committedPledges.length}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Converted"
            value={formatCurrency(totalConverted)}
            count={convertedPledges.length}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate.toFixed(1)}%`}
            count={lostPledges.length}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Pipeline View */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Pipeline</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="committed">Committed</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {filteredPledges.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pledges found</h3>
                <p className="text-muted-foreground">
                  {statusFilter !== "all"
                    ? "Try adjusting your filter"
                    : "Start tracking pledges from your donors"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Pending Column */}
                <PledgeColumn
                  title="Pending"
                  pledges={filteredPledges.filter((p) => p.status === "pending")}
                  color="yellow"
                  onConvert={handleConvertPledge}
                  onMarkLost={handleMarkLost}
                />

                {/* Committed Column */}
                <PledgeColumn
                  title="Committed"
                  pledges={filteredPledges.filter((p) => p.status === "committed")}
                  color="blue"
                  onConvert={handleConvertPledge}
                  onMarkLost={handleMarkLost}
                />

                {/* Converted Column */}
                <PledgeColumn
                  title="Converted"
                  pledges={filteredPledges.filter((p) => p.status === "converted")}
                  color="green"
                />

                {/* Lost Column */}
                <PledgeColumn
                  title="Lost"
                  pledges={filteredPledges.filter((p) => p.status === "lost")}
                  color="red"
                />
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Pipeline Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Pipeline Value</p>
              <p className="text-3xl font-bold">
                {formatCurrency(totalPending + totalCommitted)}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Average Pledge</p>
              <p className="text-3xl font-bold">
                {formatCurrency(
                  pledges.length > 0
                    ? pledges.reduce((sum, p) => sum + p.amount, 0) / pledges.length
                    : 0
                )}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Success Rate</p>
              <p className="text-3xl font-bold">{conversionRate.toFixed(1)}%</p>
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
  count,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  count: number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
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
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{count} pledges</div>
    </div>
  );
}

// Component: Pledge Column
function PledgeColumn({
  title,
  pledges,
  color,
  onConvert,
  onMarkLost,
}: {
  title: string;
  pledges: Pledge[];
  color: string;
  onConvert?: (id: string) => void;
  onMarkLost?: (id: string) => void;
}) {
  const colorClasses = {
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <div>
      <div className="mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase">
          {title} ({pledges.length})
        </h3>
      </div>
      <div className="space-y-3">
        {pledges.map((pledge) => (
          <div
            key={pledge.id}
            className={`p-4 border-2 rounded-lg ${
              colorClasses[color as keyof typeof colorClasses]
            }`}
          >
            <div className="mb-3">
              <p className="font-bold text-lg">{formatCurrency(pledge.amount)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {pledge.donorName}
              </p>
            </div>

            {pledge.expectedDate && (
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expected:{" "}
                {new Date(pledge.expectedDate.toDate()).toLocaleDateString()}
              </p>
            )}

            {pledge.notes && (
              <p className="text-xs text-muted-foreground mb-3">{pledge.notes}</p>
            )}

            {(onConvert || onMarkLost) && (
              <div className="flex gap-2">
                {onConvert && (
                  <button
                    onClick={() => onConvert(pledge.id)}
                    className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    Convert
                  </button>
                )}
                {onMarkLost && (
                  <button
                    onClick={() => onMarkLost(pledge.id)}
                    className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Lost
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
