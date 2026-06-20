import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-B3TlI1iy.js";
import { u as useAuth } from "./router-RRLex1WM.js";
import { fetchOwnFacultyProfile } from "./faculty-portal-DwDCZHH7.js";
import "lucide-react";
import "react";
import "class-variance-authority";
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
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
function FacultyProfileView() {
  const { auth } = useAuth();
  const {
    data: profile,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["faculty", "profile", auth?.userId],
    queryFn: () => fetchOwnFacultyProfile(auth.userId),
    enabled: !!auth?.userId
  });
  if (isLoading) return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading your profile…" });
  if (isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: error instanceof Error ? error.message : "Failed to load your profile."
      }
    );
  }
  if (!profile) return null;
  const initials = getInitials(profile.name);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "My Profile",
        description: "Your faculty account and assigned class details."
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[280px_1fr]", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col items-center pt-8 pb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-3xl font-bold text-primary-foreground", children: profile.photo_url ? /* @__PURE__ */ jsx(
          "img",
          {
            src: profile.photo_url,
            alt: profile.name,
            className: "h-full w-full object-cover"
          }
        ) : initials }),
        /* @__PURE__ */ jsx("h2", { className: "mt-5 text-center font-display text-xl font-semibold", children: profile.name }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-sm font-medium text-primary", children: profile.role })
      ] }) }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Profile details" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Read-only view of your faculty record." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Email" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: auth?.email ?? "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Assigned class" }),
            /* @__PURE__ */ jsxs("p", { className: "font-medium", children: [
              "Class ",
              profile.assigned_class
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Role / subject" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: profile.role })
          ] }),
          profile.bio && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Bio" }),
            /* @__PURE__ */ jsx("p", { className: "leading-relaxed", children: profile.bio })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  FacultyProfileView
};
