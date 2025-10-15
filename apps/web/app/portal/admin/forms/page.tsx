"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FileText,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  metadata: {
    useCount: number;
    createdAt: any;
    lastSyncedAt?: any;
  };
}

interface Submission {
  id: string;
  templateId: string;
  status: string;
  submittedAt: any;
}

export default function FormsManagementPage() {
  const { claims, hasScope } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0,
    mostUsedTemplate: "",
    avgSubmissionsPerDay: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [templates, submissions]);

  const loadData = async () => {
    try {
      const orgId = claims.orgId;

      // Load templates
      const templatesSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/formTemplates`),
          orderBy("metadata.createdAt", "desc")
        )
      );
      const templatesList = templatesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Template[];
      setTemplates(templatesList);

      // Load submissions
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
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalTemplates = templates.length;
    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter(
      (s) => s.status === "pending"
    ).length;
    const completedSubmissions = submissions.filter(
      (s) => s.status === "completed"
    ).length;

    // Find most used template
    let mostUsedTemplate = "";
    let maxUseCount = 0;
    templates.forEach((t) => {
      if (t.metadata.useCount > maxUseCount) {
        maxUseCount = t.metadata.useCount;
        mostUsedTemplate = t.name;
      }
    });

    // Calculate avg submissions per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubmissions = submissions.filter((s) => {
      if (!s.submittedAt?.toDate) return false;
      return s.submittedAt.toDate() >= thirtyDaysAgo;
    });
    const avgSubmissionsPerDay = (recentSubmissions.length / 30).toFixed(1);

    setStats({
      totalTemplates,
      totalSubmissions,
      pendingSubmissions,
      completedSubmissions,
      mostUsedTemplate: mostUsedTemplate || "N/A",
      avgSubmissionsPerDay: parseFloat(avgSubmissionsPerDay),
    });
  };

  const handleSyncWithAirSlate = async () => {
    setSyncing(true);
    try {
      const orgId = claims.orgId;
      const response = await fetch(
        `/api/forms/templates?orgId=${orgId}&sync=true`
      );

      if (!response.ok) {
        throw new Error("Failed to sync with airSlate");
      }

      const data = await response.json();
      setTemplates(data.templates);
      alert("Successfully synced with airSlate!");
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Failed to sync with airSlate");
    } finally {
      setSyncing(false);
    }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Forms Management</h1>
                <p className="text-muted-foreground">
                  Manage templates, submissions, and integrations
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSyncWithAirSlate}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync with airSlate"}
              </button>
              <Link
                href="/portal/admin/forms/templates/create"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Template
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Templates"
            value={stats.totalTemplates}
            icon={FileText}
            color="blue"
          />
          <StatCard
            label="Total Submissions"
            value={stats.totalSubmissions}
            icon={Users}
            color="green"
          />
          <StatCard
            label="Pending Review"
            value={stats.pendingSubmissions}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            label="Completed"
            value={stats.completedSubmissions}
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most Used Template */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Most Used Template</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              {stats.mostUsedTemplate}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This template has been used the most
            </p>
          </div>

          {/* Submission Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Avg. Submissions/Day</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats.avgSubmissionsPerDay}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Based on last 30 days
            </p>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Form Templates</h3>
              <Link
                href="/portal/forms/generate"
                className="text-sm text-primary hover:underline"
              >
                Generate Form →
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Template Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Use Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Synced
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {templates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No templates found. Sync with airSlate to get started.
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr
                      key={template.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-muted text-xs rounded">
                          {template.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">
                          {template.metadata.useCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {template.metadata.lastSyncedAt?.toDate
                          ? new Date(
                              template.metadata.lastSyncedAt.toDate()
                            ).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm text-primary hover:underline">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            title="View Submissions"
            description="Review and manage all form submissions"
            icon={FileText}
            href="/portal/forms/submissions"
            color="blue"
          />
          <QuickActionCard
            title="Generate Form"
            description="Create a new form from a template"
            icon={Plus}
            href="/portal/forms/generate"
            color="green"
          />
          <QuickActionCard
            title="Settings"
            description="Configure airSlate integration"
            icon={Settings}
            href="/portal/admin/forms/settings"
            color="gray"
          />
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className={`p-2 rounded-lg ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Component: Quick Action Card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
          colorClasses[color as keyof typeof colorClasses]
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
