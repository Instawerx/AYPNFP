"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building, Save, AlertCircle, CheckCircle } from "lucide-react";

interface OrgSettings {
  name: string;
  jurisdiction: string;
  stateCorpId: string;
  filingReceivedDate: string;
  filingEffectiveDate: string;
  filingNumber: string;
  ein: string;
  status501c3: string;
  legalAddress: string;
  emailSupport: string;
  phone: string;
  website: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export default function OrganizationSettings() {
  const { claims, hasScope } = useAuth();
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!hasScope("admin.read")) {
      setLoading(false);
      return;
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const orgId = claims.orgId;
      const settingsDoc = await getDoc(
        doc(db, `orgs/${orgId}/settings/general`)
      );

      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as OrgSettings);
      } else {
        // Initialize with default values
        setSettings({
          name: "ADOPT A YOUNG PARENT",
          jurisdiction: "Michigan, USA",
          stateCorpId: "803297893",
          filingReceivedDate: "2024-11-08",
          filingEffectiveDate: "2024-11-19",
          filingNumber: "224860800370",
          ein: "",
          status501c3: "PENDING",
          legalAddress: "",
          emailSupport: "support@adoptayoungparent.org",
          phone: "",
          website: "https://adoptayoungparent.org",
          primaryColor: "#0ea5e9",
          accentColor: "#a855f7",
          logoUrl: "",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !hasScope("admin.write")) return;

    setSaving(true);
    setMessage(null);

    try {
      const orgId = claims.orgId;
      await updateDoc(doc(db, `orgs/${orgId}/settings/general`), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });

      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof OrgSettings, value: string) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

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
            You don't have permission to view organization settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's information, legal details, and branding
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        {/* General Information Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings?.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
                required
              />
            </div>

            {/* Jurisdiction */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Jurisdiction
              </label>
              <input
                type="text"
                value={settings?.jurisdiction || ""}
                onChange={(e) => updateField("jurisdiction", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* State Entity ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                State Entity ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings?.stateCorpId || ""}
                onChange={(e) => updateField("stateCorpId", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Michigan State Entity ID: 803297893
              </p>
            </div>

            {/* EIN */}
            <div>
              <label className="block text-sm font-medium mb-2">
                EIN (Tax ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings?.ein || ""}
                onChange={(e) => updateField("ein", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="XX-XXXXXXX"
                disabled={!hasScope("admin.write")}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: XX-XXXXXXX
              </p>
            </div>

            {/* Filing Received Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Received Date
              </label>
              <input
                type="date"
                value={settings?.filingReceivedDate || ""}
                onChange={(e) => updateField("filingReceivedDate", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* Filing Effective Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Effective Date
              </label>
              <input
                type="date"
                value={settings?.filingEffectiveDate || ""}
                onChange={(e) => updateField("filingEffectiveDate", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* Filing Number */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Number
              </label>
              <input
                type="text"
                value={settings?.filingNumber || ""}
                onChange={(e) => updateField("filingNumber", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* 501(c)(3) Status */}
            <div>
              <label className="block text-sm font-medium mb-2">
                501(c)(3) Status
              </label>
              <select
                value={settings?.status501c3 || ""}
                onChange={(e) => updateField("status501c3", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              >
                <option value="">Select status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="NOT_APPLICABLE">Not Applicable</option>
              </select>
            </div>

            {/* Legal Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Legal Address
              </label>
              <textarea
                value={settings?.legalAddress || ""}
                onChange={(e) => updateField("legalAddress", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings?.emailSupport || ""}
                onChange={(e) => updateField("emailSupport", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings?.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={settings?.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.org"
                disabled={!hasScope("admin.write")}
              />
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Brand Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings?.primaryColor || "#0ea5e9"}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                  disabled={!hasScope("admin.write")}
                />
                <input
                  type="text"
                  value={settings?.primaryColor || ""}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="#0ea5e9"
                  disabled={!hasScope("admin.write")}
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings?.accentColor || "#a855f7"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                  disabled={!hasScope("admin.write")}
                />
                <input
                  type="text"
                  value={settings?.accentColor || ""}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="#a855f7"
                  disabled={!hasScope("admin.write")}
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={settings?.logoUrl || ""}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/logo.png"
                disabled={!hasScope("admin.write")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: PNG or SVG, transparent background, min 200x200px
              </p>
            </div>
          </div>

          {/* Save Button */}
          {hasScope("admin.write") && (
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Michigan Disclosure */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            Michigan Charitable Solicitation Disclosure
          </h3>
          <p className="text-sm text-blue-800">
            ADOPT A YOUNG PARENT is registered to solicit contributions in Michigan.
            For information, visit the Michigan Attorney General, Charitable Trust Section.
            State Entity ID: {settings?.stateCorpId} • Filing Effective: {settings?.filingEffectiveDate}
          </p>
        </div>
      </div>
    </div>
  );
}
