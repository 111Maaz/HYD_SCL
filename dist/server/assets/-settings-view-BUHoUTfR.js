import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-B3TlI1iy.js";
import { u as useAuth, S as SITE } from "./router-RRLex1WM.js";
import "lucide-react";
import "react";
import "class-variance-authority";
import "@tanstack/react-query";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
function AdminSettingsView() {
  const { auth } = useAuth();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(AdminPageHeader, { title: "Settings", description: "Account and portal preferences." }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Account" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Signed-in administrator details." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Email:" }),
            " ",
            auth?.email ?? "—"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Role:" }),
            " ",
            auth?.role ?? "—"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "School:" }),
            " ",
            SITE.name
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Faculty provisioning" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Create staff login accounts for the faculty portal." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
          Link,
          {
            to: "/admin/faculty-accounts",
            className: "text-sm font-medium text-primary hover:underline",
            children: "Manage faculty accounts →"
          }
        ) })
      ] })
    ] })
  ] });
}
export {
  AdminSettingsView
};
