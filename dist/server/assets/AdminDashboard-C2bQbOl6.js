import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, Image, BookOpen } from "lucide-react";
import { A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent, c as CardDescription } from "./card-B3TlI1iy.js";
import { f as fetchAdmissionLeads } from "./admissions-DyzaJEll.js";
import { a as fetchAllClassMaterials } from "./class-materials-D0EwlyBb.js";
import { a as fetchAllFacultyMembers } from "./faculty-Ck1rXykD.js";
import { a as fetchAllGalleryImages } from "./gallery-ul5uf7Zm.js";
import { A as ADMIN_NAV_ITEMS } from "./admin-nav-qsWcVXmI.js";
import "react";
import "class-variance-authority";
import "./router-RRLex1WM.js";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
import "./supabase-pxAHMEVs.js";
import "./class-materials-DdBz_lhb.js";
import "./storage-rV4HRCJm.js";
const MODULE_LINKS = ADMIN_NAV_ITEMS.filter((item) => item.to !== "/admin/dashboard");
function AdminDashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ["admin", "admission-leads"],
    queryFn: fetchAdmissionLeads
  });
  const { data: faculty = [] } = useQuery({
    queryKey: ["admin", "faculty-members"],
    queryFn: fetchAllFacultyMembers
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["admin", "gallery-images"],
    queryFn: fetchAllGalleryImages
  });
  const { data: materials = [] } = useQuery({
    queryKey: ["admin", "class-materials"],
    queryFn: fetchAllClassMaterials
  });
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const stats = [
    { label: "New leads", value: newLeads, icon: Users },
    { label: "Faculty members", value: faculty.length, icon: GraduationCap },
    { label: "Gallery images", value: gallery.length, icon: Image },
    { label: "Class materials", value: materials.length, icon: BookOpen }
  ];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "Dashboard",
        description: "Overview of admissions, faculty, gallery, and class materials."
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: stats.map((stat) => {
      const Icon = stat.icon;
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: stat.label }),
          /* @__PURE__ */ jsx(Icon, { className: "size-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-3xl font-semibold", children: stat.value }) })
      ] }, stat.label);
    }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-2", children: MODULE_LINKS.map((item) => {
      const Icon = item.icon;
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsx(Icon, { className: "size-5" }),
            item.label
          ] }),
          /* @__PURE__ */ jsxs(CardDescription, { children: [
            "Manage ",
            item.label.toLowerCase(),
            " from the admin portal."
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Link, { to: item.to, className: "text-sm font-medium text-primary hover:underline", children: [
          "Open ",
          item.label,
          " →"
        ] }) })
      ] }, item.to);
    }) })
  ] });
}
export {
  AdminDashboard
};
