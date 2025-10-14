"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setSubmitting(false);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });

    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl">
            We're here to help. Reach out with questions, to get involved, or to
            access our services.
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-6">
                  Have questions or need support? We're here to help young parents
                  and families across Michigan.
                </p>
              </div>

              <ContactInfoCard
                icon={Phone}
                title="Phone"
                content="(555) 123-4567"
                subtext="Mon-Fri, 9am-5pm EST"
              />

              <ContactInfoCard
                icon={Mail}
                title="Email"
                content="support@adoptayoungparent.org"
                subtext="We respond within 24 hours"
              />

              <ContactInfoCard
                icon={MapPin}
                title="Main Office"
                content="123 Main Street, Detroit, MI 48201"
                subtext="By appointment only"
              />

              <ContactInfoCard
                icon={Clock}
                title="Office Hours"
                content="Monday - Friday: 9:00 AM - 5:00 PM"
                subtext="Closed weekends and holidays"
              />
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  Send Us a Message
                </h2>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    <p className="font-semibold">Thank you for contacting us!</p>
                    <p className="text-sm">
                      We've received your message and will respond within 24 hours.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium mb-2"
                      >
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a subject</option>
                        <option value="services">Request Services</option>
                        <option value="volunteer">Volunteer Opportunities</option>
                        <option value="donate">Donation Inquiry</option>
                        <option value="partnership">Partnership</option>
                        <option value="general">General Question</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Locations */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Service Locations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <LocationCard
              city="Detroit"
              address="123 Main Street, Detroit, MI 48201"
              phone="(555) 123-4567"
            />
            <LocationCard
              city="Ann Arbor"
              address="456 University Ave, Ann Arbor, MI 48104"
              phone="(555) 234-5678"
            />
            <LocationCard
              city="Grand Rapids"
              address="789 River Street, Grand Rapids, MI 49503"
              phone="(555) 345-6789"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <FAQItem
              question="How do I access your services?"
              answer="Contact us by phone, email, or this form. We'll schedule an initial assessment to understand your needs and create a personalized support plan."
            />
            <FAQItem
              question="Are your services really free?"
              answer="Yes! All our programs and services are provided at no cost to participants. We're funded through donations and grants."
            />
            <FAQItem
              question="Do I need to live in a specific area?"
              answer="We serve young parents throughout Michigan. While we have offices in Detroit, Ann Arbor, and Grand Rapids, we can connect you with resources wherever you are in the state."
            />
            <FAQItem
              question="How can I volunteer or donate?"
              answer="We welcome volunteers and donors! Visit our Donate page to contribute financially, or contact us to learn about volunteer opportunities."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// Component: Contact Info Card
function ContactInfoCard({
  icon: Icon,
  title,
  content,
  subtext,
}: {
  icon: any;
  title: string;
  content: string;
  subtext: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm font-medium">{content}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </div>
  );
}

// Component: Location Card
function LocationCard({
  city,
  address,
  phone,
}: {
  city: string;
  address: string;
  phone: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">{city}</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span>{address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{phone}</span>
        </div>
      </div>
    </div>
  );
}

// Component: FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
