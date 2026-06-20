import { motion } from "@/lib/motion";
import { HOME_STATS } from "@/lib/site";

export function StatisticsSection() {
  return (
    <section id="statistics" className="bg-primary py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {HOME_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center text-primary-foreground"
          >
            <div className="font-display text-3xl font-bold text-gold sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-primary-foreground/80">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
