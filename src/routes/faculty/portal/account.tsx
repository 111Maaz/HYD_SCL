import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal/account")({
  head: () => ({
    meta: [{ title: "Account centre — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/portal/AccountCentre"),
    "AccountCentre",
  ),
});
