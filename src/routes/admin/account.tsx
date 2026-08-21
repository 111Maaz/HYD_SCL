import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/account")({
  head: () => ({
    meta: [{ title: "Account centre — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/portal/AccountCentre"),
    "AccountCentre",
  ),
});
