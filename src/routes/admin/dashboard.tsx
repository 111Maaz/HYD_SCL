import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/AdminDashboard"),
    "AdminDashboard",
  ),
});
