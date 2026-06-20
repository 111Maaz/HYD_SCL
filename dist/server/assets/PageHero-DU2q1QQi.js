import { jsxs, jsx } from "react/jsx-runtime";
import { m as motion } from "./router-RRLex1WM.js";
function PageHero({
  eyebrow,
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border/60 bg-gradient-hero text-primary-foreground", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pattern-islamic opacity-30", "aria-hidden": true }),
    /* @__PURE__ */ jsx("div", { className: "relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
        className: "max-w-3xl",
        children: [
          eyebrow && /* @__PURE__ */ jsx("span", { className: "inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest", children: eyebrow }),
          /* @__PURE__ */ jsx("h1", { className: "mt-5 font-display text-4xl font-bold sm:text-5xl md:text-6xl", children: title }),
          children && /* @__PURE__ */ jsx("div", { className: "mt-5 max-w-2xl text-lg text-primary-foreground/85", children })
        ]
      }
    ) })
  ] });
}
export {
  PageHero as P
};
