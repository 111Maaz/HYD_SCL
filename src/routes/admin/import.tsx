import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/import")({
  head: () => ({
    meta: [{ title: "Import Centre — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/ImportCentreAdmin"),
    "ImportCentreAdmin",
  ),
});
