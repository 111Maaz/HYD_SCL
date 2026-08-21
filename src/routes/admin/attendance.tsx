import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/attendance")({
  head: () => ({
    meta: [{ title: "Attendance allotment — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/AttendanceAllotmentAdmin"),
    "AttendanceAllotmentAdmin",
  ),
});
