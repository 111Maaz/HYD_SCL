import { motion } from "@/lib/motion";
import { Quote } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { LEADERSHIP } from "@/lib/site";

const principal = LEADERSHIP[0];

// Put the principal photo in public/ and set the path here, e.g. "/images/principal.jpg"
const PRINCIPAL_PHOTO = "";

export function PrincipalMessage() {
  return (
    <section id="principal-message" className="bg-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Principal's Message"
          title="A word from our leadership"
          subtitle="Guiding every student with wisdom, care and a shared commitment to excellence."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-elegant"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10"
            aria-hidden
          />
          <div
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary via-primary-glow to-gold"
            aria-hidden
          />

          <div className="relative grid gap-8 p-8 sm:p-10 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
            <div className="mx-auto shrink-0 md:mx-0">
              <div className="relative">
                <div className="absolute -inset-2 rounded-2xl bg-gold/20 blur-lg" aria-hidden />
                <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-primary to-primary-glow shadow-soft sm:h-44 sm:w-44">
                  {PRINCIPAL_PHOTO ? (
                    <img
                      src={PRINCIPAL_PHOTO}
                      alt={principal.name || "Principal"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-display text-4xl font-bold text-primary-foreground">
                      {principal.initials}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Quote className="h-8 w-8 text-gold" aria-hidden />
              <blockquote className="mt-4 font-display text-xl italic leading-relaxed text-foreground sm:text-2xl">
                {principal.bio ||
                  "At Hyderabad School, we believe every child deserves an education that nurtures both academic achievement and strong moral character. Our mission is to raise confident scholars who serve their families, communities and faith with excellence."}
              </blockquote>
              <div className="mt-6 border-t border-border pt-6">
                <p className="font-display text-lg font-semibold text-foreground">
                  {principal.name || "Abdul Raqeeb"}
                </p>
                <p className="mt-1 text-sm font-medium text-primary">{principal.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
