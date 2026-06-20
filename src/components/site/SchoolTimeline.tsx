import { motion } from "@/lib/motion";
import { SectionHeader } from "@/components/site/SectionHeader";

const milestones = [
  {
    date: "2011",
    title: "School Founded",
    description:
      "Hyderabad School opens its doors with a vision of blending academic rigor and Islamic values.",
  },
  {
    date: "Month 2015",
    title: "First Graduating Class",
    description:
      "Our pioneer batch completes senior secondary, marking a milestone in the school's journey.",
  },
  {
    date: "2019",
    title: "Campus Expansion",
    description:
      "New blocks and facilities are added to accommodate a growing community of learners.",
  },
  {
    date: "2020",
    title: "Science & Innovation Wing",
    description:
      "State-of-the-art laboratories and STEM spaces open to support inquiry-based learning.",
  },
  {
    date: "Month 2022",
    title: "Community Recognition",
    description:
      "The school earns recognition for academic outcomes and holistic student development.",
  },
];

export function SchoolTimeline() {
  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our Journey"
          title="Milestones that shaped our school"
          subtitle="A timeline of growth, achievement and community — from our founding to today."
        />
        <ol className="relative mt-14">
          <div
            className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary-glow to-gold sm:left-1/2 sm:-ml-px"
            aria-hidden
          />
          {milestones.map((milestone, i) => (
            <motion.li
              key={milestone.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`relative flex flex-col gap-4 pb-12 last:pb-0 sm:flex-row sm:gap-8 ${
                i % 2 === 0 ? "sm:flex-row-reverse" : ""
              }`}
            >
              <div className="hidden flex-1 sm:block" aria-hidden />
              <div className="absolute left-0 top-1.5 z-10 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-soft sm:left-1/2 sm:-ml-2" />
              <div className={`flex-1 pl-8 sm:pl-0 ${i % 2 === 0 ? "sm:text-right" : ""}`}>
                <time className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  {milestone.date}
                </time>
                <h3 className="mt-3 font-display text-xl font-semibold">{milestone.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {milestone.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
