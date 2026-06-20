import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { P as PersonCard } from "./PersonCard-BvHuV0eV.js";
import { m as motion } from "./router-RRLex1WM.js";
import { Calculator, FlaskConical, Languages, BookOpen, Palette, Trophy, Loader2, AlertCircle } from "lucide-react";
import { F as FeatureCard } from "./FeatureCard-DQk294RS.js";
import { f as fetchFacultyMembers } from "./faculty-Ck1rXykD.js";
import "@tanstack/react-router";
import "react";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
const programs = [{
  level: "Pre-Primary",
  grade: "Nursery – KG",
  focus: "Play-based learning, motor skills, foundational Arabic letters."
}, {
  level: "Primary",
  grade: "Class 1 – 5",
  focus: "Strong literacy & numeracy with Quran memorization and ethics."
}, {
  level: "Middle School",
  grade: "Class 6 – 8",
  focus: "Inquiry-based STEM, languages, Islamic history and project work."
}, {
  level: "Senior Secondary",
  grade: "Class 9 – 10",
  focus: "SSC streams — Science, Commerce, Humanities — with career mentoring."
}];
const subjects = [{
  icon: Calculator,
  title: "Mathematics & STEM",
  description: "From basic numeracy to AP-level calculus, fostering analytical minds."
}, {
  icon: FlaskConical,
  title: "Sciences",
  description: "Hands-on biology, chemistry and physics in fully equipped labs."
}, {
  icon: Languages,
  title: "Languages",
  description: "English, Arabic, Urdu, Hindi and French — multilingual fluency."
}, {
  icon: BookOpen,
  title: "Humanities",
  description: "History, geography, economics and global citizenship."
}, {
  icon: Palette,
  title: "Arts & Design",
  description: "Drawing, calligraphy, music appreciation and digital design."
}, {
  icon: Trophy,
  title: "Physical Education",
  description: "Football, cricket, athletics, taekwondo and team sports."
}];
function AcademicsPage() {
  const {
    data: faculty = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["faculty-members"],
    queryFn: fetchFacultyMembers
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Academics", title: "A curriculum that challenges and inspires", children: "From early years to senior secondary, our SSC-aligned programs build deep understanding, critical thinking and lifelong curiosity." }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Programs", title: "Every stage, thoughtfully designed" }),
      /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: programs.map((p, i) => /* @__PURE__ */ jsxs(motion.div, { initial: {
        opacity: 0,
        y: 24
      }, whileInView: {
        opacity: 1,
        y: 0
      }, viewport: {
        once: true,
        margin: "-60px"
      }, transition: {
        delay: i * 0.08
      }, className: "rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-xs uppercase tracking-widest text-gold", children: p.grade }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-2xl font-bold text-primary", children: p.level }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: p.focus })
      ] }, p.level)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-secondary py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Subjects", title: "A broad, balanced learning experience" }),
      /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: subjects.map((s, i) => /* @__PURE__ */ jsx(FeatureCard, { ...s, index: i }, s.title)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Our Faculty", title: "Meet the educators who make it possible", subtitle: "Passionate, qualified and deeply committed to every student's success." }),
      isLoading && /* @__PURE__ */ jsxs("div", { className: "mt-14 flex items-center justify-center gap-2 py-16 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin", "aria-hidden": true }),
        /* @__PURE__ */ jsx("span", { children: "Loading faculty…" })
      ] }),
      isError && /* @__PURE__ */ jsxs("div", { role: "alert", className: "mt-14 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 shrink-0", "aria-hidden": true }),
        /* @__PURE__ */ jsx("p", { children: error instanceof Error ? error.message : "Failed to load faculty members." })
      ] }),
      !isLoading && !isError && /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: faculty.map((f, i) => /* @__PURE__ */ jsx(PersonCard, { person: f, index: i }, `${f.role}-${i}`)) })
    ] }) })
  ] });
}
export {
  AcademicsPage as component
};
