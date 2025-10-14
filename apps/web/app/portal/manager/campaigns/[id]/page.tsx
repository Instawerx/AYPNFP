"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Edit,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface CampaignDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  goal: number;
  raised: number;
  startDate: any;
  endDate?: any;
  assignedFundraisers: string[];
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  metrics: {
    donorCount: number;
    avgGift: number;
    conversionRate: number;
  };
}

interface Donation {
  id: string;
  amount: number;
  donorName: string;
  createdAt: any;
  fundraiserId?: string;
}

interface Fundraiser {
  id: string;
  name: string;
  raised: number;
  donorCount: number;
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { user, claims, hasScope } = useAuth();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadCampaignDetails();
  }, [user, params.id]);

  const loadCampaignDetails = async () => {
    try {
      const orgId = claims.orgId;

      // Load campaign
      const campaignDoc = await getDoc(doc(db, `orgs/${orgId}/campaigns`, params.id));
      if (campaignDoc.exists()) {
        setCampaign({ id: campaignDoc.id, ...campaignDoc.data() } as CampaignDetail);
      }

      // Load donations for this campaign
      const donationsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/donations`),
          where("campaignId", "==", params.id)
        )
      );

      setDonations(
        donationsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Donation[]
      );

      // Load fundraiser performance
      // In a real implementation, this would aggregate data
      const fundraisersSnap = await getDocs(
        collection(db, `orgs/${orgId}/fundraisers`)
      );

      const fundraisersList = fundraisersSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || `${doc.data().firstName} ${doc.data().lastName}`,
        raised: 0, // Would calculate from donations
        donorCount: 0, // Would calculate from donations
      })) as Fundraiser[];

      setFundraisers(fundraisersList);
    } catch (error) {
      console.error("Error loading campaign details:", error);
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

  if (!campaign) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">Campaign not found</p>
        </div>
      </div>
    );
  }

  const progress = (campaign.raised / campaign.goal) * 100;
  const daysRemaining = campaign.endDate?.toDate
    ? Math.ceil(
        (new Date(campaign.endDate.toDate()).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/portal/manager/campaigns"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{campaign.name}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded capitalize">
                  {campaign.status}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded capitalize">
                  {campaign.type}
                </span>
              </div>
              <p className="text-muted-foreground mb-4">{campaign.description}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Started: {campaign.startDate?.toDate ? new Date(campaign.startDate.toDate()).toLocaleDateString() : "N/A"}
                </span>
                {campaign.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ends: {new Date(campaign.endDate.toDate()).toLocaleDateString()}
                    {daysRemaining !== null && ` (${daysRemaining} days left)`}
                  </span>
                )}
              </div>
            </div>
            {hasScope("campaign.write") && (
              <Link
                href={`/portal/manager/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Campaign Progress</h2>
              <p className="text-white/80">
                {formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)}
              </p>
            </div>
            <Target className="h-12 w-12 opacity-80" />
          </div>
          <div className="bg-white/20 rounded-full h-4 mb-2">
            <div
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-sm text-white/80">{progress.toFixed(1)}% complete</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Raised"
            value={formatCurrency(campaign.raised)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Donors"
            value={campaign.metrics?.donorCount || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Avg Gift"
            value={formatCurrency(campaign.metrics?.avgGift || 0)}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Conversion Rate"
            value={`${((campaign.metrics?.conversionRate || 0) * 100).toFixed(1)}%`}
            icon={BarChart3}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Recent Donations</h2>
            <div className="space-y-3">
              {donations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No donations yet
                </p>
              ) : (
                donations.slice(0, 10).map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{donation.donorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {donation.createdAt?.toDate
                          ? new Date(donation.createdAt.toDate()).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      {formatCurrency(donation.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fundraiser Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Fundraiser Performance</h2>
            <div className="space-y-3">
              {fundraisers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No fundraisers assigned
                </p>
              ) : (
                fundraisers.slice(0, 10).map((fundraiser) => (
                  <div
                    key={fundraiser.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{fundraiser.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {fundraiser.donorCount} donors
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      {formatCurrency(fundraiser.raised)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* UTM Parameters */}
        {campaign.utmParams && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">UTM Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaign.utmParams.source && (
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">{campaign.utmParams.source}</p>
                </div>
              )}
              {campaign.utmParams.medium && (
                <div>
                  <p className="text-sm text-muted-foreground">Medium</p>
                  <p className="font-medium">{campaign.utmParams.medium}</p>
                </div>
              )}
              {campaign.utmParams.campaign && (
                <div>
                  <p className="text-sm text-muted-foreground">Campaign</p>
                  <p className="font-medium">{campaign.utmParams.campaign}</p>
                </div>
              )}
            </div>
          </div>
        )}
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
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
