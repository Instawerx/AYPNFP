"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Download, Bell, BellOff, Calendar } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  createdAt: any;
  campaign: string | null;
  source: string;
}

export default function DonorPortalPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fcmConsent, setFcmConsent] = useState(false);
  const [ytdTotal, setYtdTotal] = useState(0);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadDonations(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadDonations = async (userId: string) => {
    try {
      const orgId = process.env.NEXT_PUBLIC_ORG_ID || "aayp-prod";

      // Fetch donations
      const donationsRef = collection(db, `orgs/${orgId}/donations`);
      const q = query(
        donationsRef,
        where("donor.email", "==", user?.email),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const donationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Donation[];

      setDonations(donationsList);

      // Calculate totals
      const currentYear = new Date().getFullYear();
      const ytd = donationsList
        .filter((d) => d.createdAt?.toDate().getFullYear() === currentYear)
        .reduce((sum, d) => sum + d.amount, 0);

      const lifetime = donationsList.reduce((sum, d) => sum + d.amount, 0);

      setYtdTotal(ytd);
      setLifetimeTotal(lifetime);
    } catch (error) {
      console.error("Error loading donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async () => {
    // TODO: Update consent in Firestore
    setFcmConsent(!fcmConsent);
  };

  const downloadReceipt = (donationId: string) => {
    window.open(`/api/receipts/${donationId}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your donations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your donor portal.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Donor Portal</h1>
          <p className="text-muted-foreground">
            Welcome back! View your donation history and manage your preferences.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Year-to-Date
            </h3>
            <p className="text-3xl font-bold text-primary">
              ${ytdTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Lifetime Total
            </h3>
            <p className="text-3xl font-bold text-primary">
              ${lifetimeTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Total Donations
            </h3>
            <p className="text-3xl font-bold text-primary">{donations.length}</p>
          </div>
        </div>

        {/* Consent Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fcmConsent ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-semibold">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive instant notifications about receipts and updates
                </p>
              </div>
            </div>
            <button
              onClick={handleConsentToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible-ring ${
                fcmConsent ? "bg-primary" : "bg-gray-200"
              }`}
              aria-label="Toggle push notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  fcmConsent ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Donation History</h2>
          </div>
          <div className="divide-y">
            {donations.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No donations yet. Thank you for your interest!</p>
              </div>
            ) : (
              donations.map((donation) => (
                <div
                  key={donation.id}
                  className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">
                      ${donation.amount.toFixed(2)} {donation.currency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {donation.createdAt?.toDate().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {donation.campaign && (
                      <p className="text-xs text-muted-foreground">
                        Campaign: {donation.campaign}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => downloadReceipt(donation.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors focus-visible-ring"
                  >
                    <Download className="h-4 w-4" />
                    Receipt
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
