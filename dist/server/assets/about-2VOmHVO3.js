import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { P as PersonCard } from "./PersonCard-BvHuV0eV.js";
import { Eye, Target, Heart } from "lucide-react";
import { F as FeatureCard } from "./FeatureCard-DQk294RS.js";
import { m as motion, L as LEADERSHIP, a as SCHOOL_HISTORY } from "./router-RRLex1WM.js";
import { f as fetchFacultyMembers, p as pickLeadershipPeople } from "./faculty-Ck1rXykD.js";
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
const milestones = [
  {
    date: "20XX",
    title: "School Founded",
    description: "Hyderabad School opens its doors with a vision of blending academic rigor and Islamic values."
  },
  {
    date: "Month 20XX",
    title: "First Graduating Class",
    description: "Our pioneer batch completes senior secondary, marking a milestone in the school's journey."
  },
  {
    date: "20XX",
    title: "Campus Expansion",
    description: "New blocks and facilities are added to accommodate a growing community of learners."
  },
  {
    date: "20XX",
    title: "Science & Innovation Wing",
    description: "State-of-the-art laboratories and STEM spaces open to support inquiry-based learning."
  },
  {
    date: "Month 20XX",
    title: "Community Recognition",
    description: "The school earns recognition for academic outcomes and holistic student development."
  }
];
function SchoolTimeline() {
  return /* @__PURE__ */ jsx("section", { className: "bg-secondary py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        eyebrow: "Our Journey",
        title: "Milestones that shaped our school",
        subtitle: "A timeline of growth, achievement and community — from our founding to today."
      }
    ),
    /* @__PURE__ */ jsxs("ol", { className: "relative mt-14", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary-glow to-gold sm:left-1/2 sm:-ml-px",
          "aria-hidden": true
        }
      ),
      milestones.map((milestone, i) => /* @__PURE__ */ jsxs(
        motion.li,
        {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.45, delay: i * 0.08 },
          className: `relative flex flex-col gap-4 pb-12 last:pb-0 sm:flex-row sm:gap-8 ${i % 2 === 0 ? "sm:flex-row-reverse" : ""}`,
          children: [
            /* @__PURE__ */ jsx("div", { className: "hidden flex-1 sm:block", "aria-hidden": true }),
            /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-1.5 z-10 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-soft sm:left-1/2 sm:-ml-2" }),
            /* @__PURE__ */ jsxs("div", { className: `flex-1 pl-8 sm:pl-0 ${i % 2 === 0 ? "sm:text-right" : ""}`, children: [
              /* @__PURE__ */ jsx("time", { className: "inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary", children: milestone.date }),
              /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display text-xl font-semibold", children: milestone.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: milestone.description })
            ] })
          ]
        },
        milestone.title
      ))
    ] })
  ] }) });
}
function AboutPage() {
  const {
    data: faculty = LEADERSHIP
  } = useQuery({
    queryKey: ["faculty-members"],
    queryFn: fetchFacultyMembers
  });
  const leadership = pickLeadershipPeople(faculty);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "About Us", title: "A legacy of learning, faith and character", children: "Hyderabad School nurtures students who lead with knowledge and serve with compassion." }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8", children: [
      /* @__PURE__ */ jsx(FeatureCard, { icon: Eye, title: "Our Vision", description: "To be a beacon of holistic education — producing scholars rooted in Islamic values and prepared to thrive in a global society." }),
      /* @__PURE__ */ jsx(FeatureCard, { icon: Target, title: "Our Mission", description: "Deliver world-class academics paired with daily Islamic learning, building confident, ethical and compassionate citizens.", index: 1 }),
      /* @__PURE__ */ jsx(FeatureCard, { icon: Heart, title: "Our Values", description: "Iman (faith), Ilm (knowledge), Adab (manners), Khidma (service) — the four pillars guiding every classroom.", index: 2 })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-secondary py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Leadership", title: "Meet the team behind our school", subtitle: "Educators, scholars and administrators united by a single mission — your child's success." }),
      /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: leadership.map((p, i) => /* @__PURE__ */ jsx(PersonCard, { person: p, index: i }, p.role)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Our Story", title: "From a small classroom to a thriving community" }),
      /* @__PURE__ */ jsx("div", { className: "prose prose-lg mx-auto mt-10 max-w-none text-muted-foreground", children: SCHOOL_HISTORY.map((paragraph, i) => /* @__PURE__ */ jsx("p", { children: paragraph }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx(SchoolTimeline, {})
  ] });
}
export {
  AboutPage as component
};
