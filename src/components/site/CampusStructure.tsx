import { motion } from "@/lib/motion";
import { Building2 } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import boysBlockImg from "@/assets/Boys Block.png";
import girlsBlockImg from "@/assets/Girls Block.png";
import kgBlockImg from "@/assets/KG Block.png";

const blocks = [
  {
    title: "Boys Block",
    image: boysBlockImg,
    imageFit: "contain" as const,
    description:
      "Dedicated classrooms, labs and activity spaces designed for focused learning in a structured, supportive environment.",
  },
  {
    title: "Girls Block",
    image: girlsBlockImg,
    imageFit: "contain" as const,
    description:
      "Purpose-built facilities with modern amenities, ensuring comfort, safety and academic excellence for every student.",
  },
  {
    title: "KG Block",
    image: kgBlockImg,
    imageFit: "cover" as const,
    description:
      "A vibrant early-years wing with play areas, sensory learning zones and nurturing spaces for our youngest learners.",
  },
];

export function CampusStructure() {
  return (
    <section id="campus-structure" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Campus Structure"
          title="Spaces built for every learner"
          subtitle="Separate, purpose-designed blocks that provide the right environment at every stage of growth."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {blocks.map((block, i) => (
            <motion.article
              key={block.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-elegant"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={block.image}
                  alt={block.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">{block.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {block.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
