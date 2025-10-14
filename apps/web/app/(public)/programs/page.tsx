import { BookOpen, Users, Heart, Home, Briefcase, GraduationCap } from "lucide-react";

export default function ProgramsPage() {
  const programs = [
    {
      icon: GraduationCap,
      title: "Education Support",
      description: "Help young parents complete their education and develop career skills",
      features: [
        "GED preparation and tutoring",
        "College application assistance",
        "Scholarship opportunities",
        "Career counseling and job placement",
      ],
      color: "blue",
    },
    {
      icon: Users,
      title: "Parenting Education",
      description: "Evidence-based parenting classes and support groups",
      features: [
        "Infant and child development workshops",
        "Positive discipline techniques",
        "Health and nutrition guidance",
        "Parent support groups",
      ],
      color: "green",
    },
    {
      icon: Briefcase,
      title: "Financial Literacy",
      description: "Build financial skills and economic resilience",
      features: [
        "Budgeting and money management",
        "Credit building workshops",
        "Emergency financial assistance",
        "Savings programs",
      ],
      color: "purple",
    },
    {
      icon: Heart,
      title: "Mental Health & Wellness",
      description: "Comprehensive mental health support for families",
      features: [
        "Individual counseling referrals",
        "Stress management workshops",
        "Peer support networks",
        "Crisis intervention services",
      ],
      color: "pink",
    },
    {
      icon: Home,
      title: "Housing Assistance",
      description: "Help families find and maintain stable housing",
      features: [
        "Housing search assistance",
        "Rental assistance programs",
        "Landlord mediation",
        "Home safety resources",
      ],
      color: "orange",
    },
    {
      icon: BookOpen,
      title: "Resource Navigation",
      description: "Connect families with community resources",
      features: [
        "Benefits enrollment assistance",
        "Healthcare navigation",
        "Childcare referrals",
        "Legal aid connections",
      ],
      color: "teal",
    },
  ];

  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">Our Programs</h1>
          <p className="text-xl">
            Comprehensive support services designed to help young parents and
            their families thrive
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Six Core Programs for Family Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each program is designed to address the unique challenges faced by
              young parents, providing holistic support for the entire family.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <ProgramCard key={program.title} program={program} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <Step
              number={1}
              title="Initial Assessment"
              description="We meet with you to understand your unique situation, goals, and needs."
            />
            <Step
              number={2}
              title="Personalized Plan"
              description="Together, we create a customized support plan that addresses your priorities."
            />
            <Step
              number={3}
              title="Ongoing Support"
              description="Access our programs and services with dedicated support from our team."
            />
            <Step
              number={4}
              title="Track Progress"
              description="Regular check-ins help us celebrate successes and adjust support as needed."
            />
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">
              Who Can Participate?
            </h2>
            <div className="space-y-3 text-blue-800">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Young parents (under 25) living in Michigan</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Pregnant individuals planning to parent</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Parents of children under 5 years old</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>All services are free of charge</span>
              </p>
            </div>
            <div className="mt-6">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started Today
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories CTA */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">See Our Impact</h2>
          <p className="text-lg mb-8 text-white/90">
            Read stories from families who have transformed their lives through
            our programs
          </p>
          <a
            href="/impact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Impact Stories
          </a>
        </div>
      </section>
    </main>
  );
}

// Component: Program Card
function ProgramCard({ program }: { program: any }) {
  const Icon = program.icon;
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    pink: "bg-pink-100 text-pink-600",
    orange: "bg-orange-100 text-orange-600",
    teal: "bg-teal-100 text-teal-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div
        className={`w-16 h-16 rounded-lg ${
          colorClasses[program.color as keyof typeof colorClasses]
        } flex items-center justify-center mb-4`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">{program.title}</h3>
      <p className="text-muted-foreground mb-4">{program.description}</p>
      <ul className="space-y-2">
        {program.features.map((feature: string) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span className="text-primary mt-0.5">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Step
function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
