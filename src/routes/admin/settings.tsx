import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(() => import("@/routes/admin/-settings-view"), "AdminSettingsView"),
});
