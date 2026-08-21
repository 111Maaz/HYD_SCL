import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [{ title: "Audit — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/AuditAdmin"),
    "AuditAdmin",
  ),
});
