import { Outlet, createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal")({
  component: lazyRouteComponent(
    () => import("@/routes/faculty/-faculty-portal-layout"),
    "FacultyShellLayout",
  ),
});
