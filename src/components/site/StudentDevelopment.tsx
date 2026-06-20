import { Award, MessageCircle, Shield, Sparkles, TrendingUp, Users } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { FeatureCard } from "@/components/site/FeatureCard";

const pillars = [
  {
    icon: Users,
    title: "Leadership",
    description:
      "Student councils, house captains and service projects that cultivate initiative and responsible decision-making.",
  },
  {
    icon: MessageCircle,
    title: "Communication Skills",
    description:
      "Debates, presentations and collaborative learning that build clarity, confidence and articulate expression.",
  },
  {
    icon: Sparkles,
    title: "Confidence Building",
    description:
      "Stage performances, competitions and mentorship that help every child discover and express their strengths.",
  },
  {
    icon: Shield,
    title: "Discipline",
    description:
      "Structured routines, accountability and self-regulation that prepare students for academic and personal success.",
  },
  {
    icon: TrendingUp,
    title: "Moral Development",
    description:
      "Daily Islamic ethics, character lessons and community service that shape integrity, empathy and purpose.",
  },
  {
    icon: Award,
    title: "Academic Excellence",
    description:
      "Rigorous curriculum, expert faculty and a culture of inquiry that drives outstanding learning outcomes.",
  },
];

export function StudentDevelopment() {
  return (
    <section id="student-development" className="bg-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Student Development"
          title="Growing the whole child"
          subtitle="Beyond textbooks — we nurture the qualities that shape confident, ethical and capable young leaders."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, i) => (
            <FeatureCard key={pillar.title} {...pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
