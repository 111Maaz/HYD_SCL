import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/year-end")({
  head: () => ({
    meta: [{ title: "Year-end — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/YearEndWizardAdmin"),
    "YearEndWizardAdmin",
  ),
});
