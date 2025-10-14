import { FileText, Shield, Users, DollarSign } from "lucide-react";

export default function TransparencyPage() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">Transparency & Accountability</h1>
          <p className="text-xl">
            We believe in complete transparency with our donors and community.
          </p>
        </div>
      </section>

      {/* Legal Information */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-4">Legal Status</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong>Organization Name:</strong> ADOPT A YOUNG PARENT
                  </p>
                  <p>
                    <strong>Jurisdiction:</strong> Michigan, USA
                  </p>
                  <p>
                    <strong>State Entity ID:</strong> 803297893
                  </p>
                  <p>
                    <strong>Filing Received:</strong> November 8, 2024
                  </p>
                  <p>
                    <strong>Filing Effective:</strong> November 19, 2024
                  </p>
                  <p>
                    <strong>Filing Number:</strong> 224860800370
                  </p>
                  <p>
                    <strong>501(c)(3) Status:</strong> Pending
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">Michigan Charitable Solicitation Disclosure:</p>
              <p>
                ADOPT A YOUNG PARENT is registered to solicit contributions in
                Michigan. For information, visit the Michigan Attorney General,
                Charitable Trust Section.
              </p>
            </div>
          </div>

          {/* Financial Transparency */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <DollarSign className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Financial Information</h2>
                <p className="text-muted-foreground mb-6">
                  We are committed to responsible stewardship of donor funds. Our
                  financial statements and IRS Form 990 will be published annually
                  once available.
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">2024 Financial Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Financial statements will be available after our first full
                      fiscal year.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">IRS Form 990</h3>
                    <p className="text-sm text-muted-foreground">
                      Form 990 will be filed and published annually once our
                      501(c)(3) status is approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Board of Directors */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <Users className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Board of Directors</h2>
                <p className="text-muted-foreground mb-6">
                  Our board provides strategic oversight and ensures we fulfill our
                  mission with integrity.
                </p>

                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <p className="font-semibold">[Board Member Name]</p>
                    <p className="text-sm text-muted-foreground">Chair</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="font-semibold">[Board Member Name]</p>
                    <p className="text-sm text-muted-foreground">Treasurer</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="font-semibold">[Board Member Name]</p>
                    <p className="text-sm text-muted-foreground">Secretary</p>
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold">[Board Member Name]</p>
                    <p className="text-sm text-muted-foreground">Member</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Policies & Documents</h2>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold">Conflict of Interest Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Download PDF (Coming Soon)
                    </p>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold">Whistleblower Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Download PDF (Coming Soon)
                    </p>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold">Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Download PDF (Coming Soon)
                    </p>
                  </a>
                  <a
                    href="#"
                    className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold">Donor Bill of Rights</p>
                    <p className="text-sm text-muted-foreground">
                      Download PDF (Coming Soon)
                    </p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Questions */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-4">Questions About Our Operations?</h2>
          <p className="text-muted-foreground mb-6">
            We're happy to answer any questions about our organization, finances,
            or programs.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>
    </main>
  );
}
