import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal/materials")({
  head: () => ({
    meta: [{ title: "Class Materials — Faculty — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/faculty/FacultyMaterialsView"),
    "FacultyMaterialsView",
  ),
});
