"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Target,
  Users,
  CheckSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface FundraiserStats {
  raised: number;
  goal: number;
  donorCount: number;
  tasksPending: number;
  pledgesPending: number;
  conversionRate: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  dueAt: any;
  priority: string;
  donorName?: string;
}

export default function FundraiserDashboard() {
  const { user, claims, hasScope } = useAuth();
  const [stats, setStats] = useState<FundraiserStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const orgId = claims.orgId;
      const fundraiserId = claims.fundraiserId || user.uid;

      // Load fundraiser profile
      const fundraiserSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/fundraisers`),
          where("userId", "==", user.uid),
          limit(1)
        )
      );

      let fundraiserData = null;
      if (!fundraiserSnap.empty) {
        fundraiserData = fundraiserSnap.docs[0].data();
      }

      // Load tasks
      const tasksSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/tasks`),
          where("assignedTo", "==", user.uid),
          where("status", "in", ["pending", "in-progress"]),
          orderBy("dueAt", "asc"),
          limit(5)
        )
      );

      const tasks = tasksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UpcomingTask[];

      setUpcomingTasks(tasks);

      // Load pledges
      const pledgesSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/pledges`),
          where("fundraiserId", "==", fundraiserId),
          where("status", "==", "pending")
        )
      );

      // Calculate stats
      setStats({
        raised: fundraiserData?.stats?.raised || 0,
        goal: fundraiserData?.goals?.monthly || 10000,
        donorCount: fundraiserData?.assignedDonors?.length || 0,
        tasksPending: tasksSnap.size,
        pledgesPending: pledgesSnap.size,
        conversionRate: fundraiserData?.stats?.conversionRate || 0,
      });
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

  if (!hasScope("campaign.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to access the fundraiser portal.
          </p>
        </div>
      </div>
    );
  }

  const progressPercentage = stats
    ? Math.min((stats.raised / stats.goal) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fundraiser Dashboard</h1>
          <p className="text-muted-foreground">
            Track your goals, manage donors, and complete tasks
          </p>
        </div>

        {/* Goal Progress */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Monthly Goal</h2>
              <p className="text-white/80">
                {formatCurrency(stats?.raised || 0)} of{" "}
                {formatCurrency(stats?.goal || 0)}
              </p>
            </div>
            <Target className="h-12 w-12 opacity-80" />
          </div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-4 mb-2">
            <div
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-white/80">
            {progressPercentage.toFixed(1)}% complete
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Assigned Donors"
            value={stats?.donorCount || 0}
            icon={Users}
            color="blue"
            link="/portal/fundraiser/donors"
          />
          <StatCard
            title="Pending Tasks"
            value={stats?.tasksPending || 0}
            icon={CheckSquare}
            color="orange"
            link="/portal/fundraiser/tasks"
          />
          <StatCard
            title="Pending Pledges"
            value={stats?.pledgesPending || 0}
            icon={DollarSign}
            color="green"
            link="/portal/fundraiser/pledges"
          />
          <StatCard
            title="Conversion Rate"
            value={`${((stats?.conversionRate || 0) * 100).toFixed(1)}%`}
            icon={TrendingUp}
            color="purple"
            link="/portal/fundraiser/goals"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Upcoming Tasks
              </h2>
              <Link
                href="/portal/fundraiser/tasks"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming tasks
                </p>
              ) : (
                upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </div>

            <Link
              href="/portal/fundraiser/tasks/create"
              className="block mt-4 text-center py-2 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium"
            >
              + Create New Task
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton
                href="/portal/fundraiser/donors"
                icon={Users}
                label="View Donors"
              />
              <QuickActionButton
                href="/portal/fundraiser/tasks/create"
                icon={CheckSquare}
                label="Create Task"
              />
              <QuickActionButton
                href="/portal/fundraiser/pledges"
                icon={DollarSign}
                label="Manage Pledges"
              />
              <QuickActionButton
                href="/portal/fundraiser/leaderboard"
                icon={Award}
                label="Leaderboard"
              />
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
  icon: Icon,
  color,
  link,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  link: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Link href={link} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </Link>
  );
}

// Component: Task Item
function TaskItem({ task }: { task: UpcomingTask }) {
  const priorityColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <Link
      href={`/portal/fundraiser/tasks/${task.id}`}
      className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
    >
      <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              priorityColors[task.priority as keyof typeof priorityColors]
            }`}
          >
            {task.priority}
          </span>
          <span className="text-xs text-muted-foreground">
            Due: {task.dueAt?.toDate ? new Date(task.dueAt.toDate()).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
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
