import { Calendar, MapPin, Clock, Users, ArrowRight } from "lucide-react";

export default function EventsPage() {
  const upcomingEvents = [
    {
      id: 1,
      title: "Monthly Parent Support Group",
      date: "2024-11-15",
      time: "6:00 PM - 8:00 PM",
      location: "Community Center, Detroit, MI",
      description:
        "Connect with other young parents, share experiences, and build your support network. Light refreshments and childcare provided.",
      category: "Support Group",
      spots: "15 spots available",
      color: "blue",
    },
    {
      id: 2,
      title: "Financial Literacy Workshop",
      date: "2024-11-20",
      time: "10:00 AM - 12:00 PM",
      location: "AAYP Office, Ann Arbor, MI",
      description:
        "Learn budgeting basics, credit building, and financial planning strategies. Materials and resources provided.",
      category: "Workshop",
      spots: "8 spots available",
      color: "green",
    },
    {
      id: 3,
      title: "Holiday Family Fun Day",
      date: "2024-12-10",
      time: "1:00 PM - 4:00 PM",
      location: "Riverside Park, Grand Rapids, MI",
      description:
        "Celebrate the season with games, activities, food, and gifts for families. All ages welcome!",
      category: "Family Event",
      spots: "Open to all",
      color: "purple",
    },
    {
      id: 4,
      title: "Career Development Fair",
      date: "2024-12-15",
      time: "9:00 AM - 3:00 PM",
      location: "Convention Center, Lansing, MI",
      description:
        "Meet employers, learn about job opportunities, and get resume help. Professional attire recommended.",
      category: "Career",
      spots: "50+ employers attending",
      color: "orange",
    },
  ];

  const pastEvents = [
    {
      title: "Back to School Drive",
      date: "August 2024",
      attendees: 120,
      description: "Provided school supplies to 120 families",
    },
    {
      title: "Summer Parenting Workshop Series",
      date: "June-July 2024",
      attendees: 45,
      description: "6-week series on child development and positive discipline",
    },
    {
      title: "Spring Community Picnic",
      date: "May 2024",
      attendees: 200,
      description: "Family fun day with food, games, and community resources",
    },
  ];

  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">Events & Activities</h1>
          <p className="text-xl">
            Join us for workshops, support groups, and family-friendly events
            throughout Michigan
          </p>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-lg text-muted-foreground">
              Mark your calendar and join us for these upcoming opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Event Categories */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Types of Events We Offer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CategoryCard
              title="Support Groups"
              description="Monthly gatherings for connection and peer support"
              icon="👥"
            />
            <CategoryCard
              title="Workshops"
              description="Skill-building sessions on parenting, finance, and career"
              icon="📚"
            />
            <CategoryCard
              title="Family Events"
              description="Fun activities for the whole family to enjoy together"
              icon="🎉"
            />
            <CategoryCard
              title="Community Days"
              description="Large gatherings with resources, food, and activities"
              icon="🏘️"
            />
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Recent Events
          </h2>

          <div className="space-y-6">
            {pastEvents.map((event) => (
              <PastEventCard key={event.title} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-2xl text-center">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get notified about upcoming events, workshops, and opportunities
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Events?</h2>
          <p className="text-lg mb-8 text-white/90">
            Contact us to learn more about upcoming events or to request an event
            in your area
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Us
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>
    </main>
  );
}

// Component: Event Card
function EventCard({ event }: { event: any }) {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    purple: "border-purple-500 bg-purple-50",
    orange: "border-orange-500 bg-orange-50",
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div
        className={`h-2 ${
          colorClasses[event.color as keyof typeof colorClasses]
        }`}
      />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-2">
              {event.category}
            </span>
            <h3 className="text-xl font-bold">{event.title}</h3>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{event.spots}</span>
          </div>
        </div>

        <p className="text-muted-foreground mb-4">{event.description}</p>

        <button className="w-full py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          Register Now
        </button>
      </div>
    </div>
  );
}

// Component: Category Card
function CategoryCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Component: Past Event Card
function PastEventCard({ event }: { event: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-start gap-4">
      <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-1">{event.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{event.date}</p>
        <p className="text-sm">{event.description}</p>
        <p className="text-sm font-semibold text-primary mt-2">
          {event.attendees} attendees
        </p>
      </div>
    </div>
  );
}
