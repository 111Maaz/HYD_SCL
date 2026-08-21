import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/fees")({
  head: () => ({
    meta: [{ title: "Fees — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/FeesAdmin"),
    "FeesAdmin",
  ),
});
