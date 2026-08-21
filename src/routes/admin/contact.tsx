import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({
    meta: [{ title: "Contact — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(
    () => import("@/components/admin/ContactEnquiriesAdmin"),
    "ContactEnquiriesAdmin",
  ),
});
