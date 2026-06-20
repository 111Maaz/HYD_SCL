import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeader } from "@/components/site/SectionHeader";
import { PersonCard } from "@/components/site/PersonCard";
import { Target, Eye, Heart } from "lucide-react";
import { FeatureCard } from "@/components/site/FeatureCard";
import { SchoolTimeline } from "@/components/site/SchoolTimeline";
import { LEADERSHIP, SCHOOL_HISTORY } from "@/lib/site";
import { fetchFacultyMembers, pickLeadershipPeople } from "@/services/faculty";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Hyderabad School" },
      {
        name: "description",
        content:
          "Discover the vision, mission and leadership of Hyderabad School — where academic excellence meets Islamic values.",
      },
      { property: "og:title", content: "About Hyderabad School" },
      {
        property: "og:description",
        content: "Our vision, mission and the leaders shaping our community.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: faculty = LEADERSHIP } = useQuery({
    queryKey: ["faculty-members"],
    queryFn: fetchFacultyMembers,
  });
  const leadership = pickLeadershipPeople(faculty);

  return (
    <>
      <PageHero eyebrow="About Us" title="A legacy of learning, faith and character">
        Hyderabad School nurtures students who lead with knowledge and serve with compassion.
      </PageHero>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <FeatureCard
            icon={Eye}
            title="Our Vision"
            description="To be a beacon of holistic education — producing scholars rooted in Islamic values and prepared to thrive in a global society."
          />
          <FeatureCard
            icon={Target}
            title="Our Mission"
            description="Deliver world-class academics paired with daily Islamic learning, building confident, ethical and compassionate citizens."
            index={1}
          />
          <FeatureCard
            icon={Heart}
            title="Our Values"
            description="Iman (faith), Ilm (knowledge), Adab (manners), Khidma (service) — the four pillars guiding every classroom."
            index={2}
          />
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Leadership"
            title="Meet the team behind our school"
            subtitle="Educators, scholars and administrators united by a single mission — your child's success."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((p, i) => (
              <PersonCard key={p.role} person={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Our Story"
            title="From a small classroom to a thriving community"
          />
          <div className="prose prose-lg mx-auto mt-10 max-w-none text-muted-foreground">
            {SCHOOL_HISTORY.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <SchoolTimeline />
    </>
  );
}
