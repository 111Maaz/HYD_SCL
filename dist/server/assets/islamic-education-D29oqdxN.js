import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { m as motion } from "./router-RRLex1WM.js";
import { BookOpen, Moon, HandHeart, GraduationCap, Sun, Sparkles, Heart, Users, School } from "lucide-react";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { F as FeatureCard } from "./FeatureCard-DQk294RS.js";
import { p as prayer } from "./prayer-hall-BRon0RJX.js";
import "@tanstack/react-query";
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
const pillars = [
  {
    icon: BookOpen,
    title: "Quran",
    description: "Structured Hifz, Tajweed and Tafseer programs that connect students to the Book of Allah with understanding and reverence."
  },
  {
    icon: Moon,
    title: "Salah",
    description: "Daily congregational prayers on campus, wudu facilities and age-appropriate instruction in the pillars of worship."
  },
  {
    icon: HandHeart,
    title: "Akhlaq",
    description: "Daily lessons in manners, honesty and compassion — shaping character that reflects the prophetic example in every interaction."
  },
  {
    icon: GraduationCap,
    title: "Ilm",
    description: "Islamic sciences, Arabic language and scholarly tradition woven alongside modern academics for well-rounded seekers of knowledge."
  }
];
const dailyDuas = [
  {
    icon: Sun,
    title: "Morning Dua",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
    transliteration: "Asbahna wa asbahal-mulku lillah",
    meaning: "We have entered the morning and the dominion belongs to Allah.",
    when: "Upon waking and at the start of the school day"
  },
  {
    icon: Moon,
    title: "Before Studying",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni ilma",
    meaning: "My Lord, increase me in knowledge.",
    when: "Before lessons, exams and every pursuit of learning"
  },
  {
    icon: Sparkles,
    title: "Before Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    meaning: "In the name of Allah.",
    when: "At snack time, lunch and whenever food is shared"
  },
  {
    icon: Heart,
    title: "Evening Dua",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
    transliteration: "Amsayna wa amsal-mulku lillah",
    meaning: "We have entered the evening and the dominion belongs to Allah.",
    when: "At the close of the school day and before leaving campus"
  }
];
const respectSections = [
  {
    icon: Users,
    title: "Parents",
    description: "Honouring parents as the first teachers — we partner with families through regular communication, Islamic parenting workshops and shared values at home and school."
  },
  {
    icon: School,
    title: "Teachers",
    description: "Teachers are held in high esteem. Students learn to address educators with adab, listen attentively and value the trust placed in those who guide their learning."
  },
  {
    icon: Heart,
    title: "Community",
    description: "Respect for neighbours, elders and fellow students — through service projects, mosque visits and a culture of kindness that extends beyond the classroom walls."
  }
];
const characterTraits = [
  "Truthfulness (Sidq) in word and deed",
  "Patience (Sabr) during challenges and growth",
  "Gratitude (Shukr) for blessings and opportunities",
  "Humility (Tawadu) before Allah and others",
  "Generosity (Karam) in sharing time and resources",
  "Responsibility (Amanah) as stewards of trust"
];
const faithInPractice = [
  "On-campus prayer hall with dedicated wudu facilities",
  "Hifz program with one-on-one mentorship from qualified Huffaz",
  "Quran competitions, Hadith circles and Seerah classes",
  "Annual Ramadan programs, Iftar gatherings and Eid celebrations"
];
function IslamicEducationShowcase() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Islamic Education", title: "Nurturing faith alongside knowledge", children: "Our Islamic curriculum is woven into the fabric of every school day — building students of character, conviction and compassion." }),
    /* @__PURE__ */ jsx("section", { id: "faith-in-practice", className: "py-20 sm:py-28", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8", children: [
      /* @__PURE__ */ jsx(
        motion.img,
        {
          initial: { opacity: 0, x: -20 },
          whileInView: { opacity: 1, x: 0 },
          viewport: { once: true },
          transition: { duration: 0.6 },
          src: prayer,
          alt: "Prayer hall at Hyderabad School",
          width: 1200,
          height: 800,
          loading: "lazy",
          className: "rounded-3xl border border-border shadow-elegant"
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          SectionHeader,
          {
            center: false,
            eyebrow: "Faith In Practice",
            title: "Faith in practice, every day",
            subtitle: "From the first morning dua to afternoon Zuhr prayers, Islamic learning is lived — not just taught."
          }
        ),
        /* @__PURE__ */ jsx("ul", { className: "mt-8 space-y-4 text-muted-foreground", children: faithInPractice.map((item) => /* @__PURE__ */ jsxs(
          motion.li,
          {
            initial: { opacity: 0, x: 12 },
            whileInView: { opacity: 1, x: 0 },
            viewport: { once: true },
            transition: { duration: 0.4 },
            className: "flex gap-3",
            children: [
              /* @__PURE__ */ jsx("span", { className: "mt-1 h-2 w-2 shrink-0 rounded-full bg-gold", "aria-hidden": true }),
              item
            ]
          },
          item
        )) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { id: "four-pillars", className: "relative bg-secondary py-20 sm:py-28", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pattern-islamic opacity-20", "aria-hidden": true }),
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(
          SectionHeader,
          {
            eyebrow: "Four Pillars",
            title: "The foundation of Islamic learning",
            subtitle: "Quran, Salah, Akhlaq and Ilm — four pillars that guide every student's spiritual and intellectual journey."
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: pillars.map((pillar, i) => /* @__PURE__ */ jsx(FeatureCard, { ...pillar, index: i }, pillar.title)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { id: "daily-duas", className: "py-20 sm:py-28", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(
        SectionHeader,
        {
          eyebrow: "Daily Duas",
          title: "Remembrance throughout the day",
          subtitle: "Students memorise and recite these duas as part of their daily routine — connecting every moment to Allah."
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2", children: dailyDuas.map((dua, i) => /* @__PURE__ */ jsxs(
        motion.article,
        {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.45, delay: i * 0.08 },
          whileHover: { y: -4 },
          className: "group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition hover:shadow-elegant",
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition group-hover:scale-150",
                "aria-hidden": true
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft", children: /* @__PURE__ */ jsx(dua.icon, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-semibold", children: dua.title })
              ] }),
              /* @__PURE__ */ jsx(
                "p",
                {
                  className: "mt-5 text-right font-display text-2xl leading-relaxed text-primary",
                  dir: "rtl",
                  lang: "ar",
                  children: dua.arabic
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm italic text-gold", children: dua.transliteration }),
              /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: dua.meaning }),
              /* @__PURE__ */ jsx("p", { className: "mt-4 border-t border-border pt-4 text-xs font-medium uppercase tracking-widest text-primary/70", children: dua.when })
            ] })
          ]
        },
        dua.title
      )) })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { id: "respect", className: "relative bg-secondary py-20 sm:py-28", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pattern-islamic opacity-20", "aria-hidden": true }),
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(
          SectionHeader,
          {
            eyebrow: "Respect",
            title: "Adab in every relationship",
            subtitle: "Islamic education teaches students to honour those around them — at home, in school and in the wider community."
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-8 md:grid-cols-3", children: respectSections.map((section, i) => /* @__PURE__ */ jsxs(
          motion.article,
          {
            initial: { opacity: 0, y: 24 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-80px" },
            transition: { duration: 0.45, delay: i * 0.08 },
            whileHover: { y: -4 },
            className: "overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-elegant",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-primary/10 via-secondary to-gold/10", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pattern-islamic opacity-40", "aria-hidden": true }),
                /* @__PURE__ */ jsx("div", { className: "relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft", children: /* @__PURE__ */ jsx(section.icon, { className: "h-7 w-7" }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-semibold", children: section.title }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: section.description })
              ] })
            ]
          },
          section.title
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { id: "character-building", className: "py-20 sm:py-28", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-12 lg:grid-cols-2 lg:items-center", children: [
      /* @__PURE__ */ jsx(
        SectionHeader,
        {
          center: false,
          eyebrow: "Character Building",
          title: "Shaping hearts, not just minds",
          subtitle: "Through daily reflection, mentorship and service, we cultivate the moral virtues that define a true Muslim."
        }
      ),
      /* @__PURE__ */ jsx(
        motion.ul,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.5 },
          className: "grid gap-4 sm:grid-cols-2",
          children: characterTraits.map((trait, i) => /* @__PURE__ */ jsxs(
            motion.li,
            {
              initial: { opacity: 0, x: 12 },
              whileInView: { opacity: 1, x: 0 },
              viewport: { once: true },
              transition: { duration: 0.35, delay: i * 0.06 },
              className: "flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-soft",
              children: [
                /* @__PURE__ */ jsx("span", { className: "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(HandHeart, { className: "h-4 w-4" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-sm leading-relaxed text-foreground", children: trait })
              ]
            },
            trait
          ))
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { id: "quran-ayah-footer", className: "pb-20 sm:pb-28", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 },
        className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-10 text-center text-primary-foreground shadow-elegant sm:p-14",
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pattern-islamic opacity-25", "aria-hidden": true }),
          /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-3xl", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest", children: "Quran Ayah" }),
            /* @__PURE__ */ jsx(
              "p",
              {
                className: "mt-6 font-display text-3xl leading-relaxed sm:text-4xl",
                dir: "rtl",
                lang: "ar",
                children: "رَبِّ زِدْنِي عِلْمًا"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "mt-4 font-display text-xl italic text-gold sm:text-2xl", children: "“My Lord, increase me in knowledge.”" }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-primary-foreground/75", children: "— Surah Ta-Ha (20:114)" })
          ] })
        ]
      }
    ) }) })
  ] });
}
function IslamicEducationPage() {
  return /* @__PURE__ */ jsx(IslamicEducationShowcase, {});
}
export {
  IslamicEducationPage as component
};
