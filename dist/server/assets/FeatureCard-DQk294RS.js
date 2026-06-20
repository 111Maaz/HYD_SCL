import { jsxs, jsx } from "react/jsx-runtime";
import { m as motion } from "./router-RRLex1WM.js";
function FeatureCard({
  icon: Icon,
  title,
  description,
  index = 0
}) {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-80px" },
      transition: { duration: 0.45, delay: index * 0.06 },
      whileHover: { y: -4 },
      className: "group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition hover:shadow-elegant",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition group-hover:scale-150",
            "aria-hidden": true
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-5 font-display text-xl font-semibold", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: description })
        ] })
      ]
    }
  );
}
export {
  FeatureCard as F
};
