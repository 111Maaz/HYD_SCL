import { jsxs, jsx } from "react/jsx-runtime";
import { m as motion } from "./router-RRLex1WM.js";
function PersonCard({ person, index = 0 }) {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-80px" },
      transition: { duration: 0.45, delay: index * 0.06 },
      whileHover: { y: -6 },
      className: "group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full font-display text-2xl font-bold text-primary-foreground ${person.photoUrl ? "" : person.accent ?? "bg-gradient-to-br from-primary to-primary-glow"}`,
            children: person.photoUrl ? /* @__PURE__ */ jsx("img", { src: person.photoUrl, alt: person.name, className: "h-full w-full object-cover" }) : person.initials
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "mt-5 text-center font-display text-xl font-semibold", children: person.name }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-sm font-medium text-primary", children: person.role }),
        person.bio && /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-sm text-muted-foreground", children: person.bio })
      ]
    }
  );
}
export {
  PersonCard as P
};
