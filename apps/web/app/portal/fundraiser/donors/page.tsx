"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalDonated: number;
  lastDonation?: any;
  donationCount: number;
  status: "active" | "lapsed" | "new";
  lastContact?: any;
  assignedTo?: string;
}

export default function DonorsListPage() {
  const { user, claims, hasScope } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("lastDonation");

  useEffect(() => {
    if (!user || !hasScope("donor.read")) {
      setLoading(false);
      return;
    }
    loadDonors();
  }, [user]);

  useEffect(() => {
    filterAndSortDonors();
  }, [donors, searchTerm, statusFilter, sortBy]);

  const loadDonors = async () => {
    try {
      const orgId = claims.orgId;
      const fundraiserId = claims.fundraiserId || user.uid;

      // Load donors assigned to this fundraiser
      const donorsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/donors`),
          where("assignedTo", "==", fundraiserId)
        )
      );

      const donorsList = donorsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Donor[];

      setDonors(donorsList);
    } catch (error) {
      console.error("Error loading donors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDonors = () => {
    let filtered = [...donors];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (donor) =>
          donor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((donor) => donor.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.lastName.localeCompare(b.lastName);
        case "totalDonated":
          return b.totalDonated - a.totalDonated;
        case "lastDonation":
          return (b.lastDonation?.toMillis() || 0) - (a.lastDonation?.toMillis() || 0);
        case "donationCount":
          return b.donationCount - a.donationCount;
        default:
          return 0;
      }
    });

    setFilteredDonors(filtered);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Total Donated", "Donation Count", "Status"];
    const rows = filteredDonors.map((donor) => [
      `${donor.firstName} ${donor.lastName}`,
      donor.email,
      donor.phone || "",
      donor.totalDonated,
      donor.donationCount,
      donor.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("donor.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to view donors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Donors</h1>
          <p className="text-muted-foreground">
            Manage your assigned donors and track engagement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Donors"
            value={donors.length}
            icon={User}
            color="blue"
          />
          <StatCard
            title="Active Donors"
            value={donors.filter((d) => d.status === "active").length}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Total Raised"
            value={formatCurrency(
              donors.reduce((sum, d) => sum + d.totalDonated, 0)
            )}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Avg Gift"
            value={formatCurrency(
              donors.length > 0
                ? donors.reduce((sum, d) => sum + d.totalDonated, 0) / donors.length
                : 0
            )}
            icon={DollarSign}
            color="orange"
          />
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search donors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="lapsed">Lapsed</option>
                <option value="new">New</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="lastDonation">Last Donation</option>
                <option value="name">Name</option>
                <option value="totalDonated">Total Donated</option>
                <option value="donationCount">Donation Count</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDonors.length} of {donors.length} donors
            </p>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Donors List */}
        <div className="bg-white rounded-lg shadow">
          {filteredDonors.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No donors found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You don't have any assigned donors yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDonors.map((donor) => (
                <DonorRow key={donor.id} donor={donor} />
              ))}
            </div>
          )}
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

// Component: Donor Row
function DonorRow({ donor }: { donor: Donor }) {
  const statusColors = {
    active: "bg-green-100 text-green-700",
    lapsed: "bg-yellow-100 text-yellow-700",
    new: "bg-blue-100 text-blue-700",
  };

  return (
    <Link
      href={`/portal/fundraiser/donors/${donor.id}`}
      className="block p-6 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {donor.firstName[0]}
                {donor.lastName[0]}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {donor.firstName} {donor.lastName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {donor.email}
                </span>
                {donor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {donor.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Donated</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(donor.totalDonated)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Donations</p>
            <p className="text-lg font-bold">{donor.donationCount}</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last Donation</p>
            <p className="text-sm font-medium">
              {donor.lastDonation?.toDate
                ? new Date(donor.lastDonation.toDate()).toLocaleDateString()
                : "Never"}
            </p>
          </div>

          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              statusColors[donor.status]
            }`}
          >
            {donor.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
