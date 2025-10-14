"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckSquare,
  FileText,
  GraduationCap,
  Calendar,
  Users,
  Award,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  startDate: any;
  onboardingProgress: number;
  completedTraining: number;
  totalTraining: number;
  timeOffBalance: number;
}

interface Task {
  id: string;
  title: string;
  dueAt: any;
  status: string;
  priority: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
  uploadedAt: any;
}

export default function EmployeeDashboard() {
  const { user, claims, hasScope } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasScope("hr.read")) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const orgId = claims.orgId;

      // Load employee profile
      const profileDoc = await getDoc(
        doc(db, `orgs/${orgId}/employees`, user.uid)
      );

      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() } as EmployeeProfile);
      }

      // Load tasks
      const tasksSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/employeeTasks`),
          where("assignedTo", "==", user.uid),
          where("status", "!=", "completed")
        )
      );

      setTasks(
        tasksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Task[]
      );

      // Load recent documents
      const docsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/employeeDocuments`),
          where("employeeId", "==", user.uid)
        )
      );

      setRecentDocs(
        docsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .slice(0, 5) as Document[]
      );
    } catch (error) {
      console.error("Error loading dashboard:", error);
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

  if (!hasScope("hr.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to access the employee portal.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Employee profile not found. Please contact HR.
          </p>
        </div>
      </div>
    );
  }

  const daysEmployed = profile.startDate?.toDate
    ? Math.floor(
        (new Date().getTime() - new Date(profile.startDate.toDate()).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {profile.position} • {profile.department}
          </p>
        </div>

        {/* Onboarding Progress (if not complete) */}
        {profile.onboardingProgress < 100 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-blue-900">
                  Complete Your Onboarding
                </h2>
                <p className="text-blue-700">
                  {profile.onboardingProgress}% complete
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="bg-blue-200 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 rounded-full h-3 transition-all"
                style={{ width: `${profile.onboardingProgress}%` }}
              />
            </div>
            <Link
              href="/portal/employee/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Onboarding
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Days with Us"
            value={daysEmployed.toString()}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Training Progress"
            value={`${profile.completedTraining}/${profile.totalTraining}`}
            icon={GraduationCap}
            color="green"
          />
          <StatCard
            title="Time Off Balance"
            value={`${profile.timeOffBalance} days`}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Pending Tasks"
            value={tasks.length.toString()}
            icon={CheckSquare}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-primary" />
                Pending Tasks
              </h2>
              <Link
                href="/portal/employee/tasks"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending tasks
                </p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Recent Documents
              </h2>
              <Link
                href="/portal/employee/documents"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No documents yet
                </p>
              ) : (
                recentDocs.map((doc) => (
                  <DocumentItem key={doc.id} document={doc} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              href="/portal/employee/time-off"
              icon={Calendar}
              label="Request Time Off"
            />
            <QuickActionButton
              href="/portal/employee/training"
              icon={GraduationCap}
              label="View Training"
            />
            <QuickActionButton
              href="/portal/employee/documents"
              icon={FileText}
              label="My Documents"
            />
            <QuickActionButton
              href="/portal/employee/directory"
              icon={Users}
              label="Employee Directory"
            />
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
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
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

// Component: Task Item
function TaskItem({ task }: { task: Task }) {
  const priorityColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <CheckSquare className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">
            Due: {task.dueAt?.toDate ? new Date(task.dueAt.toDate()).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>
      <span
        className={`px-2 py-1 text-xs font-semibold rounded ${
          priorityColors[task.priority as keyof typeof priorityColors]
        }`}
      >
        {task.priority}
      </span>
    </div>
  );
}

// Component: Document Item
function DocumentItem({ document }: { document: Document }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <FileText className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="font-medium">{document.name}</p>
        <p className="text-sm text-muted-foreground">{document.category}</p>
      </div>
      <span className="text-xs text-muted-foreground">
        {document.uploadedAt?.toDate
          ? new Date(document.uploadedAt.toDate()).toLocaleDateString()
          : "N/A"}
      </span>
    </div>
  );
}

// Component: Quick Action Button
function QuickActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
    >
      <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
      <span className="text-sm font-medium text-center">{label}</span>
    </Link>
  );
}
