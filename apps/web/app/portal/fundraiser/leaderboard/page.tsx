"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Award,
  TrendingUp,
  Users,
  Target,
  Medal,
  Trophy,
  Crown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FundraiserStats {
  id: string;
  userId: string;
  name: string;
  raised: number;
  donorCount: number;
  taskCompletionRate: number;
  conversionRate: number;
  rank?: number;
}

export default function LeaderboardPage() {
  const { user, claims, hasScope } = useAuth();
  const [fundraisers, setFundraisers] = useState<FundraiserStats[]>([]);
  const [currentUser, setCurrentUser] = useState<FundraiserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year">("month");

  useEffect(() => {
    if (!user || !hasScope("campaign.read")) {
      setLoading(false);
      return;
    }
    loadLeaderboard();
  }, [user, timePeriod]);

  const loadLeaderboard = async () => {
    try {
      const orgId = claims.orgId;

      // Load all fundraisers
      const fundraisersSnap = await getDocs(
        collection(db, `orgs/${orgId}/fundraisers`)
      );

      const fundraisersList = fundraisersSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          name: data.name || `${data.firstName} ${data.lastName}`,
          raised: data.stats?.raised || 0,
          donorCount: data.assignedDonors?.length || 0,
          taskCompletionRate: data.stats?.taskCompletionRate || 0,
          conversionRate: data.stats?.conversionRate || 0,
        };
      }) as FundraiserStats[];

      // Sort by raised amount
      fundraisersList.sort((a, b) => b.raised - a.raised);

      // Add ranks
      fundraisersList.forEach((f, index) => {
        f.rank = index + 1;
      });

      setFundraisers(fundraisersList);

      // Find current user
      const current = fundraisersList.find((f) => f.userId === user.uid);
      setCurrentUser(current || null);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
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

  const topThree = fundraisers.slice(0, 3);
  const restOfLeaderboard = fundraisers.slice(3);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Team Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See how you rank against your teammates
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              Time Period:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setTimePeriod("month")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === "month"
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimePeriod("quarter")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === "quarter"
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                This Quarter
              </button>
              <button
                onClick={() => setTimePeriod("year")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timePeriod === "year"
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                This Year
              </button>
            </div>
          </div>
        </div>

        {/* Your Rank */}
        {currentUser && (
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 mb-1">Your Rank</p>
                <div className="flex items-center gap-4">
                  <span className="text-6xl font-bold">#{currentUser.rank}</span>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(currentUser.raised)}</p>
                    <p className="text-white/80">raised this {timePeriod}</p>
                  </div>
                </div>
              </div>
              <Award className="h-24 w-24 opacity-20" />
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topThree.map((fundraiser, index) => (
              <PodiumCard
                key={fundraiser.id}
                fundraiser={fundraiser}
                position={index + 1}
                isCurrentUser={fundraiser.userId === user.uid}
              />
            ))}
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Full Rankings</h2>
          </div>

          <div className="divide-y">
            {restOfLeaderboard.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No additional rankings
              </div>
            ) : (
              restOfLeaderboard.map((fundraiser) => (
                <LeaderboardRow
                  key={fundraiser.id}
                  fundraiser={fundraiser}
                  isCurrentUser={fundraiser.userId === user.uid}
                />
              ))
            )}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Achievement Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AchievementBadge
              icon={Target}
              title="Goal Crusher"
              description="Exceeded monthly goal"
              earned={currentUser && currentUser.raised > 10000}
            />
            <AchievementBadge
              icon={Users}
              title="Donor Champion"
              description="25+ active donors"
              earned={currentUser && currentUser.donorCount >= 25}
            />
            <AchievementBadge
              icon={TrendingUp}
              title="Top Converter"
              description="80%+ conversion rate"
              earned={currentUser && currentUser.conversionRate >= 0.8}
            />
            <AchievementBadge
              icon={Award}
              title="Task Master"
              description="95%+ task completion"
              earned={currentUser && currentUser.taskCompletionRate >= 0.95}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Podium Card
function PodiumCard({
  fundraiser,
  position,
  isCurrentUser,
}: {
  fundraiser: FundraiserStats;
  position: number;
  isCurrentUser: boolean;
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
      className={`relative bg-gradient-to-br ${
        colors[position as keyof typeof colors]
      } rounded-lg shadow-lg p-6 text-white ${
        isCurrentUser ? "ring-4 ring-blue-400" : ""
      }`}
    >
      <div className="text-center">
        <Icon className="h-16 w-16 mx-auto mb-4" />
        <div className="text-4xl font-bold mb-2">#{position}</div>
        <h3 className="text-xl font-bold mb-1">{fundraiser.name}</h3>
        <p className="text-2xl font-bold mb-4">
          {formatCurrency(fundraiser.raised)}
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/80">Donors</p>
            <p className="font-bold">{fundraiser.donorCount}</p>
          </div>
          <div>
            <p className="text-white/80">Conv. Rate</p>
            <p className="font-bold">
              {(fundraiser.conversionRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
      {isCurrentUser && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
          YOU
        </div>
      )}
    </div>
  );
}

// Component: Leaderboard Row
function LeaderboardRow({
  fundraiser,
  isCurrentUser,
}: {
  fundraiser: FundraiserStats;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`p-6 hover:bg-muted/50 transition-colors ${
        isCurrentUser ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-lg">
            #{fundraiser.rank}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {fundraiser.name}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                  YOU
                </span>
              )}
            </h3>
            <div className="flex gap-6 text-sm text-muted-foreground mt-1">
              <span>{fundraiser.donorCount} donors</span>
              <span>
                {(fundraiser.conversionRate * 100).toFixed(0)}% conversion
              </span>
              <span>
                {(fundraiser.taskCompletionRate * 100).toFixed(0)}% tasks
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(fundraiser.raised)}
          </p>
          <p className="text-sm text-muted-foreground">raised</p>
        </div>
      </div>
    </div>
  );
}

// Component: Achievement Badge
function AchievementBadge({
  icon: Icon,
  title,
  description,
  earned,
}: {
  icon: any;
  title: string;
  description: string;
  earned?: boolean;
}) {
  return (
    <div
      className={`p-4 border-2 rounded-lg text-center transition-all ${
        earned
          ? "border-yellow-400 bg-yellow-50"
          : "border-gray-200 bg-gray-50 opacity-50"
      }`}
    >
      <Icon
        className={`h-12 w-12 mx-auto mb-2 ${
          earned ? "text-yellow-600" : "text-gray-400"
        }`}
      />
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
      {earned && (
        <div className="mt-2">
          <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded font-semibold">
            EARNED
          </span>
        </div>
      )}
    </div>
  );
}
