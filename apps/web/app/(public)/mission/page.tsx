import { Heart, Users, Target, TrendingUp } from "lucide-react";

export default function MissionPage() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">Our Mission</h1>
          <p className="text-xl">
            Empowering young parents to build strong, healthy families through
            comprehensive support and community engagement.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl leading-relaxed mb-6">
              ADOPT A YOUNG PARENT is dedicated to providing comprehensive support
              to young parents across Michigan. We believe that every young parent
              deserves access to the resources, education, and community they need
              to thrive.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Through our programs, we address the unique challenges faced by young
              families, including financial stability, educational opportunities,
              parenting skills, and emotional support. Our holistic approach ensures
              that both parents and children receive the care and attention they
              deserve.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compassion</h3>
              <p className="text-muted-foreground">
                We approach every family with empathy, understanding, and respect.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <p className="text-muted-foreground">
                We build strong networks of support for young families.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Empowerment</h3>
              <p className="text-muted-foreground">
                We equip parents with the tools and confidence to succeed.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Growth</h3>
              <p className="text-muted-foreground">
                We foster continuous learning and development for all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">Our Vision</h2>
          <div className="bg-primary/5 rounded-lg p-8">
            <p className="text-xl text-center leading-relaxed">
              We envision a Michigan where every young parent has the support,
              resources, and opportunities they need to build thriving families and
              contribute meaningfully to their communities.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Areas of Impact</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Education & Career Development</h3>
              <p className="text-muted-foreground">
                Helping young parents complete their education and develop career
                skills for long-term financial stability.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Parenting Support</h3>
              <p className="text-muted-foreground">
                Providing evidence-based parenting education and resources to help
                families thrive.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Financial Assistance</h3>
              <p className="text-muted-foreground">
                Offering emergency financial support and financial literacy training
                to build economic resilience.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Mental Health & Wellness</h3>
              <p className="text-muted-foreground">
                Connecting families with mental health resources and creating
                supportive communities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
