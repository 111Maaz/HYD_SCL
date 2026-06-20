import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { P as PageHero } from "./PageHero-DU2q1QQi.js";
import { m as motion } from "./router-RRLex1WM.js";
import { Loader2, AlertCircle } from "lucide-react";
import { h as heroImg, c as classroomImg } from "./hero-BXYLLuMB.js";
import { p as prayer } from "./prayer-hall-BRon0RJX.js";
import { f as fetchGalleryImages, i as isGalleryVideoUrl } from "./gallery-ul5uf7Zm.js";
import "@tanstack/react-router";
import "react";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
const library = "/assets/library-CgKla37N.jpg";
const lab = "/assets/science-lab-rZKiwh56.jpg";
const sports = "/assets/sports-BcablA2Y.jpg";
const graduation = "/assets/graduation-_dgH5KY5.jpg";
const art = "/assets/art-class--8ko_Glq.jpg";
const fallbackPhotos = [{
  id: "fallback-hero",
  src: heroImg,
  caption: "Our campus",
  span: "md:col-span-2 md:row-span-2"
}, {
  id: "fallback-classroom",
  src: classroomImg,
  caption: "Modern classrooms"
}, {
  id: "fallback-library",
  src: library,
  caption: "Library & study halls"
}, {
  id: "fallback-lab",
  src: lab,
  caption: "Science laboratories"
}, {
  id: "fallback-prayer",
  src: prayer,
  caption: "Prayer hall"
}, {
  id: "fallback-sports",
  src: sports,
  caption: "Sports day"
}, {
  id: "fallback-art",
  src: art,
  caption: "Art & creativity"
}, {
  id: "fallback-graduation",
  src: graduation,
  caption: "Graduation",
  span: "md:col-span-2"
}];
function GalleryPage() {
  const {
    data: photos = fallbackPhotos,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: () => fetchGalleryImages(fallbackPhotos)
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Gallery", title: "Moments from our campus", children: "A glimpse of the spaces, people and celebrations that make Hyderabad School home." }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
      isLoading && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 py-16 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin", "aria-hidden": true }),
        /* @__PURE__ */ jsx("span", { children: "Loading gallery…" })
      ] }),
      isError && /* @__PURE__ */ jsxs("div", { role: "alert", className: "mb-8 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "mt-0.5 h-5 w-5 shrink-0", "aria-hidden": true }),
        /* @__PURE__ */ jsx("p", { children: error instanceof Error ? error.message : "Failed to load gallery images." })
      ] }),
      !isLoading && /* @__PURE__ */ jsx("div", { className: "grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4", children: photos.map((p, i) => /* @__PURE__ */ jsxs(motion.figure, { initial: {
        opacity: 0,
        scale: 0.95
      }, whileInView: {
        opacity: 1,
        scale: 1
      }, viewport: {
        once: true,
        margin: "-60px"
      }, transition: {
        duration: 0.5,
        delay: i * 0.05
      }, whileHover: {
        y: -4
      }, className: `group relative overflow-hidden rounded-2xl border border-border shadow-soft ${p.span ?? ""}`, children: [
        isGalleryVideoUrl(p.src) ? /* @__PURE__ */ jsx("video", { src: p.src, className: "h-full w-full object-cover", controls: true, muted: true, playsInline: true, preload: "metadata" }) : /* @__PURE__ */ jsx("img", { src: p.src, alt: p.caption, loading: "lazy", className: "h-full w-full object-cover transition duration-700 group-hover:scale-110" }),
        /* @__PURE__ */ jsx("figcaption", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100", children: p.caption })
      ] }, p.id)) })
    ] }) })
  ] });
}
export {
  GalleryPage as component
};
