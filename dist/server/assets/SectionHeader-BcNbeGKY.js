import { jsxs, jsx } from "react/jsx-runtime";
import { m as motion } from "./router-RRLex1WM.js";
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true
}) {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-80px" },
      transition: { duration: 0.5 },
      className: center ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
      children: [
        eyebrow && /* @__PURE__ */ jsx("span", { className: "inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary", children: eyebrow }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl", children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { className: "mt-4 text-base text-muted-foreground sm:text-lg", children: subtitle })
      ]
    }
  );
}
export {
  SectionHeader as S
};
