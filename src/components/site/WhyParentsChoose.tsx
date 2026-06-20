import { Award, Building2, Heart, ShieldCheck, Sparkles, Users } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { FeatureCard } from "@/components/site/FeatureCard";

const features = [
  {
    icon: Award,
    title: "Academic Excellence",
    description:
      "A rigorous SSC curriculum with expert faculty, strong outcomes and a culture of intellectual curiosity.",
  },
  {
    icon: Building2,
    title: "Separate Learning Spaces",
    description:
      "Purpose-built classrooms, labs and activity zones designed for focused learning at every age group.",
  },
  {
    icon: Heart,
    title: "Islamic Values",
    description:
      "Quran, Hadith and Akhlaq lessons that shape character and inspire purposeful living.",
  },
  {
    icon: Users,
    title: "Character Development",
    description:
      "Leadership programmes, mentorship and service learning that build integrity, empathy and resilience.",
  },
  {
    icon: ShieldCheck,
    title: "Safe Environment",
    description:
      "A secure, nurturing campus with CCTV monitoring, trained support staff and clear safeguarding policies.",
  },
  {
    icon: Sparkles,
    title: "Holistic Growth",
    description:
      "Sports, arts, debate, science clubs and Quran competitions nurturing mind, body and spirit.",
  },
];

export function WhyParentsChoose() {
  return (
    <section id="why-parents-choose" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why Parents Choose"
          title="A complete education for heart and mind"
          subtitle="We blend academic rigor with Islamic ethics, raising students who excel and serve."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
