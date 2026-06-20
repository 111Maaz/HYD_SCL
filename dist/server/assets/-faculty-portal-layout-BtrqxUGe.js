import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, useRouterState, Link, Outlet } from "@tanstack/react-router";
import { User, BookOpen, LogOut } from "lucide-react";
import { u as useAuth, S as SITE } from "./router-RRLex1WM.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { S as SidebarProvider, a as Sidebar, b as SidebarHeader, c as SidebarContent, d as SidebarGroup, e as SidebarGroupContent, f as SidebarMenu, g as SidebarMenuItem, h as SidebarMenuButton, i as SidebarFooter, j as SidebarRail, k as SidebarInset, l as SidebarTrigger, m as Separator } from "./sidebar-MYQ6XHTI.js";
import "@tanstack/react-query";
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
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./input-DPHz-dCO.js";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tooltip";
const FACULTY_NAV_ITEMS = [
  { to: "/faculty/portal/profile", label: "My Profile", icon: User },
  { to: "/faculty/portal/materials", label: "My Class Materials", icon: BookOpen }
];
function FacultyShell({ children }) {
  const { logout, auth } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/admin/login" });
  };
  return /* @__PURE__ */ jsxs(SidebarProvider, { children: [
    /* @__PURE__ */ jsxs(Sidebar, { collapsible: "icon", children: [
      /* @__PURE__ */ jsx(SidebarHeader, { className: "border-b border-sidebar-border p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: SITE.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Faculty Portal" })
      ] }) }),
      /* @__PURE__ */ jsx(SidebarContent, { children: /* @__PURE__ */ jsx(SidebarGroup, { children: /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: FACULTY_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.to;
        return /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(SidebarMenuButton, { asChild: true, isActive, tooltip: item.label, children: /* @__PURE__ */ jsxs(Link, { to: item.to, children: [
          /* @__PURE__ */ jsx(Icon, {}),
          /* @__PURE__ */ jsx("span", { children: item.label })
        ] }) }) }, item.to);
      }) }) }) }) }),
      /* @__PURE__ */ jsx(SidebarFooter, { className: "border-t border-sidebar-border p-2", children: /* @__PURE__ */ jsx(SidebarMenu, { children: /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(SidebarMenuButton, { asChild: true, tooltip: "Public site", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx("span", { className: "text-xs", children: "View public site" }) }) }) }) }) }),
      /* @__PURE__ */ jsx(SidebarRail, {})
    ] }),
    /* @__PURE__ */ jsxs(SidebarInset, { children: [
      /* @__PURE__ */ jsxs("header", { className: "flex h-14 items-center gap-2 border-b bg-background px-4", children: [
        /* @__PURE__ */ jsx(SidebarTrigger, {}),
        /* @__PURE__ */ jsx(Separator, { orientation: "vertical", className: "mr-2 h-4" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-muted-foreground", children: auth?.email ?? "Faculty" }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => void handleLogout(), children: [
            /* @__PURE__ */ jsx(LogOut, { className: "size-4" }),
            "Logout"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex min-h-0 flex-1 flex-col p-4 md:p-6", children })
    ] })
  ] });
}
function FacultyShellLayout() {
  return /* @__PURE__ */ jsx(FacultyShell, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
export {
  FacultyShellLayout
};
