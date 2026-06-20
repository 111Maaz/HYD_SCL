import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal/profile")({
  head: () => ({
    meta: [{ title: "My Profile — Faculty — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/faculty/FacultyProfileView"),
    "FacultyProfileView",
  ),
});
