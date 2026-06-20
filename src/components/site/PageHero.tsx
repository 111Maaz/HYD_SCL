import { motion } from "@/lib/motion";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 pattern-islamic opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {eyebrow && (
            <span className="inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl md:text-6xl">{title}</h1>
          {children && (
            <div className="mt-5 max-w-2xl text-lg text-primary-foreground/85">{children}</div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
