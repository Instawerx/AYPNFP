"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  Clock,
  User,
  X,
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueAt: any;
  donorId?: string;
  donorName?: string;
  assignedTo: string;
  createdAt: any;
}

export default function TasksPage() {
  const { user, claims, hasScope } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadTasks();
  }, [user]);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter]);

  const loadTasks = async () => {
    try {
      const orgId = claims.orgId;

      const tasksSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/tasks`),
          where("assignedTo", "==", user.uid),
          orderBy("dueAt", "asc")
        )
      );

      const tasksList = tasksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];

      setTasks(tasksList);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.dueAt?.toDate &&
      new Date(t.dueAt.toDate()) < new Date()
  ).length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
            <p className="text-muted-foreground">
              Manage your tasks and track progress
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Pending" value={pendingTasks} color="yellow" />
          <StatCard title="In Progress" value={inProgressTasks} color="blue" />
          <StatCard title="Completed" value={completedTasks} color="green" />
          <StatCard title="Overdue" value={overdueTasks} color="red" />
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
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Task
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>

        {/* Create Task Modal */}
        {showCreateModal && (
          <CreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadTasks();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Component: Stat Card
function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <CheckSquare className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Component: Task Card
function TaskCard({ task }: { task: Task }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const isOverdue =
    task.status !== "completed" &&
    task.dueAt?.toDate &&
    new Date(task.dueAt.toDate()) < new Date();

  return (
    <Link
      href={`/portal/fundraiser/tasks/${task.id}`}
      className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
          {task.description && (
            <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded ${statusColors[task.status]}`}>
            {task.status.replace("-", " ")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Due: {task.dueAt?.toDate ? new Date(task.dueAt.toDate()).toLocaleDateString() : "N/A"}
          {isOverdue && <span className="text-red-600 font-semibold ml-1">(Overdue)</span>}
        </span>
        {task.donorName && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {task.donorName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Created {task.createdAt?.toDate ? new Date(task.createdAt.toDate()).toLocaleDateString() : "N/A"}
        </span>
      </div>
    </Link>
  );
}

// Component: Create Task Modal
function CreateTaskModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user, claims } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueAt: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orgId = claims.orgId;

      await addDoc(collection(db, `orgs/${orgId}/tasks`), {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: "pending",
        dueAt: Timestamp.fromDate(new Date(formData.dueAt)),
        assignedTo: user.uid,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Follow up with donor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Task details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dueAt}
              onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              {submitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
