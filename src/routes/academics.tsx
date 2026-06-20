import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeader } from "@/components/site/SectionHeader";
import { PersonCard } from "@/components/site/PersonCard";
import { motion } from "@/lib/motion";
import {
  AlertCircle,
  BookOpen,
  FlaskConical,
  Calculator,
  Languages,
  Palette,
  Trophy,
  Loader2,
} from "lucide-react";
import { FeatureCard } from "@/components/site/FeatureCard";
import { fetchFacultyMembers } from "@/services/faculty";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Hyderabad School" },
      {
        name: "description",
        content:
          "Explore our SSC-aligned curriculum from pre-primary to senior secondary, plus faculty showcase.",
      },
      { property: "og:title", content: "Academics at Hyderabad School" },
      {
        property: "og:description",
        content: "Curriculum, programs and faculty shaping tomorrow's leaders.",
      },
    ],
  }),
  component: AcademicsPage,
});

const programs = [
  {
    level: "Pre-Primary",
    grade: "Nursery – KG",
    focus: "Play-based learning, motor skills, foundational letters.",
  },
  {
    level: "Primary",
    grade: "Class 1 – 5",
    focus: "Strong literacy and numeracy skills alongside studies, moral values, and character development.",
  },
  {
    level: "Middle School",
    grade: "Class 6 – 8",
    focus: "Inquiry-based STEM, languages, history and project work.",
  },
  {
    level: "Senior Secondary",
    grade: "Class 9 – 10",
    focus: "SSC streams — Science, Commerce, Humanities — with career mentoring.",
  },
];

const subjects = [
  {
    icon: Calculator,
    title: "Mathematics & STEM",
    description: "From basic numeracy to AP-level calculus, fostering analytical minds.",
  },
  {
    icon: FlaskConical,
    title: "Sciences",
    description: "Hands-on biology, chemistry and physics in fully equipped labs.",
  },
  {
    icon: Languages,
    title: "Languages",
    description: "English, Arabic, Urdu, Hindi — multilingual fluency.",
  },
  {
    icon: BookOpen,
    title: "Humanities",
    description: "History, geography, economics and global citizenship.",
  },
  {
    icon: Palette,
    title: "Arts & Design",
    description: "Drawing, calligraphy, music appreciation and digital design.",
  },
  {
    icon: Trophy,
    title: "Physical Education",
    description: "Football, cricket, athletics, taekwondo and team sports.",
  },
];

function AcademicsPage() {
  const {
    data: faculty = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["faculty-members"],
    queryFn: fetchFacultyMembers,
  });

  return (
    <>
      <PageHero eyebrow="Academics" title="A curriculum that challenges and inspires">
        From early years to senior secondary, our SSC-aligned programs build deep understanding,
        critical thinking and lifelong curiosity.
      </PageHero>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Programs" title="Every stage, thoughtfully designed" />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {programs.map((p, i) => (
              <motion.div
                key={p.level}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant"
              >
                <div className="font-display text-xs uppercase tracking-widest text-gold">
                  {p.grade}
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-primary">{p.level}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{p.focus}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Subjects" title="A broad, balanced learning experience" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s, i) => (
              <FeatureCard key={s.title} {...s} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Our Faculty"
            title="Meet the educators who make it possible"
            subtitle="Passionate, qualified and deeply committed to every student's success."
          />

          {isLoading && (
            <div className="mt-14 flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Loading faculty…</span>
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="mt-14 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>{error instanceof Error ? error.message : "Failed to load faculty members."}</p>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {faculty.map((f, i) => (
                <PersonCard key={`${f.role}-${i}`} person={f} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
