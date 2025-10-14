"use client";

import { useEffect } from "react";
import { Shield, Lock, FileText } from "lucide-react";

export default function DonatePage() {
  useEffect(() => {
    // Load Zeffy widget script
    const script = document.createElement("script");
    script.src = "https://widget.zeffy.com/widget-loader.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <main id="main-content" className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Support ADOPT A YOUNG PARENT</h1>
          <p className="text-lg text-muted-foreground">
            Your donation directly supports young families in Michigan. Every
            contribution makes a real difference.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Shield className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Secure Donation</h3>
              <p className="text-sm text-muted-foreground">SSL encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Instant Receipt</h3>
              <p className="text-sm text-muted-foreground">Emailed immediately</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Lock className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Tax Deductible</h3>
              <p className="text-sm text-muted-foreground">501(c)(3) pending</p>
            </div>
          </div>
        </div>

        {/* Zeffy Widget */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div
            className="zeffy-widget"
            data-widget-id={process.env.NEXT_PUBLIC_ZEFFY_FORM_ID || ""}
            data-locale="en"
          />
        </div>

        {/* Disclosure */}
        <div className="text-sm text-muted-foreground space-y-4">
          <p className="font-semibold">Michigan Charitable Solicitation Disclosure:</p>
          <p>
            ADOPT A YOUNG PARENT is registered to solicit contributions in Michigan.
            For information, visit the Michigan Attorney General, Charitable Trust
            Section.
          </p>
          <p>
            <strong>State Entity ID:</strong> 803297893 •{" "}
            <strong>Filing Effective:</strong> November 19, 2024
          </p>
          <p>
            Your donation may be tax-deductible to the extent allowed by law. Please
            consult your tax advisor. You will receive a receipt immediately after
            your donation is processed.
          </p>
          <p>
            No goods or services will be provided in exchange for this contribution
            unless otherwise stated. If goods or services are provided, their fair
            market value will be disclosed on your receipt.
          </p>
        </div>

        {/* Alternative Payment Method */}
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <h3 className="font-semibold mb-2">Prefer a different payment method?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We also accept donations via credit card through our secure Stripe
            integration.
          </p>
          <a
            href="/donate/stripe"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors focus-visible-ring"
          >
            Donate with Credit Card
          </a>
        </div>
      </div>
    </main>
  );
}
