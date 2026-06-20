import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { S as SITE, m as motion } from "./router-RRLex1WM.js";
import { MapPin, Mail, Send, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "react";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
function GoogleMap() {
  const src = SITE.mapsUrl;
  return /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-border shadow-soft", children: /* @__PURE__ */ jsx(
    "iframe",
    {
      title: "Hyderabad School location",
      src,
      width: "100%",
      height: "420",
      style: { border: 0 },
      loading: "lazy",
      referrerPolicy: "no-referrer-when-downgrade",
      allowFullScreen: true
    }
  ) });
}
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(5, "Please share a bit more").max(1e3)
});
function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting
    },
    reset
  } = useForm({
    resolver: zodResolver(schema)
  });
  const onSubmit = async (values) => {
    await new Promise((r) => setTimeout(r, 600));
    console.log("Contact:", values);
    toast.success("Message sent! We'll reply within one business day.");
    reset();
  };
  const contactItems = [{
    icon: MapPin,
    label: "Visit",
    value: SITE.address
  }, ...SITE.phones.map((phone) => ({
    icon: Phone,
    label: "Call",
    value: phone
  })), {
    icon: Mail,
    label: "Email",
    value: SITE.email
  }];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Contact", title: "We're here to help", children: "Questions about admissions, academics or campus life? Reach out — we love hearing from families." }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "grid gap-10 lg:grid-cols-3", children: contactItems.map((c, i) => /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0,
      y: 24
    }, whileInView: {
      opacity: 1,
      y: 0
    }, viewport: {
      once: true
    }, transition: {
      delay: i * 0.08
    }, className: "rounded-2xl border border-border bg-card p-7 shadow-soft", children: [
      /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground", children: /* @__PURE__ */ jsx(c.icon, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-5 text-xs uppercase tracking-widest text-muted-foreground", children: c.label }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 font-medium", children: c.value })
    ] }, c.label)) }) }) }),
    /* @__PURE__ */ jsxs("section", { className: "bg-secondary py-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(SectionHeader, { center: false, eyebrow: "Find Us", title: "Our location", subtitle: "In the heart of Hyderabad with easy access from major routes." }),
          /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(GoogleMap, {}) })
        ] }),
        /* @__PURE__ */ jsxs(motion.div, { initial: {
          opacity: 0,
          y: 16
        }, whileInView: {
          opacity: 1,
          y: 0
        }, viewport: {
          once: true
        }, className: "rounded-3xl border border-border bg-card p-8 shadow-elegant", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-2xl font-bold", children: "Send us a message" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "We typically respond within one business day." }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "mt-6 grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsx(Field, { label: "Your Name", error: errors.name?.message, children: /* @__PURE__ */ jsx("input", { ...register("name"), className: "form-input" }) }),
            /* @__PURE__ */ jsx(Field, { label: "Email", error: errors.email?.message, children: /* @__PURE__ */ jsx("input", { ...register("email"), type: "email", className: "form-input" }) }),
            /* @__PURE__ */ jsx(Field, { label: "Subject", error: errors.subject?.message, className: "sm:col-span-2", children: /* @__PURE__ */ jsx("input", { ...register("subject"), className: "form-input" }) }),
            /* @__PURE__ */ jsx(Field, { label: "Message", error: errors.message?.message, className: "sm:col-span-2", children: /* @__PURE__ */ jsx("textarea", { ...register("message"), rows: 5, className: "form-input resize-none" }) }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: isSubmitting, className: "sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-glow disabled:opacity-60", children: isSubmitting ? "Sending…" : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Send Message ",
              /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `
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
        ` })
    ] })
  ] });
}
function Field({
  label,
  error,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs("label", { className: `block ${className ?? ""}`, children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1.5 block text-sm font-medium text-foreground", children: label }),
    children,
    error && /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs text-destructive", children: error })
  ] });
}
export {
  ContactPage as component
};
