import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/guardians")({
  head: () => ({
    meta: [{ title: "Guardians — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/GuardiansAdmin"),
    "GuardiansAdmin",
  ),
});
