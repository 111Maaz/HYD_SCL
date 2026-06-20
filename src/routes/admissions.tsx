import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeader } from "@/components/site/SectionHeader";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "@/lib/motion";
import { CheckCircle2, FileText, CalendarCheck, ClipboardCheck, Send } from "lucide-react";
import { SITE } from "@/lib/site";
import { submitAdmissionEnquiry } from "@/services/admissions";
import { AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Hyderabad School" },
      {
        name: "description",
        content:
          "Apply to Hyderabad School for the new academic year. Submit an admission enquiry online.",
      },
      { property: "og:title", content: "Admissions — Hyderabad School" },
      { property: "og:description", content: "Process, requirements and admission enquiry form." },
    ],
  }),
  component: AdmissionsPage,
});

const schema = z.object({
  parentName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Digits, spaces and + only"),
  studentName: z.string().trim().min(2, "Enter the student's name").max(100),
  grade: z.string().min(1, "Please select a class"),
  message: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

const steps = [
  {
    icon: FileText,
    title: "1. Submit Enquiry",
    desc: "Fill the online form — takes under 2 minutes.",
  },
  {
    icon: CalendarCheck,
    title: "2. Campus Visit",
    desc: "We schedule a personalised visit and assessment.",
  },
  {
    icon: ClipboardCheck,
    title: "3. Enrollment",
    desc: "Complete documentation and welcome to the family.",
  },
];

const grades = ["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

function AdmissionsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitted(false);

    try {
      await submitAdmissionEnquiry(values);
      toast.success("Enquiry received! Our team will contact you within 24 hours.");
      reset();
      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again or contact us directly.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <PageHero eyebrow="Admissions" title="Begin your child's journey with us">
        {SITE.academicYear
          ? `Admissions are open for the ${SITE.academicYear} academic year. We welcome curious minds and caring families.`
          : "Admissions are open. We welcome curious minds and caring families."}
      </PageHero>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Process" title="Three simple steps" />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div>
            <SectionHeader center={false} eyebrow="Documents" title="What you'll need" />
            <ul className="mt-8 space-y-4 text-muted-foreground">
              {[
                "Student's birth certificate",
                "Previous school report card (if applicable)",
                "Transfer Certificate (for Class 2 and above)",
                "Passport-size photographs (4 copies)",
                "Parent/Guardian ID proof",
                "Address proof",
              ].map((d) => (
                <li key={d} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-8 shadow-elegant"
          >
            <h3 className="font-display text-2xl font-bold">Admission Enquiry</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about your child and we'll be in touch shortly.
            </p>

            {submitted && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p>
                  Thank you — your enquiry was received. Our admissions team will contact you within
                  24 hours.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Parent / Guardian Name" error={errors.parentName?.message}>
                <input {...register("parentName")} className="form-input" placeholder="Full name" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register("email")}
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input {...register("phone")} className="form-input" placeholder="Phone number" />
              </Field>
              <Field label="Student's Name" error={errors.studentName?.message}>
                <input
                  {...register("studentName")}
                  className="form-input"
                  placeholder="Full name"
                />
              </Field>
              <Field label="Class Applying For" error={errors.grade?.message}>
                <select {...register("grade")} className="form-input" defaultValue="">
                  <option value="" disabled>
                    Select class
                  </option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Message (optional)"
                error={errors.message?.message}
                className="sm:col-span-2"
              >
                <textarea
                  {...register("message")}
                  rows={4}
                  className="form-input resize-none"
                  placeholder="Anything you'd like us to know"
                />
              </Field>
              {submitError && (
                <div
                  role="alert"
                  className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  <p>{submitError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-glow disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  <>
                    Submit Enquiry <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <style>{`
        .form-input{
          width:100%;
          border-radius:0.75rem;
          border:1px solid var(--color-border);
          background:var(--color-background);
          padding:0.65rem 0.9rem;
          font-size:0.9rem;
          color:var(--color-foreground);
          outline:none;
          transition:border-color .15s, box-shadow .15s;
        }
        .form-input:focus{
          border-color:var(--color-primary);
          box-shadow:0 0 0 3px color-mix(in oklab, var(--color-primary) 20%, transparent);
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
