"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Bell,
  CheckSquare,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface DonorDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  totalDonated: number;
  donationCount: number;
  status: string;
  lastDonation?: any;
  firstDonation?: any;
  consents: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

interface Donation {
  id: string;
  amount: number;
  date: any;
  method: string;
  campaign?: string;
  recurring: boolean;
}

interface Task {
  id: string;
  title: string;
  dueAt: any;
  status: string;
  priority: string;
}

interface Note {
  id: string;
  content: string;
  createdAt: any;
  createdBy: string;
}

export default function DonorDetailPage({ params }: { params: { id: string } }) {
  const { user, claims, hasScope } = useAuth();
  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"donations" | "tasks" | "notes">("donations");

  useEffect(() => {
    if (!user || !hasScope("donor.read")) {
      setLoading(false);
      return;
    }
    loadDonorDetails();
  }, [user, params.id]);

  const loadDonorDetails = async () => {
    try {
      const orgId = claims.orgId;

      // Load donor
      const donorDoc = await getDoc(doc(db, `orgs/${orgId}/donors`, params.id));
      if (donorDoc.exists()) {
        setDonor({ id: donorDoc.id, ...donorDoc.data() } as DonorDetail);
      }

      // Load donations
      const donationsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/donations`),
          where("donorId", "==", params.id),
          orderBy("createdAt", "desc")
        )
      );
      setDonations(
        donationsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Donation[]
      );

      // Load tasks
      const tasksSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/tasks`),
          where("donorId", "==", params.id),
          orderBy("dueAt", "asc")
        )
      );
      setTasks(tasksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Task[]);

      // Load notes
      const notesSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/donorNotes`),
          where("donorId", "==", params.id),
          orderBy("createdAt", "desc")
        )
      );
      setNotes(notesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Note[]);
    } catch (error) {
      console.error("Error loading donor details:", error);
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

  if (!donor) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">Donor not found</p>
        </div>
      </div>
    );
  }

  const canSendNotification =
    donor.consents.email || donor.consents.sms || donor.consents.push;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/portal/fundraiser/donors"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Donors
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {donor.firstName[0]}
                  {donor.lastName[0]}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {donor.firstName} {donor.lastName}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {donor.email}
                  </span>
                  {donor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {donor.phone}
                    </span>
                  )}
                  {donor.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {donor.address.city}, {donor.address.state}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!canSendNotification}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Bell className="h-4 w-4" />
                Send Notification
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">
                <CheckSquare className="h-4 w-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Donated"
            value={formatCurrency(donor.totalDonated)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Donations"
            value={donor.donationCount}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Avg Gift"
            value={formatCurrency(
              donor.donationCount > 0 ? donor.totalDonated / donor.donationCount : 0
            )}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Status"
            value={donor.status}
            icon={CheckSquare}
            color="orange"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab("donations")}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === "donations"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                Donations ({donations.length})
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === "tasks"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === "notes"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                Notes ({notes.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "donations" && (
              <DonationsTab donations={donations} />
            )}
            {activeTab === "tasks" && <TasksTab tasks={tasks} />}
            {activeTab === "notes" && <NotesTab notes={notes} />}
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
  value: string | number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
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
      <div className="text-2xl font-bold capitalize">{value}</div>
    </div>
  );
}

// Component: Donations Tab
function DonationsTab({ donations }: { donations: Donation[] }) {
  if (donations.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No donations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donations.map((donation) => (
        <div
          key={donation.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {formatCurrency(donation.amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                {donation.date?.toDate
                  ? new Date(donation.date.toDate()).toLocaleDateString()
                  : "N/A"}{" "}
                • {donation.method}
                {donation.recurring && " • Recurring"}
              </p>
            </div>
          </div>
          {donation.campaign && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
              {donation.campaign}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Component: Tasks Tab
function TasksTab({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No tasks yet</p>
      </div>
    );
  }

  const priorityColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">
                Due: {task.dueAt?.toDate ? new Date(task.dueAt.toDate()).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                priorityColors[task.priority as keyof typeof priorityColors]
              }`}
            >
              {task.priority}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              {task.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component: Notes Tab
function NotesTab({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id} className="p-4 border rounded-lg">
          <p className="mb-2">{note.content}</p>
          <p className="text-sm text-muted-foreground">
            {note.createdAt?.toDate
              ? new Date(note.createdAt.toDate()).toLocaleDateString()
              : "N/A"}{" "}
            by {note.createdBy}
          </p>
        </div>
      ))}
    </div>
  );
}
