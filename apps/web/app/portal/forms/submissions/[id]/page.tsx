"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

interface Submission {
  id: string;
  templateName: string;
  category: string;
  submittedBy: {
    uid: string;
    email: string;
    displayName: string;
  };
  submittedAt: any;
  status: "pending" | "approved" | "rejected" | "completed";
  fields: Record<string, any>;
  document?: {
    downloadUrl?: string;
  };
  approvals?: {
    approvedBy?: string;
    approvedAt?: any;
    rejectedBy?: string;
    rejectedAt?: any;
    rejectionReason?: string;
    comments?: string;
  };
}

export default function SubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { claims, user, hasScope } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadSubmission();
  }, [params.id]);

  const loadSubmission = async () => {
    try {
      const orgId = claims.orgId;
      const submissionDoc = await getDoc(
        doc(db, `orgs/${orgId}/formSubmissions`, params.id)
      );

      if (!submissionDoc.exists()) {
        alert("Submission not found");
        router.push("/portal/forms/submissions");
        return;
      }

      setSubmission({
        id: submissionDoc.id,
        ...submissionDoc.data(),
      } as Submission);
    } catch (error) {
      console.error("Error loading submission:", error);
      alert("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!submission) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/forms/submissions/${params.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments,
            approvedBy: user?.uid,
            approverName: user?.displayName || user?.email,
            approverEmail: user?.email,
            orgId: claims.orgId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve submission");
      }

      alert("Submission approved successfully!");
      setShowApproveModal(false);
      loadSubmission(); // Reload to show updated status
    } catch (error: any) {
      alert(error.message || "Failed to approve submission");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!submission || !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/forms/submissions/${params.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: rejectionReason,
            comments,
            rejectedBy: user?.uid,
            rejectorName: user?.displayName || user?.email,
            rejectorEmail: user?.email,
            orgId: claims.orgId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject submission");
      }

      alert("Submission rejected successfully!");
      setShowRejectModal(false);
      loadSubmission(); // Reload to show updated status
    } catch (error: any) {
      alert(error.message || "Failed to reject submission");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
      completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}
      >
        <Icon className="h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Submission not found</p>
      </div>
    );
  }

  const canApprove = hasScope("forms.approve") && submission.status === "pending";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{submission.templateName}</h1>
                <p className="text-muted-foreground">
                  Submission ID: {submission.id}
                </p>
              </div>
            </div>
            {getStatusBadge(submission.status)}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted By</p>
                <p className="font-medium">{submission.submittedBy.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {submission.submittedBy.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted On</p>
                <p className="font-medium">
                  {submission.submittedAt?.toDate
                    ? new Date(submission.submittedAt.toDate()).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <span className="inline-block px-2 py-1 bg-muted text-sm rounded">
                  {submission.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Form Data</h2>
          <div className="space-y-4">
            {Object.entries(submission.fields).map(([key, value]) => (
              <div key={key} className="border-b pb-3 last:border-b-0">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <p className="font-medium">
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : value?.toString() || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Document */}
        {submission.document?.downloadUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Generated Document</h2>
            <a
              href={submission.document.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="h-5 w-5 text-primary" />
              <span className="font-medium">Download Document</span>
            </a>
          </div>
        )}

        {/* Approval/Rejection Info */}
        {submission.approvals && (submission.status === "approved" || submission.status === "rejected") && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {submission.status === "approved" ? "Approval" : "Rejection"} Details
            </h2>
            <div className="space-y-3">
              {submission.status === "approved" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved By</p>
                    <p className="font-medium">{submission.approvals.approvedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved On</p>
                    <p className="font-medium">
                      {submission.approvals.approvedAt?.toDate
                        ? new Date(
                            submission.approvals.approvedAt.toDate()
                          ).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </>
              )}
              {submission.status === "rejected" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected By</p>
                    <p className="font-medium">{submission.approvals.rejectedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected On</p>
                    <p className="font-medium">
                      {submission.approvals.rejectedAt?.toDate
                        ? new Date(
                            submission.approvals.rejectedAt.toDate()
                          ).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="font-medium text-destructive">
                      {submission.approvals.rejectionReason}
                    </p>
                  </div>
                </>
              )}
              {submission.approvals.comments && (
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="font-medium">{submission.approvals.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {canApprove && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-5 w-5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Approve Submission</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to approve this submission?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => setShowApproveModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Reject Submission</h3>
              <p className="text-muted-foreground mb-4">
                Please provide a reason for rejecting this submission.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Rejection Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this submission is being rejected..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any additional comments..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? "Rejecting..." : "Reject"}
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
