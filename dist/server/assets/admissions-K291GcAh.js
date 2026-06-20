import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { S as SITE, m as motion } from "./router-RRLex1WM.js";
import { FileText, CalendarCheck, ClipboardCheck, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { s as submitAdmissionEnquiry } from "./admissions-DyzaJEll.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "./supabase-pxAHMEVs.js";
const schema = z.object({
  parentName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20).regex(/^[0-9+\-\s()]+$/, "Digits, spaces and + only"),
  studentName: z.string().trim().min(2, "Enter the student's name").max(100),
  grade: z.string().min(1, "Please select a class"),
  message: z.string().trim().max(1e3).optional()
});
const steps = [{
  icon: FileText,
  title: "1. Submit Enquiry",
  desc: "Fill the online form — takes under 2 minutes."
}, {
  icon: CalendarCheck,
  title: "2. Campus Visit",
  desc: "We schedule a personalised visit and assessment."
}, {
  icon: ClipboardCheck,
  title: "3. Enrollment",
  desc: "Complete documentation and welcome to the family."
}];
const grades = ["Nursery", "LKG", "UKG", ...Array.from({
  length: 10
}, (_, i) => `Class ${i + 1}`)];
function AdmissionsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
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
    setSubmitError(null);
    setSubmitted(false);
    try {
      await submitAdmissionEnquiry(values);
      toast.success("Enquiry received! Our team will contact you within 24 hours.");
      reset();
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again or contact us directly.";
      setSubmitError(message);
      toast.error(message);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Admissions", title: "Begin your child's journey with us", children: `Admissions are open for the ${SITE.academicYear} academic year. We welcome curious minds and caring families.` }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Process", title: "Three simple steps" }),
      /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 md:grid-cols-3", children: steps.map((s, i) => /* @__PURE__ */ jsxs(motion.div, { initial: {
        opacity: 0,
        y: 24
      }, whileInView: {
        opacity: 1,
        y: 0
      }, viewport: {
        once: true
      }, transition: {
        delay: i * 0.1
      }, className: "rounded-2xl border border-border bg-card p-7 shadow-soft", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground", children: /* @__PURE__ */ jsx(s.icon, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsx("h3", { className: "mt-5 font-display text-xl font-semibold", children: s.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: s.desc })
      ] }, s.title)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-secondary py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(SectionHeader, { center: false, eyebrow: "Documents", title: "What you'll need" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-8 space-y-4 text-muted-foreground", children: ["Student's birth certificate", "Previous school report card (if applicable)", "Transfer Certificate (for Class 2 and above)", "Passport-size photographs (4 copies)", "Parent/Guardian ID proof", "Address proof"].map((d) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 shrink-0 text-primary" }),
          /* @__PURE__ */ jsx("span", { children: d })
        ] }, d)) })
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
        /* @__PURE__ */ jsx("h3", { className: "font-display text-2xl font-bold", children: "Admission Enquiry" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Tell us about your child and we'll be in touch shortly." }),
        submitted && /* @__PURE__ */ jsxs("div", { role: "status", className: "mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 shrink-0", "aria-hidden": true }),
          /* @__PURE__ */ jsx("p", { children: "Thank you — your enquiry was received. Our admissions team will contact you within 24 hours." })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "mt-6 grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Field, { label: "Parent / Guardian Name", error: errors.parentName?.message, children: /* @__PURE__ */ jsx("input", { ...register("parentName"), className: "form-input", placeholder: "Full name" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Email", error: errors.email?.message, children: /* @__PURE__ */ jsx("input", { ...register("email"), type: "email", className: "form-input", placeholder: "you@example.com" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Phone", error: errors.phone?.message, children: /* @__PURE__ */ jsx("input", { ...register("phone"), className: "form-input", placeholder: "Phone number" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Student's Name", error: errors.studentName?.message, children: /* @__PURE__ */ jsx("input", { ...register("studentName"), className: "form-input", placeholder: "Full name" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Class Applying For", error: errors.grade?.message, children: /* @__PURE__ */ jsxs("select", { ...register("grade"), className: "form-input", defaultValue: "", children: [
            /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select class" }),
            grades.map((g) => /* @__PURE__ */ jsx("option", { value: g, children: g }, g))
          ] }) }),
          /* @__PURE__ */ jsx(Field, { label: "Message (optional)", error: errors.message?.message, className: "sm:col-span-2", children: /* @__PURE__ */ jsx("textarea", { ...register("message"), rows: 4, className: "form-input resize-none", placeholder: "Anything you'd like us to know" }) }),
          submitError && /* @__PURE__ */ jsxs("div", { role: "alert", className: "sm:col-span-2 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 shrink-0", "aria-hidden": true }),
            /* @__PURE__ */ jsx("p", { children: submitError })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: isSubmitting, className: "sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-glow disabled:opacity-60", children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin", "aria-hidden": true }),
            "Sending…"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Submit Enquiry ",
            /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
          ] }) })
        ] })
      ] })
    ] }) }),
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
  AdmissionsPage as component
};
