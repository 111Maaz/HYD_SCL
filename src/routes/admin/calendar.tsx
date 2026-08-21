import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/calendar")({
  head: () => ({
    meta: [{ title: "Calendar — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/CalendarAdmin"),
    "CalendarAdmin",
  ),
});
