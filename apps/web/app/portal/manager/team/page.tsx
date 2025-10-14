"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Trophy,
  Medal,
  Crown,
  DollarSign,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  position: string;
  raised: number;
  donorCount: number;
  taskCompletionRate: number;
  conversionRate: number;
  assignedDonors: number;
  activeCampaigns: number;
  rank?: number;
}

export default function TeamPage() {
  const { user, claims, hasScope } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"raised" | "donors" | "conversion">("raised");
  const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year">("month");

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadTeam();
  }, [user, sortBy, timePeriod]);

  const loadTeam = async () => {
    try {
      const orgId = claims.orgId;

      const fundraisersSnap = await getDocs(
        collection(db, `orgs/${orgId}/fundraisers`)
      );

      let membersList = fundraisersSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          name: data.name || `${data.firstName} ${data.lastName}`,
          position: data.position || "Fundraiser",
          raised: data.stats?.raised || 0,
          donorCount: data.assignedDonors?.length || 0,
          taskCompletionRate: data.stats?.taskCompletionRate || 0,
          conversionRate: data.stats?.conversionRate || 0,
          assignedDonors: data.assignedDonors?.length || 0,
          activeCampaigns: data.activeCampaigns?.length || 0,
        };
      }) as TeamMember[];

      // Sort based on selected criteria
      membersList.sort((a, b) => {
        switch (sortBy) {
          case "raised":
            return b.raised - a.raised;
          case "donors":
            return b.donorCount - a.donorCount;
          case "conversion":
            return b.conversionRate - a.conversionRate;
          default:
            return 0;
        }
      });

      // Add ranks
      membersList.forEach((member, index) => {
        member.rank = index + 1;
      });

      setTeamMembers(membersList);
    } catch (error) {
      console.error("Error loading team:", error);
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
            You don't have permission to view team data.
          </p>
        </div>
      </div>
    );
  }

  const topThree = teamMembers.slice(0, 3);
  const restOfTeam = teamMembers.slice(3);
  const totalRaised = teamMembers.reduce((sum, m) => sum + m.raised, 0);
  const avgConversion =
    teamMembers.length > 0
      ? teamMembers.reduce((sum, m) => sum + m.conversionRate, 0) / teamMembers.length
      : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Team Performance
          </h1>
          <p className="text-muted-foreground">
            Track and compare team member performance
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="raised">Amount Raised</option>
                <option value="donors">Donor Count</option>
                <option value="conversion">Conversion Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Team Size"
            value={teamMembers.length.toString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Raised"
            value={formatCurrency(totalRaised)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Avg Conversion"
            value={`${(avgConversion * 100).toFixed(1)}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Top Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((member, index) => (
                <PodiumCard
                  key={member.id}
                  member={member}
                  position={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Full Team List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Full Team Rankings</h2>
          </div>

          <div className="divide-y">
            {restOfTeam.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No additional team members
              </div>
            ) : (
              restOfTeam.map((member) => (
                <TeamMemberRow key={member.id} member={member} />
              ))
            )}
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
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Component: Podium Card
function PodiumCard({
  member,
  position,
}: {
  member: TeamMember;
  position: number;
}) {
  const icons = {
    1: Crown,
    2: Medal,
    3: Trophy,
  };

  const colors = {
    1: "from-yellow-400 to-yellow-600",
    2: "from-gray-300 to-gray-500",
    3: "from-orange-400 to-orange-600",
  };

  const Icon = icons[position as keyof typeof icons];

  return (
    <div
      className={`bg-gradient-to-br ${
        colors[position as keyof typeof colors]
      } rounded-lg shadow-lg p-6 text-white`}
    >
      <div className="text-center">
        <Icon className="h-16 w-16 mx-auto mb-4" />
        <div className="text-4xl font-bold mb-2">#{position}</div>
        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
        <p className="text-sm text-white/80 mb-4">{member.position}</p>
        <p className="text-3xl font-bold mb-4">{formatCurrency(member.raised)}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/80">Donors</p>
            <p className="font-bold">{member.donorCount}</p>
          </div>
          <div>
            <p className="text-white/80">Conv. Rate</p>
            <p className="font-bold">{(member.conversionRate * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Team Member Row
function TeamMemberRow({ member }: { member: TeamMember }) {
  return (
    <Link
      href={`/portal/manager/team/${member.id}`}
      className="p-6 hover:bg-muted/50 transition-colors block"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-lg">
            #{member.rank}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.position}</p>
            <div className="flex gap-6 text-sm text-muted-foreground mt-1">
              <span>{member.assignedDonors} assigned donors</span>
              <span>{member.activeCampaigns} campaigns</span>
              <span>{(member.taskCompletionRate * 100).toFixed(0)}% tasks</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(member.raised)}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            <span>{member.donorCount} donors</span>
            <span>{(member.conversionRate * 100).toFixed(0)}% conv.</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
