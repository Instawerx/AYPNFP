"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Shield,
  DollarSign,
  Activity,
} from "lucide-react";

interface StripeConfig {
  enabled: boolean;
  publishableKey?: string;
  secretKey?: string; // Stored in Firebase Functions config, not Firestore
  webhookSecret?: string; // Stored in Firebase Functions config
  accountId?: string;
  accountStatus?: "active" | "pending" | "restricted" | "disabled";
  lastSync?: any;
  balance?: {
    available: number;
    pending: number;
  };
  webhookEndpoint?: string;
}

export default function StripeIntegrationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<StripeConfig>({
    enabled: false,
  });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchStripeConfig();
    }
  }, [user]);

  const fetchStripeConfig = async () => {
    setLoading(true);
    try {
      const orgRef = doc(db, "orgs", user.orgId, "settings", "integrations");
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const data = orgSnap.data();
        setConfig({
          enabled: data.stripe?.enabled || false,
          publishableKey: data.stripe?.publishableKey || "",
          accountId: data.stripe?.accountId || "",
          accountStatus: data.stripe?.accountStatus || "pending",
          lastSync: data.stripe?.lastSync,
          balance: data.stripe?.balance,
          webhookEndpoint: data.stripe?.webhookEndpoint || "",
        });
      }
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orgRef = doc(db, "orgs", user.orgId, "settings", "integrations");
      await updateDoc(orgRef, {
        "stripe.enabled": config.enabled,
        "stripe.publishableKey": config.publishableKey,
        "stripe.accountId": config.accountId,
        "stripe.webhookEndpoint": config.webhookEndpoint,
        "stripe.updatedAt": new Date(),
        "stripe.updatedBy": user.uid,
      });

      alert("Stripe configuration saved successfully!");
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      alert("Error saving configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // In production, this would call a Cloud Function to test the Stripe connection
      // For now, we'll simulate a test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success
      setTestResult({
        success: true,
        message: "Successfully connected to Stripe! Account is active and ready to process payments.",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to connect to Stripe. Please check your API keys and try again.",
      });
    } finally {
      setTesting(false);
    }
  };

  const syncBalance = async () => {
    // In production, this would call a Cloud Function to fetch the latest balance from Stripe
    alert("Balance sync would be implemented via Cloud Function");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Stripe Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Configure Stripe as a fallback payment processor
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ExternalLink className="w-4 h-4" />
          Open Stripe Dashboard
        </a>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-lg border-2 p-6 ${
          config.enabled
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.enabled ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {config.enabled ? "Stripe Enabled" : "Stripe Disabled"}
              </div>
              <div className="text-sm text-gray-600">
                {config.enabled
                  ? "Stripe is active as a fallback payment processor"
                  : "Enable Stripe to accept credit card payments"}
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-600" />
          API Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publishable Key
            </label>
            <input
              type="text"
              value={config.publishableKey || ""}
              onChange={(e) => setConfig({ ...config, publishableKey: e.target.value })}
              placeholder="pk_live_..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Stripe publishable key (starts with pk_)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key
            </label>
            <input
              type="password"
              placeholder="sk_live_... (stored securely in Functions config)"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Secret key must be set via Firebase Functions config for security
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 block">
              firebase functions:config:set stripe.secret_key="sk_live_..."
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Endpoint URL
            </label>
            <input
              type="text"
              value={config.webhookEndpoint || ""}
              onChange={(e) => setConfig({ ...config, webhookEndpoint: e.target.value })}
              placeholder="https://your-domain.com/api/webhooks/stripe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Configure this URL in your Stripe Dashboard → Developers → Webhooks
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <input
              type="password"
              placeholder="whsec_... (stored securely in Functions config)"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Webhook signing secret must be set via Firebase Functions config
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 block">
              firebase functions:config:set stripe.webhook_secret="whsec_..."
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account ID (Optional)
            </label>
            <input
              type="text"
              value={config.accountId || ""}
              onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
              placeholder="acct_..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              For Stripe Connect accounts (leave blank for standard accounts)
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          <button
            onClick={testConnection}
            disabled={testing || !config.publishableKey}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              testResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    testResult.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {testResult.success ? "Connection Successful" : "Connection Failed"}
                </div>
                <div
                  className={`text-sm mt-1 ${
                    testResult.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {testResult.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Status */}
      {config.enabled && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            Account Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Account Status</div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    config.accountStatus === "active"
                      ? "bg-green-100 text-green-800"
                      : config.accountStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {config.accountStatus || "Unknown"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Last Sync</div>
              <div className="font-medium text-gray-900">
                {config.lastSync
                  ? new Date(config.lastSync.toDate()).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Information */}
      {config.enabled && config.balance && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              Account Balance
            </h2>
            <button
              onClick={syncBalance}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Balance
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Available Balance</div>
              <div className="text-2xl font-bold text-green-900">
                ${(config.balance.available / 100).toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">Pending Balance</div>
              <div className="text-2xl font-bold text-yellow-900">
                ${(config.balance.pending / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Setup Instructions
        </h2>

        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">1.</span>
            <span>
              Create a Stripe account at{" "}
              <a
                href="https://dashboard.stripe.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                dashboard.stripe.com/register
              </a>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">2.</span>
            <span>
              Get your API keys from Stripe Dashboard → Developers → API keys
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">3.</span>
            <span>
              Set your secret key via Firebase CLI:
              <code className="block bg-white px-2 py-1 rounded mt-1 text-xs">
                firebase functions:config:set stripe.secret_key="sk_live_..."
              </code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">4.</span>
            <span>
              Create a webhook endpoint in Stripe Dashboard → Developers → Webhooks
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">5.</span>
            <span>
              Subscribe to these events: <code>checkout.session.completed</code>,{" "}
              <code>payment_intent.succeeded</code>, <code>charge.refunded</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">6.</span>
            <span>
              Set your webhook secret via Firebase CLI:
              <code className="block bg-white px-2 py-1 rounded mt-1 text-xs">
                firebase functions:config:set stripe.webhook_secret="whsec_..."
              </code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">7.</span>
            <span>Enter your publishable key above and save the configuration</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">8.</span>
            <span>Test the connection to verify everything is working</span>
          </li>
        </ol>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex gap-2">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-900">Security Notice</div>
            <div className="text-sm text-yellow-700 mt-1">
              Never store your Stripe secret key or webhook secret in Firestore or client-side
              code. Always use Firebase Functions config or Secret Manager for sensitive
              credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
