"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  queryAuditLogs,
  AuditLogEntry,
  AuditAction,
  AuditCategory,
} from "@/lib/audit";
import {
  Search,
  Filter,
  Download,
  Eye,
  User,
  Shield,
  FileText,
  Settings,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function AuditLogPage() {
  const { user, claims } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | "all">("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    if (claims?.orgId) {
      loadAuditLogs();
    }
  }, [claims?.orgId, categoryFilter]);

  const loadAuditLogs = async () => {
    if (!claims?.orgId) return;

    try {
      setLoading(true);
      const auditLogs = await queryAuditLogs({
        orgId: claims.orgId,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        limit: 100,
      });
      setLogs(auditLogs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.actorEmail.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query)
    );
  });

  const getCategoryIcon = (category: AuditCategory) => {
    switch (category) {
      case "user":
        return <User className="h-4 w-4" />;
      case "role":
        return <Shield className="h-4 w-4" />;
      case "form":
        return <FileText className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: AuditCategory) => {
    switch (category) {
      case "user":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "role":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "form":
        return "bg-green-100 text-green-700 border-green-200";
      case "system":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getActionLabel = (action: AuditAction) => {
    return action
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Track all system activities and user actions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by user, action, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          <option value="user">User</option>
          <option value="role">Role</option>
          <option value="form">Form</option>
          <option value="system">System</option>
        </select>

        {/* Export Button */}
        <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg flex items-center gap-2 transition-colors">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Events"
          value={logs.length.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="User Actions"
          value={logs.filter((l) => l.category === "user").length.toString()}
          icon={<User className="h-4 w-4" />}
        />
        <StatCard
          title="Form Actions"
          value={logs.filter((l) => l.category === "form").length.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="Errors"
          value={logs.filter((l) => !l.success).length.toString()}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log, index) => (
                  <tr
                    key={index}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">{log.actorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.actorEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getActionLabel(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                          log.category
                        )}`}
                      >
                        {getCategoryIcon(log.category)}
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                          <XCircle className="h-4 w-4" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Log Detail Modal
function LogDetailModal({
  log,
  onClose,
}: {
  log: AuditLogEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold">Audit Log Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Actor Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Actor
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{log.actorName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{log.actorEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{log.actorId}</p>
                </div>
                {log.actorRole && (
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium">{log.actorRole}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Action
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="font-medium">{log.action}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{log.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resource</p>
                  <p className="font-mono text-sm">{log.resource}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resource Type</p>
                  <p className="font-medium">{log.resourceType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Details
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Changes */}
          {log.changes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Changes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {log.changes.before && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Before</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(log.changes.before, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {log.changes.after && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">After</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(log.changes.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Status
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                {log.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">Success</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-600">Failed</span>
                  </>
                )}
              </div>
              {log.errorMessage && (
                <p className="mt-2 text-sm text-red-600">{log.errorMessage}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
