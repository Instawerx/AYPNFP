"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface TimeOffRequest {
  id: string;
  type: "vacation" | "sick" | "personal" | "unpaid";
  startDate: any;
  endDate: any;
  days: number;
  reason?: string;
  status: "pending" | "approved" | "denied";
  requestedAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
  notes?: string;
}

export default function TimeOffPage() {
  const { user, claims } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [balance, setBalance] = useState({ vacation: 15, sick: 10, personal: 3 });
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTimeOff();
  }, [user]);

  const loadTimeOff = async () => {
    try {
      const orgId = claims.orgId;

      const requestsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/timeOffRequests`),
          where("employeeId", "==", user.uid)
        )
      );

      const requestsList = requestsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimeOffRequest[];

      setRequests(requestsList);
    } catch (error) {
      console.error("Error loading time off:", error);
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

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const deniedRequests = requests.filter((r) => r.status === "denied");

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Time Off</h1>
            <p className="text-muted-foreground">
              Request time off and view your balance
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Request Time Off
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <BalanceCard
            title="Vacation Days"
            available={balance.vacation}
            used={5}
            total={20}
            color="blue"
          />
          <BalanceCard
            title="Sick Days"
            available={balance.sick}
            used={2}
            total={12}
            color="green"
          />
          <BalanceCard
            title="Personal Days"
            available={balance.personal}
            used={0}
            total={3}
            color="purple"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Pending Requests"
            value={pendingRequests.length}
            icon={AlertCircle}
            color="yellow"
          />
          <StatCard
            title="Approved Requests"
            value={approvedRequests.length}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Requests"
            value={requests.length}
            icon={Calendar}
            color="blue"
          />
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Request History</h2>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first time-off request to get started
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Request Time Off
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </div>
          )}
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <RequestModal
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => {
              setShowRequestModal(false);
              loadTimeOff();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Component: Balance Card
function BalanceCard({
  title,
  available,
  used,
  total,
  color,
}: {
  title: string;
  available: number;
  used: number;
  total: number;
  color: string;
}) {
  const percentage = (available / total) * 100;
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-bold">{available}</span>
        <span className="text-muted-foreground">of {total} days</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{used} days used</p>
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
  value: number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
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
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Component: Request Row
function RequestRow({ request }: { request: TimeOffRequest }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    denied: "bg-red-100 text-red-700",
  };

  const statusIcons = {
    pending: AlertCircle,
    approved: CheckCircle,
    denied: XCircle,
  };

  const Icon = statusIcons[request.status];

  return (
    <div className="p-6 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded capitalize">
              {request.type}
            </span>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1 ${
                statusColors[request.status]
              }`}
            >
              <Icon className="h-4 w-4" />
              {request.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {request.startDate?.toDate
                  ? new Date(request.startDate.toDate()).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">End Date</p>
              <p className="font-medium">
                {request.endDate?.toDate
                  ? new Date(request.endDate.toDate()).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{request.days} days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Requested</p>
              <p className="font-medium">
                {request.requestedAt?.toDate
                  ? new Date(request.requestedAt.toDate()).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {request.reason && (
            <p className="text-sm text-muted-foreground mt-2">
              Reason: {request.reason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Component: Request Modal
function RequestModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user, claims } = useAuth();
  const [formData, setFormData] = useState({
    type: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orgId = claims.orgId;

      await addDoc(collection(db, `orgs/${orgId}/timeOffRequests`), {
        employeeId: user.uid,
        type: formData.type,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        days: calculateDays(),
        reason: formData.reason,
        status: "pending",
        requestedAt: Timestamp.now(),
      });

      onSuccess();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Request Time Off</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Day</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Duration: <span className="font-bold">{calculateDays()} days</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief explanation..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
