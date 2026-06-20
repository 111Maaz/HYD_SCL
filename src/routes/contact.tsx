import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeader } from "@/components/site/SectionHeader";
import { GoogleMap } from "@/components/site/GoogleMap";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { SITE } from "@/lib/site";
import { motion } from "@/lib/motion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Hyderabad School" },
      {
        name: "description",
        content: "Get in touch with Hyderabad School. Address, phone, email and contact form.",
      },
      { property: "og:title", content: "Contact Hyderabad School" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(5, "Please share a bit more").max(1000),
});
type Values = z.infer<typeof schema>;

function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    await new Promise((r) => setTimeout(r, 600));
    console.log("Contact:", values);
    toast.success("Message sent! We'll reply within one business day.");
    reset();
  };

  const contactItems = [
    { icon: MapPin, label: "Visit", value: SITE.address },
    ...SITE.phones.map((phone) => ({ icon: Phone, label: "Call", value: phone })),
    { icon: Mail, label: "Email", value: SITE.email },
  ];

  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help">
        Questions about admissions, academics or campus life? Reach out — we love hearing from
        families.
      </PageHero>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {contactItems.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </div>
                <div className="mt-1 font-medium">{c.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeader
              center={false}
              eyebrow="Find Us"
              title="Our location"
              subtitle="In the heart of Hyderabad with easy access from major routes."
            />
            <div className="mt-8">
              <GoogleMap />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-8 shadow-elegant"
          >
            <h3 className="font-display text-2xl font-bold">Send us a message</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We typically respond within one business day.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Your Name" error={errors.name?.message}>
                <input {...register("name")} className="form-input" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register("email")} type="email" className="form-input" />
              </Field>
              <Field label="Subject" error={errors.subject?.message} className="sm:col-span-2">
                <input {...register("subject")} className="form-input" />
              </Field>
              <Field label="Message" error={errors.message?.message} className="sm:col-span-2">
                <textarea {...register("message")} rows={5} className="form-input resize-none" />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-glow disabled:opacity-60"
              >
                {isSubmitting ? (
                  "Sending…"
                ) : (
                  <>
                    Send Message <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
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
      </section>
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
