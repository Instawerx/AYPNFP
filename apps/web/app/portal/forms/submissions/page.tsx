"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
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
}

export default function FormSubmissionsPage() {
  const { claims, hasScope } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, filterStatus, filterCategory, submissions]);

  const loadSubmissions = async () => {
    try {
      const orgId = claims.orgId;
      const submissionsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/formSubmissions`),
          orderBy("submittedAt", "desc")
        )
      );

      const submissionsList = submissionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];

      setSubmissions(submissionsList);
      setFilteredSubmissions(submissionsList);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.submittedBy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.submittedBy.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((sub) => sub.status === filterStatus);
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((sub) => sub.category === filterCategory);
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
      completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        <Icon className="h-3 w-3" />
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Form Submissions</h1>
              <p className="text-muted-foreground">
                View and manage all form submissions
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Search Submissions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by form name or submitter..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Filter by Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                <option value="hr">HR</option>
                <option value="finance">Finance</option>
                <option value="legal">Legal</option>
                <option value="donor">Donor</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Submissions"
            value={submissions.length}
            icon={FileText}
            color="blue"
          />
          <StatCard
            label="Pending"
            value={submissions.filter((s) => s.status === "pending").length}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            label="Approved"
            value={submissions.filter((s) => s.status === "approved").length}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Completed"
            value={submissions.filter((s) => s.status === "completed").length}
            icon={CheckCircle}
            color="blue"
          />
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No submissions found
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{submission.templateName}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-muted text-xs rounded">
                          {submission.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{submission.submittedBy.displayName}</p>
                        <p className="text-sm text-muted-foreground">{submission.submittedBy.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {submission.submittedAt?.toDate
                        ? new Date(submission.submittedAt.toDate()).toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/portal/forms/submissions/${submission.id}`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        {submission.document?.downloadUrl && (
                          <a
                            href={submission.document.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Download document"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </p>
        </div>
      </div>
    </div>
  );
}

// Component: Stat Card
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
