"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plug,
  CreditCard,
  DollarSign,
  Bell,
  BarChart3,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: "connected" | "disconnected" | "error";
  category: "payments" | "notifications" | "analytics";
  configUrl: string;
  docsUrl: string;
}

interface IntegrationConfig {
  zeffy: {
    enabled: boolean;
    formId?: string;
    webhookSecret?: string;
  };
  stripe: {
    enabled: boolean;
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  fcm: {
    enabled: boolean;
    vapidPublicKey?: string;
  };
  analytics: {
    enabled: boolean;
    measurementId?: string;
    bigQueryEnabled: boolean;
  };
}

export default function IntegrationsPage() {
  const { claims, hasScope } = useAuth();
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasScope("admin.read")) {
      setLoading(false);
      return;
    }
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const orgId = claims.orgId;
      const settingsDoc = await getDoc(
        doc(db, `orgs/${orgId}/settings/general`)
      );

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setConfig(data.integrations || getDefaultConfig());
      } else {
        setConfig(getDefaultConfig());
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (): IntegrationConfig => ({
    zeffy: { enabled: false },
    stripe: { enabled: false },
    fcm: { enabled: false },
    analytics: { enabled: false, bigQueryEnabled: false },
  });

  const integrations: Integration[] = [
    {
      id: "zeffy",
      name: "Zeffy",
      description: "Fee-free donation processing (primary payment method)",
      icon: DollarSign,
      status: config?.zeffy.enabled ? "connected" : "disconnected",
      category: "payments",
      configUrl: "/portal/admin/integrations/zeffy",
      docsUrl: "https://www.zeffy.com/docs",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Credit card processing (fallback payment method)",
      icon: CreditCard,
      status: config?.stripe.enabled ? "connected" : "disconnected",
      category: "payments",
      configUrl: "/portal/admin/integrations/stripe",
      docsUrl: "https://stripe.com/docs",
    },
    {
      id: "fcm",
      name: "Firebase Cloud Messaging",
      description: "Push notifications for donors and staff",
      icon: Bell,
      status: config?.fcm.enabled ? "connected" : "disconnected",
      category: "notifications",
      configUrl: "/portal/admin/integrations/fcm",
      docsUrl: "https://firebase.google.com/docs/cloud-messaging",
    },
    {
      id: "analytics",
      name: "Google Analytics 4",
      description: "Website analytics and donor funnel tracking",
      icon: BarChart3,
      status: config?.analytics.enabled ? "connected" : "disconnected",
      category: "analytics",
      configUrl: "/portal/admin/integrations/analytics",
      docsUrl: "https://support.google.com/analytics",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("admin.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to view integrations.
          </p>
        </div>
      </div>
    );
  }

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integrations</h1>
          <p className="text-muted-foreground">
            Connect and configure third-party services
          </p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total Integrations
              </span>
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{integrations.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Connected
              </span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {connectedCount}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Available
              </span>
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-muted-foreground">
              {integrations.length - connectedCount}
            </div>
          </div>
        </div>

        {/* Critical Notice */}
        {connectedCount === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  No Payment Integrations Connected
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  You need to connect at least one payment processor (Zeffy or Stripe)
                  to accept donations. Zeffy is recommended as the primary method since
                  it's fee-free.
                </p>
                <Link
                  href="/portal/admin/integrations/zeffy"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Configure Zeffy Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Payments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Payment Processing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations
              .filter((i) => i.category === "payments")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  hasWriteAccess={hasScope("admin.write")}
                />
              ))}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations
              .filter((i) => i.category === "notifications")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  hasWriteAccess={hasScope("admin.write")}
                />
              ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Reporting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations
              .filter((i) => i.category === "analytics")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  hasWriteAccess={hasScope("admin.write")}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Integration Card
function IntegrationCard({
  integration,
  hasWriteAccess,
}: {
  integration: Integration;
  hasWriteAccess: boolean;
}) {
  const Icon = integration.icon;
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Connected",
    },
    disconnected: {
      icon: XCircle,
      color: "text-gray-600",
      bg: "bg-gray-100",
      label: "Not Connected",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100",
      label: "Error",
    },
  };

  const status = statusConfig[integration.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{integration.name}</h3>
              <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {integration.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          {hasWriteAccess && (
            <Link
              href={integration.configUrl}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configure
            </Link>
          )}
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            title="View documentation"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
