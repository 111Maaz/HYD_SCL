import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [{ title: "Students — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/StudentsAdmin"),
    "StudentsAdmin",
  ),
});
