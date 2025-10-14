"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Key,
  Shield,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";

interface ZeffyConfig {
  enabled: boolean;
  formId?: string;
  webhookSecret?: string; // Stored in Firebase Functions config
  organizationId?: string;
  lastSync?: any;
  stats?: {
    totalDonations: number;
    totalAmount: number;
    averageGift: number;
  };
  webhookEndpoint?: string;
}

export default function ZeffyIntegrationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ZeffyConfig>({
    enabled: true, // Zeffy is primary, enabled by default
  });
  const [copied, setCopied] = useState(false);

  const webhookUrl = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/zeffyWebhook`;

  useEffect(() => {
    if (user) {
      fetchZeffyConfig();
    }
  }, [user]);

  const fetchZeffyConfig = async () => {
    setLoading(true);
    try {
      const orgRef = doc(db, "orgs", user.orgId, "settings", "integrations");
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const data = orgSnap.data();
        setConfig({
          enabled: data.zeffy?.enabled !== false, // Default to true
          formId: data.zeffy?.formId || "",
          organizationId: data.zeffy?.organizationId || "",
          lastSync: data.zeffy?.lastSync,
          stats: data.zeffy?.stats,
          webhookEndpoint: data.zeffy?.webhookEndpoint || webhookUrl,
        });
      }
    } catch (error) {
      console.error("Error fetching Zeffy config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orgRef = doc(db, "orgs", user.orgId, "settings", "integrations");
      await updateDoc(orgRef, {
        "zeffy.enabled": config.enabled,
        "zeffy.formId": config.formId,
        "zeffy.organizationId": config.organizationId,
        "zeffy.webhookEndpoint": config.webhookEndpoint,
        "zeffy.updatedAt": new Date(),
        "zeffy.updatedBy": user.uid,
      });

      alert("Zeffy configuration saved successfully!");
    } catch (error) {
      console.error("Error saving Zeffy config:", error);
      alert("Error saving configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <Heart className="w-8 h-8 text-pink-600" />
            Zeffy Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Configure Zeffy as your primary 100% free payment processor
          </p>
        </div>
        <a
          href="https://www.zeffy.com/en-US/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ExternalLink className="w-4 h-4" />
          Open Zeffy Dashboard
        </a>
      </div>

      {/* Benefits Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <Heart className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-2">Why Zeffy?</h2>
            <ul className="space-y-1 text-sm opacity-90">
              <li>• 100% free for nonprofits - no platform fees, no transaction fees</li>
              <li>• Donors can optionally tip to support Zeffy's mission</li>
              <li>• Simple, beautiful donation forms</li>
              <li>• Automatic tax receipts</li>
              <li>• Recurring donation support</li>
            </ul>
          </div>
        </div>
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
                {config.enabled ? "Zeffy Enabled" : "Zeffy Disabled"}
              </div>
              <div className="text-sm text-gray-600">
                {config.enabled
                  ? "Zeffy is active as your primary payment processor"
                  : "Enable Zeffy to accept 100% free donations"}
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-600" />
          Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeffy Form ID
            </label>
            <input
              type="text"
              value={config.formId || ""}
              onChange={(e) => setConfig({ ...config, formId: e.target.value })}
              placeholder="your-form-id"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find this in your Zeffy Dashboard → Forms → Your Form → Settings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization ID (Optional)
            </label>
            <input
              type="text"
              value={config.organizationId || ""}
              onChange={(e) => setConfig({ ...config, organizationId: e.target.value })}
              placeholder="org_..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Zeffy organization ID (optional, for advanced features)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Endpoint URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={copyWebhookUrl}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configure this URL in your Zeffy Dashboard → Settings → Webhooks
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <input
              type="password"
              placeholder="Stored securely in Firebase Functions config"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Webhook secret must be set via Firebase Functions config for security
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 block">
              firebase functions:config:set zeffy.webhook_secret="your_secret_here"
            </code>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {config.enabled && config.stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            Zeffy Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <div className="text-sm text-pink-700 mb-1">Total Donations</div>
              <div className="text-2xl font-bold text-pink-900">
                {config.stats.totalDonations}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-green-900">
                ${config.stats.totalAmount.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Average Gift</div>
              <div className="text-2xl font-bold text-blue-900">
                ${config.stats.averageGift.toFixed(2)}
              </div>
            </div>
          </div>

          {config.lastSync && (
            <div className="text-xs text-gray-500 mt-4">
              Last synced: {new Date(config.lastSync.toDate()).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Embed Code */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-600" />
          Donation Form Embed Code
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Use this code to embed your Zeffy donation form on your public website:
        </p>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm text-green-400 font-mono">
            {`<!-- Zeffy Donation Form -->
<div id="zeffy-donation-form"></div>
<script src="https://www.zeffy.com/embed.js"></script>
<script>
  Zeffy.init({
    formId: '${config.formId || "your-form-id"}',
    container: '#zeffy-donation-form'
  });
</script>`}
          </code>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          This code is already integrated in your public website's donate page
        </p>
      </div>

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
              Create a Zeffy account at{" "}
              <a
                href="https://www.zeffy.com/en-US/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                zeffy.com/signup
              </a>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">2.</span>
            <span>
              Create a donation form in your Zeffy Dashboard → Forms → Create New Form
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">3.</span>
            <span>
              Copy your Form ID from the form settings and enter it above
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">4.</span>
            <span>
              Set up webhooks in Zeffy Dashboard → Settings → Webhooks → Add Webhook
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">5.</span>
            <span>
              Use the webhook URL shown above and subscribe to donation events
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">6.</span>
            <span>
              Copy the webhook secret from Zeffy and set it via Firebase CLI:
              <code className="block bg-white px-2 py-1 rounded mt-1 text-xs">
                firebase functions:config:set zeffy.webhook_secret="your_secret"
              </code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">7.</span>
            <span>Save the configuration above and test with a donation</span>
          </li>
        </ol>
      </div>

      {/* Benefits Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Zeffy vs Traditional Processors
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-left py-3 px-4">Zeffy</th>
                <th className="text-left py-3 px-4">Traditional (Stripe, etc.)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Platform Fee</td>
                <td className="py-3 px-4 text-green-600 font-medium">$0 (100% free)</td>
                <td className="py-3 px-4 text-red-600">2.9% + $0.30</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Transaction Fee</td>
                <td className="py-3 px-4 text-green-600 font-medium">$0</td>
                <td className="py-3 px-4 text-red-600">~3%</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Monthly Fee</td>
                <td className="py-3 px-4 text-green-600 font-medium">$0</td>
                <td className="py-3 px-4 text-red-600">$0-$30</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Tax Receipts</td>
                <td className="py-3 px-4 text-green-600">✓ Automatic</td>
                <td className="py-3 px-4 text-gray-600">Manual setup required</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Recurring Donations</td>
                <td className="py-3 px-4 text-green-600">✓ Included</td>
                <td className="py-3 px-4 text-green-600">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Revenue Model</td>
                <td className="py-3 px-4 text-blue-600">Optional donor tips</td>
                <td className="py-3 px-4 text-gray-600">Mandatory fees</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-2">
            <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-900">Cost Savings Example</div>
              <div className="text-sm text-green-700 mt-1">
                On $10,000 in donations, Zeffy saves you ~$320 compared to traditional processors
                (3.2% in fees). That's more money going directly to your mission!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex gap-2">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-900">Security Notice</div>
            <div className="text-sm text-yellow-700 mt-1">
              Never store your Zeffy webhook secret in Firestore or client-side code. Always use
              Firebase Functions config or Secret Manager for sensitive credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
