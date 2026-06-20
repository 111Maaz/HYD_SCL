import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/class-materials")({
  head: () => ({
    meta: [{ title: "Class Materials — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/ClassMaterialsAdmin"),
    "ClassMaterialsAdmin",
  ),
});
