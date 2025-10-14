import { TrendingUp, Users, GraduationCap, Home, Heart, DollarSign } from "lucide-react";

export default function ImpactPage() {
  const metrics = [
    {
      icon: Users,
      value: "500+",
      label: "Families Served",
      description: "Young parents supported since our founding",
    },
    {
      icon: GraduationCap,
      value: "85%",
      label: "Education Success",
      description: "Participants who completed their education goals",
    },
    {
      icon: Home,
      value: "92%",
      label: "Housing Stability",
      description: "Families maintaining stable housing after 1 year",
    },
    {
      icon: DollarSign,
      value: "$2.5M",
      label: "Resources Provided",
      description: "In direct assistance and services",
    },
  ];

  const stories = [
    {
      name: "Maria's Story",
      age: 22,
      quote:
        "AAYP helped me finish my GED and get into community college. Now I'm studying to become a nurse and can provide a better future for my daughter.",
      outcome: "Completed GED, enrolled in nursing program",
      image: "👩‍🎓",
    },
    {
      name: "James's Journey",
      age: 24,
      quote:
        "The financial literacy program taught me how to budget and save. I was able to move my family into a safe apartment and start building credit.",
      outcome: "Secured stable housing, improved credit score",
      image: "👨‍💼",
    },
    {
      name: "Destiny's Progress",
      age: 21,
      quote:
        "The parenting classes gave me confidence and skills I never learned growing up. My son is thriving, and I feel like a capable parent.",
      outcome: "Completed parenting program, strong parent-child bond",
      image: "👩‍👦",
    },
  ];

  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">Our Impact</h1>
          <p className="text-xl">
            Real stories, measurable outcomes, and lasting change for young
            families in Michigan
          </p>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">By the Numbers</h2>
            <p className="text-lg text-muted-foreground">
              Measuring our impact through data and outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground">
              Meet some of the amazing young parents we've had the privilege to
              support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story) => (
              <StoryCard key={story.name} story={story} />
            ))}
          </div>
        </div>
      </section>

      {/* Program Outcomes */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Program Outcomes
          </h2>

          <div className="space-y-6">
            <OutcomeBar
              label="Participants who report increased confidence in parenting"
              percentage={94}
              color="blue"
            />
            <OutcomeBar
              label="Families who achieve financial stability within 2 years"
              percentage={78}
              color="green"
            />
            <OutcomeBar
              label="Parents who secure employment or advance their education"
              percentage={85}
              color="purple"
            />
            <OutcomeBar
              label="Participants who report improved mental health"
              percentage={88}
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* Long-term Impact */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">
            Long-Term Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Breaking the Cycle
              </h3>
              <p className="text-muted-foreground">
                Children of parents who complete our programs are 3x more likely
                to graduate high school and pursue higher education, breaking
                cycles of poverty.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                Community Ripple Effect
              </h3>
              <p className="text-muted-foreground">
                Families we support become community leaders, with 65% giving
                back through volunteering and mentoring other young parents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Be Part of Our Impact</h2>
          <p className="text-lg mb-8 text-white/90">
            Your support helps us continue changing lives and strengthening
            families
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/donate"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Donate Now
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Get Involved
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// Component: Metric Card
function MetricCard({ metric }: { metric: any }) {
  const Icon = metric.icon;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div className="text-4xl font-bold text-primary mb-2">{metric.value}</div>
      <h3 className="text-lg font-bold mb-2">{metric.label}</h3>
      <p className="text-sm text-muted-foreground">{metric.description}</p>
    </div>
  );
}

// Component: Story Card
function StoryCard({ story }: { story: any }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-6xl mb-4 text-center">{story.image}</div>
      <h3 className="text-xl font-bold mb-2">
        {story.name}, {story.age}
      </h3>
      <blockquote className="text-muted-foreground italic mb-4 border-l-4 border-primary pl-4">
        "{story.quote}"
      </blockquote>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm font-semibold text-green-800">Outcome:</p>
        <p className="text-sm text-green-700">{story.outcome}</p>
      </div>
    </div>
  );
}

// Component: Outcome Bar
function OutcomeBar({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    pink: "bg-pink-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-primary">{percentage}%</span>
      </div>
      <div className="bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-1000 ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
