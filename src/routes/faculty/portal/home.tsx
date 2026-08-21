import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal/home")({
  head: () => ({
    meta: [{ title: "Teacher home — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/faculty/TeacherHome"),
    "TeacherHome",
  ),
});
