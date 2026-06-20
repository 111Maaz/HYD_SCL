import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "@/lib/motion";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.webp";
import classroomImg from "@/assets/students-classroom.jpg";
import { AdmissionsCTA } from "@/components/site/AdmissionsCTA";
import { CampusStructure } from "@/components/site/CampusStructure";

import { PrincipalMessage } from "@/components/site/PrincipalMessage";
import { ScrollProgressIndicator } from "@/components/site/ScrollProgressIndicator";
import { StatisticsSection } from "@/components/site/StatisticsSection";
import { StudentDevelopment } from "@/components/site/StudentDevelopment";
import { WhyParentsChoose } from "@/components/site/WhyParentsChoose";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hyderabad School — Academic Excellence & Islamic Values" },
      {
        name: "description",
        content:
          "Hyderabad School blends rigorous academics with timeless Islamic values. Discover our programs, faculty and admissions.",
      },
      { property: "og:title", content: "Hyderabad School" },
      { property: "og:description", content: "Academic Excellence rooted in Islamic Values." },
    ],
  }),
  component: HomePage,
});

const HOME_SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "statistics", label: "Statistics" },
  { id: "why-parents-choose", label: "Why Parents Choose" },
  { id: "principal-message", label: "Principal Message" },
  { id: "campus-structure", label: "Campus Structure" },
  { id: "student-development", label: "Student Development" },
  { id: "faculty-preview", label: "Faculty Preview" },
  { id: "admissions-cta", label: "Admissions CTA" },
] as const;

function HomePage() {
  return (
    <>
      <ScrollProgressIndicator sections={[...HOME_SECTIONS]} />

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-primary-foreground"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-gold" />{" "}
              {SITE.academicYear ? `Admissions open ${SITE.academicYear}` : "Admissions open"}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Where <span className="text-gold">Knowledge</span> meets{" "}
              <span className="text-gold">Iman</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              At Hyderabad School we prepare confident, compassionate scholars — grounded in faith,
              ready for the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admissions"
                className="group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition hover:brightness-110"
              >
                Apply for Admission
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-white/15"
              >
                Discover Our Story
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gold/20 blur-2xl" aria-hidden />
              <img
                src={classroomImg}
                alt="Students learning together"
                width={600}
                height={420}
                className="relative rounded-3xl border border-white/20 shadow-elegant"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <StatisticsSection />
      <WhyParentsChoose />
      <PrincipalMessage />
      <CampusStructure />
      <StudentDevelopment />

      <AdmissionsCTA />
    </>
  );
}
