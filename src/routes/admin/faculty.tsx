import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/faculty")({
  head: () => ({
    meta: [{ title: "Faculty — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(() => import("@/components/admin/FacultyAdmin"), "FacultyAdmin"),
});
