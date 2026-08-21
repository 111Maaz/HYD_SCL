import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/academic-structure")({
  head: () => ({
    meta: [{ title: "Academic Structure — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/AcademicStructureAdmin"),
    "AcademicStructureAdmin",
  ),
});
