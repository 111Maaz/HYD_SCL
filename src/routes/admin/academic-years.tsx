import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/academic-years")({
  head: () => ({
    meta: [{ title: "Academic Years — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/AcademicYearsAdmin"),
    "AcademicYearsAdmin",
  ),
});
