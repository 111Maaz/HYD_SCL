import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/admissions")({
  head: () => ({
    meta: [{ title: "Admissions — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/AdmissionsAdmin"),
    "AdmissionsAdmin",
  ),
});
