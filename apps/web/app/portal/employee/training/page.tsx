"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  GraduationCap,
  CheckCircle,
  Clock,
  Award,
  PlayCircle,
  FileText,
  Video,
} from "lucide-react";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  type: "video" | "document" | "quiz";
  required: boolean;
  completed: boolean;
  certificateAvailable: boolean;
}

const TRAINING_MODULES: Omit<TrainingModule, "id" | "completed">[] = [
  {
    title: "Welcome to AYPNFP",
    description: "Introduction to our mission, values, and team",
    category: "Onboarding",
    duration: 15,
    type: "video",
    required: true,
    certificateAvailable: false,
  },
  {
    title: "Donor Communication Best Practices",
    description: "Learn how to effectively communicate with donors",
    category: "Fundraising",
    duration: 30,
    type: "video",
    required: true,
    certificateAvailable: true,
  },
  {
    title: "Data Privacy & Security",
    description: "Understanding GDPR, data protection, and security protocols",
    category: "Compliance",
    duration: 20,
    type: "document",
    required: true,
    certificateAvailable: true,
  },
  {
    title: "Grant Writing Fundamentals",
    description: "Master the basics of writing compelling grant proposals",
    category: "Fundraising",
    duration: 45,
    type: "video",
    required: false,
    certificateAvailable: true,
  },
  {
    title: "Social Media for Nonprofits",
    description: "Effective social media strategies for fundraising",
    category: "Marketing",
    duration: 25,
    type: "video",
    required: false,
    certificateAvailable: false,
  },
  {
    title: "Event Planning 101",
    description: "Plan and execute successful fundraising events",
    category: "Events",
    duration: 40,
    type: "document",
    required: false,
    certificateAvailable: true,
  },
  {
    title: "Volunteer Management",
    description: "Recruit, train, and retain volunteers effectively",
    category: "Management",
    duration: 30,
    type: "video",
    required: false,
    certificateAvailable: false,
  },
  {
    title: "Financial Reporting",
    description: "Understanding nonprofit financial statements",
    category: "Finance",
    duration: 35,
    type: "document",
    required: true,
    certificateAvailable: true,
  },
];

export default function TrainingPage() {
  const { user, claims } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    loadTraining();
  }, [user]);

  const loadTraining = async () => {
    try {
      const orgId = claims.orgId;
      const employeeDoc = await getDocs(
        collection(db, `orgs/${orgId}/employees`)
      );

      const employeeData = employeeDoc.docs.find((doc) => doc.data().userId === user.uid);
      const completed = employeeData?.data().completedTraining || [];
      setCompletedModules(completed);

      // Map training modules with completion status
      const modulesWithStatus = TRAINING_MODULES.map((module, index) => ({
        ...module,
        id: `module-${index}`,
        completed: completed.includes(`module-${index}`),
      }));

      setModules(modulesWithStatus);
    } catch (error) {
      console.error("Error loading training:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    try {
      const orgId = claims.orgId;
      const employeeDoc = await getDocs(
        collection(db, `orgs/${orgId}/employees`)
      );

      const employeeData = employeeDoc.docs.find((doc) => doc.data().userId === user.uid);
      if (employeeData) {
        await updateDoc(doc(db, `orgs/${orgId}/employees`, employeeData.id), {
          completedTraining: arrayUnion(moduleId),
        });

        setCompletedModules([...completedModules, moduleId]);
        setModules(
          modules.map((m) => (m.id === moduleId ? { ...m, completed: true } : m))
        );
      }
    } catch (error) {
      console.error("Error completing module:", error);
      alert("Failed to mark module as complete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredModules =
    categoryFilter === "all"
      ? modules
      : modules.filter((m) => m.category === categoryFilter);

  const completedCount = modules.filter((m) => m.completed).length;
  const requiredCount = modules.filter((m) => m.required).length;
  const completedRequired = modules.filter((m) => m.required && m.completed).length;
  const totalDuration = modules.reduce((sum, m) => sum + m.duration, 0);
  const completedDuration = modules
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + m.duration, 0);

  const categories = ["all", ...new Set(modules.map((m) => m.category))];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Training & Development
          </h1>
          <p className="text-muted-foreground">
            Complete training modules to enhance your skills
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Progress</h2>
              <p className="text-white/80">
                {completedCount} of {modules.length} modules completed
              </p>
            </div>
            <GraduationCap className="h-12 w-12 opacity-80" />
          </div>
          <div className="bg-white/20 rounded-full h-4 mb-4">
            <div
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{ width: `${(completedCount / modules.length) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/80">Required Completed</p>
              <p className="text-xl font-bold">
                {completedRequired} / {requiredCount}
              </p>
            </div>
            <div>
              <p className="text-white/80">Time Invested</p>
              <p className="text-xl font-bold">
                {completedDuration} / {totalDuration} min
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="In Progress"
            value={modules.length - completedCount}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Certificates"
            value={modules.filter((m) => m.completed && m.certificateAvailable).length}
            icon={Award}
            color="purple"
          />
          <StatCard
            title="Total Modules"
            value={modules.length}
            icon={GraduationCap}
            color="orange"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by Category:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    categoryFilter === category
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Training Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onComplete={handleCompleteModule}
            />
          ))}
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
  value: number;
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
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Component: Module Card
function ModuleCard({
  module,
  onComplete,
}: {
  module: TrainingModule;
  onComplete: (id: string) => void;
}) {
  const typeIcons = {
    video: Video,
    document: FileText,
    quiz: CheckCircle,
  };

  const TypeIcon = typeIcons[module.type];

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 transition-all ${
        module.completed ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
            module.completed ? "bg-green-100" : "bg-primary/10"
          }`}
        >
          <TypeIcon
            className={`h-6 w-6 ${
              module.completed ? "text-green-600" : "text-primary"
            }`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {module.title}
                {module.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {module.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {module.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {module.duration} min
                </span>
                {module.certificateAvailable && (
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Certificate
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            {module.completed ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                {module.certificateAvailable && (
                  <button className="px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
                    Download Certificate
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Start Module
                </button>
                <button
                  onClick={() => onComplete(module.id)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  Mark Complete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
