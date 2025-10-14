"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Target,
  Plus,
  Filter,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: "annual" | "event" | "emergency" | "capital" | "program";
  status: "planning" | "active" | "paused" | "completed" | "cancelled";
  goal: number;
  raised: number;
  startDate: any;
  endDate?: any;
  assignedFundraisers: string[];
  donorCount: number;
}

export default function CampaignsPage() {
  const { user, claims, hasScope } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadCampaigns();
  }, [user]);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, statusFilter, typeFilter]);

  const loadCampaigns = async () => {
    try {
      const orgId = claims.orgId;

      const campaignsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/campaigns`),
          orderBy("createdAt", "desc")
        )
      );

      const campaignsList = campaignsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];

      setCampaigns(campaignsList);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    setFilteredCampaigns(filtered);
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
            You don't have permission to view campaigns.
          </p>
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalGoal = campaigns.reduce((sum, c) => sum + c.goal, 0);
  const avgProgress = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
            <p className="text-muted-foreground">
              Manage and track all fundraising campaigns
            </p>
          </div>
          {hasScope("campaign.write") && (
            <Link
              href="/portal/manager/campaigns/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Campaign
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Campaigns"
            value={activeCampaigns.length.toString()}
            icon={Target}
            color="blue"
          />
          <StatCard
            title="Total Raised"
            value={formatCurrency(totalRaised)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Goal"
            value={formatCurrency(totalGoal)}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Avg Progress"
            value={`${avgProgress.toFixed(1)}%`}
            icon={Target}
            color="orange"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="annual">Annual</option>
              <option value="event">Event</option>
              <option value="emergency">Emergency</option>
              <option value="capital">Capital</option>
              <option value="program">Program</option>
            </select>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
            </p>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first campaign to get started"}
              </p>
              {hasScope("campaign.write") && (
                <Link
                  href="/portal/manager/campaigns/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Create Campaign
                </Link>
              )}
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))
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

// Component: Campaign Card
function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = (campaign.raised / campaign.goal) * 100;

  const statusColors = {
    planning: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const typeColors = {
    annual: "bg-purple-100 text-purple-700",
    event: "bg-blue-100 text-blue-700",
    emergency: "bg-red-100 text-red-700",
    capital: "bg-green-100 text-green-700",
    program: "bg-orange-100 text-orange-700",
  };

  return (
    <Link
      href={`/portal/manager/campaigns/${campaign.id}`}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{campaign.name}</h3>
            <div className="flex gap-2 mb-3">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  typeColors[campaign.type]
                }`}
              >
                {campaign.type}
              </span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  statusColors[campaign.status]
                }`}
              >
                {campaign.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold">{progress.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Raised</p>
            <p className="font-bold text-primary">
              {formatCurrency(campaign.raised)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Goal</p>
            <p className="font-bold">{formatCurrency(campaign.goal)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {campaign.assignedFundraisers?.length || 0} fundraisers
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {campaign.donorCount || 0} donors
          </span>
        </div>
      </div>
    </Link>
  );
}
