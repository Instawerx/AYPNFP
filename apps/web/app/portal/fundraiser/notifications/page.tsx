"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Bell,
  Send,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Clock,
  Filter,
} from "lucide-react";

interface Donor {
  id: string;
  name: string;
  email: string;
  consent: {
    fcm?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  lastContactedAt?: any;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category: string;
}

const TEMPLATES: NotificationTemplate[] = [
  {
    id: "thank-you",
    name: "Thank You",
    title: "Thank you for your support!",
    body: "Your generosity makes a real difference in the lives of young parents. Thank you!",
    category: "appreciation",
  },
  {
    id: "follow-up",
    name: "Follow Up",
    title: "We'd love to hear from you",
    body: "Hi! I wanted to follow up and see if you have any questions about our programs.",
    category: "engagement",
  },
  {
    id: "campaign-update",
    name: "Campaign Update",
    title: "Campaign Update",
    body: "We're making great progress! Thanks to supporters like you, we're 75% to our goal.",
    category: "campaign",
  },
  {
    id: "event-invite",
    name: "Event Invitation",
    title: "You're invited!",
    body: "Join us for our upcoming event. We'd love to see you there!",
    category: "event",
  },
  {
    id: "impact-story",
    name: "Impact Story",
    title: "See your impact",
    body: "Your support helped Sarah complete her education and secure a stable job. Thank you!",
    category: "impact",
  },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [filterConsent, setFilterConsent] = useState(true);
  const [sendResult, setSendResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchDonors();
    }
  }, [user, filterConsent]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const donorsRef = collection(db, "donors");
      const donorsQuery = query(
        donorsRef,
        where("orgId", "==", user.orgId),
        where("assignedTo", "==", user.uid)
      );

      const donorsSnap = await getDocs(donorsQuery);
      let donorsList = donorsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Donor[];

      // Filter by consent if enabled
      if (filterConsent) {
        donorsList = donorsList.filter((donor) => donor.consent?.fcm === true);
      }

      setDonors(donorsList);
    } catch (error) {
      console.error("Error fetching donors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedDonors.size === donors.length) {
      setSelectedDonors(new Set());
    } else {
      setSelectedDonors(new Set(donors.map((d) => d.id)));
    }
  };

  const handleSelectDonor = (donorId: string) => {
    const newSelected = new Set(selectedDonors);
    if (newSelected.has(donorId)) {
      newSelected.delete(donorId);
    } else {
      newSelected.add(donorId);
    }
    setSelectedDonors(newSelected);
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setCustomTitle(template.title);
    setCustomBody(template.body);
  };

  const handleSendNotifications = async () => {
    if (selectedDonors.size === 0) {
      alert("Please select at least one donor");
      return;
    }

    if (!customTitle || !customBody) {
      alert("Please enter a title and message");
      return;
    }

    if (
      !confirm(
        `Send notification to ${selectedDonors.size} donor(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      let success = 0;
      let failed = 0;
      let skipped = 0;

      for (const donorId of selectedDonors) {
        const donor = donors.find((d) => d.id === donorId);
        if (!donor) continue;

        // Check consent
        if (!donor.consent?.fcm) {
          skipped++;
          continue;
        }

        // Check rate limit (max 3 per donor per day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const notificationsRef = collection(db, "notifications");
        const recentQuery = query(
          notificationsRef,
          where("donorId", "==", donorId),
          where("sentAt", ">=", Timestamp.fromDate(today))
        );

        const recentSnap = await getDocs(recentQuery);
        if (recentSnap.size >= 3) {
          skipped++;
          continue;
        }

        try {
          // Create notification record
          await addDoc(collection(db, "notifications"), {
            orgId: user.orgId,
            donorId: donorId,
            fundraiserId: user.uid,
            title: customTitle,
            body: customBody,
            type: "fcm",
            status: "sent",
            sentAt: Timestamp.now(),
            createdAt: Timestamp.now(),
          });

          // In production, this would trigger a Cloud Function to send the actual FCM push
          // The function would:
          // 1. Fetch donor's FCM tokens from donors/{donorId}/devices
          // 2. Send multicast notification via Firebase Admin SDK
          // 3. Handle token cleanup for invalid tokens
          // 4. Log communication record

          success++;
        } catch (error) {
          console.error(`Error sending to donor ${donorId}:`, error);
          failed++;
        }
      }

      setSendResult({ success, failed, skipped });
      setSelectedDonors(new Set());
      setCustomTitle("");
      setCustomBody("");
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error sending notifications:", error);
      alert("Error sending notifications. Please try again.");
    } finally {
      setSending(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          Donor Notifications
        </h1>
        <p className="text-gray-600 mt-1">
          Send consent-aware push notifications to your assigned donors
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-yellow-900">Important Guidelines</div>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Only donors who have opted in to notifications will receive messages</li>
              <li>• Maximum 3 notifications per donor per day (rate limit)</li>
              <li>• All notifications are logged for compliance and audit purposes</li>
              <li>• Be respectful and professional in all communications</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Filter className="w-5 h-5 text-gray-600" />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterConsent}
            onChange={(e) => setFilterConsent(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Show only donors who opted in to notifications
          </span>
        </label>
        <div className="ml-auto text-sm text-gray-600">
          {donors.length} donor(s) {filterConsent && "with consent"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Select Recipients
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedDonors.size === donors.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {donors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {filterConsent
                  ? "No donors with notification consent"
                  : "No assigned donors found"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {donors.map((donor) => (
                <label
                  key={donor.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDonors.has(donor.id)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDonors.has(donor.id)}
                    onChange={() => handleSelectDonor(donor.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{donor.name}</div>
                    <div className="text-sm text-gray-500">{donor.email}</div>
                  </div>
                  {donor.consent?.fcm && (
                    <CheckCircle className="w-4 h-4 text-green-600" title="Opted in" />
                  )}
                  {donor.lastContactedAt && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(donor.lastContactedAt.toDate()).toLocaleDateString()}
                    </div>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900">
              {selectedDonors.size} donor(s) selected
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            Compose Message
          </h2>

          {/* Templates */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? "bg-blue-50 border-blue-200 text-blue-900"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter notification title..."
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1">{customTitle.length}/50 characters</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body
              </label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Enter your message..."
                maxLength={200}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">{customBody.length}/200 characters</div>
            </div>
          </div>

          {/* Preview */}
          {(customTitle || customBody) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="font-medium text-gray-900 mb-1">{customTitle || "Title"}</div>
                <div className="text-sm text-gray-600">{customBody || "Message body"}</div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendNotifications}
            disabled={sending || selectedDonors.size === 0 || !customTitle || !customBody}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {selectedDonors.size} Donor(s)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Send Result */}
      {sendResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Sent Successfully</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{sendResult.success}</div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Skipped</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{sendResult.skipped}</div>
              <div className="text-xs text-yellow-700 mt-1">No consent or rate limited</div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{sendResult.failed}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
