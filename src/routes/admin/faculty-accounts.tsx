import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/faculty-accounts")({
  head: () => ({
    meta: [{ title: "Faculty Accounts — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/FacultyAccountsAdmin"),
    "FacultyAccountsAdmin",
  ),
});
