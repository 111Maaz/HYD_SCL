import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";

export function AdmissionsCTA() {
  return (
    <section id="admissions-cta" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-10 text-primary-foreground shadow-elegant sm:p-14">
          <div className="absolute inset-0 pattern-islamic opacity-25" aria-hidden />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <Users className="h-10 w-10 text-gold" />
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Join the Hyderabad School family
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85">
                Limited seats for the new academic session. Submit an enquiry today and our
                admissions team will reach out within 24 hours.
              </p>
            </div>
            <Link
              to="/admissions"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-semibold text-gold-foreground shadow-gold transition hover:brightness-110"
            >
              Start Enquiry <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
