import { createFileRoute } from "@tanstack/react-router";

import { PortalLoginForm } from "@/components/auth/PortalLoginForm";
import { redirectIfAuthenticated } from "@/lib/route-guards";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
  head: () => ({
    meta: [{ title: "Staff Login — Hyderabad School" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return <PortalLoginForm portal="staff" />;
}
