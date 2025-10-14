"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CheckCircle,
  Circle,
  FileText,
  Upload,
  User,
  CreditCard,
  Shield,
  Book,
} from "lucide-react";

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  required: boolean;
  icon: any;
}

export default function OnboardingPage() {
  const { user, claims } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadOnboarding();
  }, [user]);

  const loadOnboarding = async () => {
    try {
      const orgId = claims.orgId;
      const employeeDoc = await getDoc(doc(db, `orgs/${orgId}/employees`, user.uid));

      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        setCompletedTasks(data.completedOnboardingTasks || []);
      }

      // Define onboarding tasks
      const onboardingTasks: OnboardingTask[] = [
        {
          id: "profile",
          title: "Complete Your Profile",
          description: "Add your personal information and emergency contacts",
          category: "Personal Info",
          completed: false,
          required: true,
          icon: User,
        },
        {
          id: "tax-forms",
          title: "Submit Tax Forms",
          description: "Complete W-4 and state tax withholding forms",
          category: "Tax & Payroll",
          completed: false,
          required: true,
          icon: FileText,
        },
        {
          id: "direct-deposit",
          title: "Set Up Direct Deposit",
          description: "Provide bank account information for payroll",
          category: "Tax & Payroll",
          completed: false,
          required: true,
          icon: CreditCard,
        },
        {
          id: "i9",
          title: "Complete I-9 Verification",
          description: "Provide employment eligibility documents",
          category: "Compliance",
          completed: false,
          required: true,
          icon: Shield,
        },
        {
          id: "handbook",
          title: "Read Employee Handbook",
          description: "Review policies, procedures, and expectations",
          category: "Training",
          completed: false,
          required: true,
          icon: Book,
        },
        {
          id: "benefits",
          title: "Enroll in Benefits",
          description: "Select health insurance and other benefits",
          category: "Benefits",
          completed: false,
          required: false,
          icon: Shield,
        },
        {
          id: "emergency-contact",
          title: "Add Emergency Contact",
          description: "Provide emergency contact information",
          category: "Personal Info",
          completed: false,
          required: true,
          icon: User,
        },
        {
          id: "equipment",
          title: "Acknowledge Equipment Receipt",
          description: "Confirm receipt of laptop, phone, etc.",
          category: "Equipment",
          completed: false,
          required: true,
          icon: Upload,
        },
      ];

      // Mark completed tasks
      const tasksWithStatus = onboardingTasks.map((task) => ({
        ...task,
        completed: completedTasks.includes(task.id),
      }));

      setTasks(tasksWithStatus);
    } catch (error) {
      console.error("Error loading onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const orgId = claims.orgId;
      await updateDoc(doc(db, `orgs/${orgId}/employees`, user.uid), {
        completedOnboardingTasks: arrayUnion(taskId),
      });

      setCompletedTasks([...completedTasks, taskId]);
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to mark task as complete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progress = (completedCount / totalCount) * 100;
  const requiredTasks = tasks.filter((t) => t.required);
  const completedRequired = requiredTasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Onboarding Checklist</h1>
          <p className="text-muted-foreground">
            Complete these tasks to finish your onboarding process
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Overall Progress</h2>
              <p className="text-white/80">
                {completedCount} of {totalCount} tasks completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{progress.toFixed(0)}%</div>
              <p className="text-white/80 text-sm">Complete</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-4">
            <div
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm">
              Required tasks: {completedRequired} of {requiredTasks.length} completed
            </p>
          </div>
        </div>

        {/* Tasks by Category */}
        {["Personal Info", "Tax & Payroll", "Compliance", "Training", "Benefits", "Equipment"].map(
          (category) => {
            const categoryTasks = tasks.filter((t) => t.category === category);
            if (categoryTasks.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-bold mb-4">{category}</h2>
                <div className="space-y-4">
                  {categoryTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                    />
                  ))}
                </div>
              </div>
            );
          }
        )}

        {/* Completion Message */}
        {progress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Onboarding Complete! 🎉
            </h2>
            <p className="text-green-700">
              You've completed all onboarding tasks. Welcome to the team!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component: Task Card
function TaskCard({
  task,
  onComplete,
}: {
  task: OnboardingTask;
  onComplete: (id: string) => void;
}) {
  const Icon = task.icon;

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 transition-all ${
        task.completed ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
            task.completed ? "bg-green-100" : "bg-primary/10"
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              task.completed ? "text-green-600" : "text-primary"
            }`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {task.title}
                {task.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            {task.completed ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onComplete(task.id)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Mark as Complete
                </button>
                <button className="px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
                  View Details
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
