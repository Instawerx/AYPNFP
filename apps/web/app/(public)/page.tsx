import Link from "next/link";
import { ArrowRight, Heart, Users, TrendingUp, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 md:text-6xl">
              Empowering Young Parents
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto md:text-2xl">
              Supporting young families in Michigan through comprehensive programs,
              resources, and community engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors focus-visible-ring"
              >
                Donate Now
                <Heart className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors focus-visible-ring"
              >
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-4xl font-bold mb-2">500+</h3>
              <p className="text-muted-foreground">Families Supported</p>
            </div>
            <div className="p-6">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-4xl font-bold mb-2">$250K+</h3>
              <p className="text-muted-foreground">Raised This Year</p>
            </div>
            <div className="p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-4xl font-bold mb-2">100%</h3>
              <p className="text-muted-foreground">Transparent Operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-8">
            ADOPT A YOUNG PARENT is dedicated to providing comprehensive support
            to young parents in Michigan. We believe every young parent deserves
            access to resources, education, and a supportive community to help
            them thrive.
          </p>
          <Link
            href="/mission"
            className="inline-flex items-center text-primary font-semibold hover:underline focus-visible-ring"
          >
            Read Our Full Mission
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Make a Difference Today</h2>
          <p className="text-lg mb-8">
            Your donation helps us provide essential support to young families
            across Michigan. Every contribution makes a real impact.
          </p>
          <Link
            href="/donate"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors focus-visible-ring"
          >
            Support Our Mission
            <Heart className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted text-center text-sm text-muted-foreground">
        <div className="container mx-auto max-w-6xl">
          <p className="mb-2">
            ADOPT A YOUNG PARENT is registered to solicit contributions in Michigan.
          </p>
          <p className="mb-2">
            State Entity ID: 803297893 • Filing Effective: Nov 19, 2024
          </p>
          <p>
            © {new Date().getFullYear()} ADOPT A YOUNG PARENT. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
