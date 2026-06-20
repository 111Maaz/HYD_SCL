import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { S as SectionHeader } from "./SectionHeader-BcNbeGKY.js";
import { m as motion, c as cn } from "./router-RRLex1WM.js";
import { C as CLASS_NUMBERS, g as getMaterialPreviewUrl, a as getMaterialsByClass } from "./class-materials-DdBz_lhb.js";
import { FileText, Eye, Download, Loader2, AlertCircle } from "lucide-react";
import { B as Button } from "./button-Q0ssrFUP.js";
import { f as fetchClassMaterials } from "./class-materials-D0EwlyBb.js";
import "@tanstack/react-router";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
function ClassSelector({ selected, onSelect }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "tablist",
      "aria-label": "Select class",
      className: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:gap-4",
      children: CLASS_NUMBERS.map((classNumber, index) => {
        const isSelected = selected === classNumber;
        return /* @__PURE__ */ jsx(
          motion.button,
          {
            type: "button",
            role: "tab",
            "aria-selected": isSelected,
            initial: { opacity: 0, y: 16 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-40px" },
            transition: { duration: 0.35, delay: index * 0.04 },
            whileHover: { y: -2 },
            whileTap: { scale: 0.98 },
            onClick: () => onSelect(classNumber),
            className: cn(
              "rounded-2xl border px-4 py-5 text-center shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected ? "border-primary bg-primary text-primary-foreground shadow-elegant" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
            ),
            children: /* @__PURE__ */ jsxs("span", { className: "block font-display text-lg font-bold sm:text-xl", children: [
              "Class ",
              classNumber
            ] })
          },
          classNumber
        );
      })
    }
  );
}
function MaterialList({ materials }) {
  if (materials.length === 0) {
    return /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
        className: "rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground", children: /* @__PURE__ */ jsx(FileText, { className: "h-7 w-7", "aria-hidden": true }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 text-base text-muted-foreground sm:text-lg", children: "No materials uploaded yet for this class." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: materials.map((material, index) => {
    const previewUrl = getMaterialPreviewUrl(material.file_url, material.file_name);
    return /* @__PURE__ */ jsxs(
      motion.article,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: index * 0.06 },
        whileHover: { y: -4 },
        className: "flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant",
        children: [
          /* @__PURE__ */ jsx("span", { className: "inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary", children: material.subject }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-xl font-semibold text-foreground", children: material.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 flex-1 text-sm leading-relaxed text-muted-foreground", children: material.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", asChild: true, className: "flex-1 sm:flex-none", children: /* @__PURE__ */ jsxs("a", { href: previewUrl, target: "_blank", rel: "noopener noreferrer", children: [
              /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4", "aria-hidden": true }),
              "Preview"
            ] }) }),
            /* @__PURE__ */ jsx(Button, { asChild: true, className: "flex-1 sm:flex-none", children: /* @__PURE__ */ jsxs(
              "a",
              {
                href: material.file_url,
                download: material.file_name,
                target: "_blank",
                rel: "noopener noreferrer",
                children: [
                  /* @__PURE__ */ jsx(Download, { className: "h-4 w-4", "aria-hidden": true }),
                  "Download"
                ]
              }
            ) })
          ] })
        ]
      },
      material.id
    );
  }) });
}
function StudentsPage() {
  const [selectedClass, setSelectedClass] = useState(1);
  const {
    data: allMaterials,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["class-materials"],
    queryFn: fetchClassMaterials
  });
  const materials = selectedClass && allMaterials ? getMaterialsByClass(selectedClass, allMaterials) : [];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Students", title: "Class learning materials", children: "Select your class to browse and download study resources shared by our faculty. No login required." }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Your class", title: "Choose a class", subtitle: "Materials are organised by class level for easy access." }),
      /* @__PURE__ */ jsx("div", { className: "mt-14", children: /* @__PURE__ */ jsx(ClassSelector, { selected: selectedClass, onSelect: setSelectedClass }) })
    ] }) }),
    selectedClass && /* @__PURE__ */ jsx("section", { className: "bg-secondary pb-20 pt-4", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(SectionHeader, { center: false, eyebrow: "Downloads", title: `Class ${selectedClass} materials`, subtitle: !isLoading && materials.length > 0 ? `${materials.length} resource${materials.length === 1 ? "" : "s"} available for download.` : void 0 }),
      isLoading && /* @__PURE__ */ jsxs("div", { className: "mt-10 flex items-center justify-center gap-2 py-16 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin", "aria-hidden": true }),
        /* @__PURE__ */ jsx("span", { children: "Loading materials…" })
      ] }),
      isError && /* @__PURE__ */ jsxs("div", { role: "alert", className: "mt-10 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 shrink-0", "aria-hidden": true }),
        /* @__PURE__ */ jsx("p", { children: error instanceof Error ? error.message : "Failed to load class materials." })
      ] }),
      !isLoading && !isError && /* @__PURE__ */ jsx("div", { className: "mt-10", children: /* @__PURE__ */ jsx(MaterialList, { materials }) })
    ] }) })
  ] });
}
export {
  StudentsPage as component
};
