import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { m as motion, L as LEADERSHIP, c as cn, H as HOME_STATS, S as SITE } from "./router-RRLex1WM.js";
import { Users, ArrowRight, Building2, Quote, MessageCircle, Sparkles, Shield, TrendingUp, Award, Heart, ShieldCheck } from "lucide-react";
import { h as heroImg, c as classroomImg } from "./hero-BXYLLuMB.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { useState, useEffect } from "react";
import { F as FeatureCard } from "./FeatureCard-DQk294RS.js";
import "@tanstack/react-query";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
function AdmissionsCTA() {
  return /* @__PURE__ */ jsx("section", { id: "admissions-cta", className: "py-20 sm:py-28", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-10 text-primary-foreground shadow-elegant sm:p-14", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pattern-islamic opacity-25", "aria-hidden": true }),
    /* @__PURE__ */ jsxs("div", { className: "relative grid items-center gap-8 md:grid-cols-[1fr_auto]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Users, { className: "h-10 w-10 text-gold" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 font-display text-3xl font-bold sm:text-4xl", children: "Join the Hyderabad School family" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-xl text-primary-foreground/85", children: "Limited seats for the new academic session. Submit an enquiry today and our admissions team will reach out within 24 hours." })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/admissions",
          className: "inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-semibold text-gold-foreground shadow-gold transition hover:brightness-110",
          children: [
            "Start Enquiry ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] })
  ] }) }) });
}
const boysBlockImg = "/assets/Boys%20Block-CCrJ7g5G.png";
const girlsBlockImg = "/assets/Girls%20Block-DXCCb-eL.png";
const kgBlockImg = "/assets/KG%20Block-BZJsg3-k.png";
const blocks = [
  {
    title: "Boys Block",
    image: boysBlockImg,
    imageFit: "contain",
    description: "Dedicated classrooms, labs and activity spaces designed for focused learning in a structured, supportive environment."
  },
  {
    title: "Girls Block",
    image: girlsBlockImg,
    imageFit: "contain",
    description: "Purpose-built facilities with modern amenities, ensuring comfort, safety and academic excellence for every student."
  },
  {
    title: "KG Block",
    image: kgBlockImg,
    imageFit: "cover",
    description: "A vibrant early-years wing with play areas, sensory learning zones and nurturing spaces for our youngest learners."
  }
];
function CampusStructure() {
  return /* @__PURE__ */ jsx("section", { id: "campus-structure", className: "bg-background py-20 sm:py-28", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        eyebrow: "Campus Structure",
        title: "Spaces built for every learner",
        subtitle: "Separate, purpose-designed blocks that provide the right environment at every stage of growth."
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-8 md:grid-cols-3", children: blocks.map((block, i) => /* @__PURE__ */ jsxs(
      motion.article,
      {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.45, delay: i * 0.08 },
        whileHover: { y: -4 },
        className: "group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-elegant",
        children: [
          /* @__PURE__ */ jsx("div", { className: "relative aspect-[4/3] overflow-hidden bg-muted", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: block.image,
              alt: block.title,
              loading: "lazy",
              className: "h-full w-full object-cover transition duration-700 group-hover:scale-105"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft", children: /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-semibold", children: block.title })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: block.description })
          ] })
        ]
      },
      block.title
    )) })
  ] }) });
}
const principal = LEADERSHIP[0];
function PrincipalMessage() {
  return /* @__PURE__ */ jsx("section", { id: "principal-message", className: "bg-secondary py-20 sm:py-28", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        eyebrow: "Principal's Message",
        title: "A word from our leadership",
        subtitle: "Guiding every student with wisdom, care and a shared commitment to excellence."
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.5 },
        className: "relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-elegant",
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary via-primary-glow to-gold",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative grid gap-8 p-8 sm:p-10 md:grid-cols-[auto_1fr] md:items-start md:gap-10", children: [
            /* @__PURE__ */ jsx("div", { className: "mx-auto shrink-0 md:mx-0", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute -inset-2 rounded-2xl bg-gold/20 blur-lg", "aria-hidden": true }),
              /* @__PURE__ */ jsx("div", { className: "relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-primary to-primary-glow shadow-soft sm:h-44 sm:w-44", children: /* @__PURE__ */ jsx("span", { className: "grid h-full w-full place-items-center font-display text-4xl font-bold text-primary-foreground", children: principal.initials }) })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Quote, { className: "h-8 w-8 text-gold", "aria-hidden": true }),
              /* @__PURE__ */ jsx("blockquote", { className: "mt-4 font-display text-xl italic leading-relaxed text-foreground sm:text-2xl", children: principal.bio || "At Hyderabad School, we believe every child deserves an education that nurtures both academic achievement and strong moral character. Our mission is to raise confident scholars who serve their families, communities and faith with excellence." }),
              /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t border-border pt-6", children: [
                /* @__PURE__ */ jsx("p", { className: "font-display text-lg font-semibold text-foreground", children: principal.name || "Abdul Raqeeb" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium text-primary", children: principal.role })
              ] })
            ] })
          ] })
        ]
      }
    )
  ] }) });
}
function ScrollProgressIndicator({ sections }) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const elements = sections.map((s) => document.getElementById(s.id)).filter((el) => el !== null);
    if (elements.length === 0) return;
    const ratios = /* @__PURE__ */ new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        sections.forEach((section, index) => {
          const ratio = ratios.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        setActiveIndex(bestIndex);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: "-20% 0px -20% 0px" }
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return /* @__PURE__ */ jsx(
    "nav",
    {
      className: "fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center lg:flex",
      "aria-label": "Page sections",
      children: /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-1.5 py-3 shadow-soft backdrop-blur-sm", children: sections.map((section, index) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => scrollTo(section.id),
          className: "group flex items-center justify-center p-0.5",
          "aria-label": section.label,
          "aria-current": activeIndex === index ? "true" : void 0,
          children: /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "block w-px rounded-full transition-all duration-300",
                activeIndex === index ? "h-8 bg-gold shadow-gold" : "h-5 bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
              )
            }
          )
        },
        section.id
      )) })
    }
  );
}
function StatisticsSection() {
  return /* @__PURE__ */ jsx("section", { id: "statistics", className: "bg-primary py-12 sm:py-16", children: /* @__PURE__ */ jsx("div", { className: "mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6 lg:px-8", children: HOME_STATS.map((s, i) => /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { delay: i * 0.08 },
      className: "text-center text-primary-foreground",
      children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-3xl font-bold text-gold sm:text-4xl", children: s.value }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs uppercase tracking-widest text-primary-foreground/80", children: s.label })
      ]
    },
    s.label
  )) }) });
}
const pillars = [
  {
    icon: Users,
    title: "Leadership",
    description: "Student councils, house captains and service projects that cultivate initiative and responsible decision-making."
  },
  {
    icon: MessageCircle,
    title: "Communication Skills",
    description: "Debates, presentations and collaborative learning that build clarity, confidence and articulate expression."
  },
  {
    icon: Sparkles,
    title: "Confidence Building",
    description: "Stage performances, competitions and mentorship that help every child discover and express their strengths."
  },
  {
    icon: Shield,
    title: "Discipline",
    description: "Structured routines, accountability and self-regulation that prepare students for academic and personal success."
  },
  {
    icon: TrendingUp,
    title: "Moral Development",
    description: "Daily Islamic ethics, character lessons and community service that shape integrity, empathy and purpose."
  },
  {
    icon: Award,
    title: "Academic Excellence",
    description: "Rigorous curriculum, expert faculty and a culture of inquiry that drives outstanding learning outcomes."
  }
];
function StudentDevelopment() {
  return /* @__PURE__ */ jsx("section", { id: "student-development", className: "bg-secondary py-20 sm:py-28", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        eyebrow: "Student Development",
        title: "Growing the whole child",
        subtitle: "Beyond textbooks — we nurture the qualities that shape confident, ethical and capable young leaders."
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: pillars.map((pillar, i) => /* @__PURE__ */ jsx(FeatureCard, { ...pillar, index: i }, pillar.title)) })
  ] }) });
}
const features = [
  {
    icon: Award,
    title: "Academic Excellence",
    description: "A rigorous SSC curriculum with expert faculty, strong outcomes and a culture of intellectual curiosity."
  },
  {
    icon: Building2,
    title: "Separate Learning Spaces",
    description: "Purpose-built classrooms, labs and activity zones designed for focused learning at every age group."
  },
  {
    icon: Heart,
    title: "Islamic Values",
    description: "Daily Quran, Hadith and Akhlaq lessons that shape character and inspire purposeful living."
  },
  {
    icon: Users,
    title: "Character Development",
    description: "Leadership programmes, mentorship and service learning that build integrity, empathy and resilience."
  },
  {
    icon: ShieldCheck,
    title: "Safe Environment",
    description: "A secure, nurturing campus with CCTV monitoring, trained support staff and clear safeguarding policies."
  },
  {
    icon: Sparkles,
    title: "Holistic Growth",
    description: "Sports, arts, debate, science clubs and Quran competitions nurturing mind, body and spirit."
  }
];
function WhyParentsChoose() {
  return /* @__PURE__ */ jsx("section", { id: "why-parents-choose", className: "bg-background py-20 sm:py-28", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        eyebrow: "Why Parents Choose",
        title: "A complete education for heart and mind",
        subtitle: "We blend academic rigor with Islamic ethics, raising students who excel and serve."
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: features.map((f, i) => /* @__PURE__ */ jsx(FeatureCard, { ...f, index: i }, f.title)) })
  ] }) });
}
const HOME_SECTIONS = [{
  id: "hero",
  label: "Hero"
}, {
  id: "statistics",
  label: "Statistics"
}, {
  id: "why-parents-choose",
  label: "Why Parents Choose"
}, {
  id: "principal-message",
  label: "Principal Message"
}, {
  id: "campus-structure",
  label: "Campus Structure"
}, {
  id: "student-development",
  label: "Student Development"
}, {
  id: "faculty-preview",
  label: "Faculty Preview"
}, {
  id: "admissions-cta",
  label: "Admissions CTA"
}];
function HomePage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ScrollProgressIndicator, { sections: [...HOME_SECTIONS] }),
    /* @__PURE__ */ jsxs("section", { id: "hero", className: "relative overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
        /* @__PURE__ */ jsx("img", { src: heroImg, alt: "", className: "h-full w-full object-cover" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-hero" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8 lg:py-40", children: [
        /* @__PURE__ */ jsxs(motion.div, { initial: {
          opacity: 0,
          y: 24
        }, animate: {
          opacity: 1,
          y: 0
        }, transition: {
          duration: 0.6
        }, className: "text-primary-foreground", children: [
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3 text-gold" }),
            " ",
            `Admissions open ${SITE.academicYear}`
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl", children: [
            "Where ",
            /* @__PURE__ */ jsx("span", { className: "text-gold", children: "Knowledge" }),
            " meets",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-gold", children: "Iman" }),
            "."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-xl text-lg text-primary-foreground/85", children: "At Hyderabad School we prepare confident, compassionate scholars — grounded in faith, ready for the world." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxs(Link, { to: "/admissions", className: "group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition hover:brightness-110", children: [
              "Apply for Admission",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
            ] }),
            /* @__PURE__ */ jsx(Link, { to: "/about", className: "inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-white/15", children: "Discover Our Story" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(motion.div, { initial: {
          opacity: 0,
          scale: 0.95
        }, animate: {
          opacity: 1,
          scale: 1
        }, transition: {
          duration: 0.7,
          delay: 0.2
        }, className: "hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -inset-4 rounded-3xl bg-gold/20 blur-2xl", "aria-hidden": true }),
          /* @__PURE__ */ jsx("img", { src: classroomImg, alt: "Students learning together", width: 600, height: 420, className: "relative rounded-3xl border border-white/20 shadow-elegant" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(StatisticsSection, {}),
    /* @__PURE__ */ jsx(WhyParentsChoose, {}),
    /* @__PURE__ */ jsx(PrincipalMessage, {}),
    /* @__PURE__ */ jsx(CampusStructure, {}),
    /* @__PURE__ */ jsx(StudentDevelopment, {}),
    /* @__PURE__ */ jsx(AdmissionsCTA, {})
  ] });
}
export {
  HomePage as component
};
