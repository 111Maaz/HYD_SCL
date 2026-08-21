import { createFileRoute } from "@tanstack/react-router";

import { PortalLoginForm } from "@/components/auth/PortalLoginForm";
import { redirectIfAuthenticated } from "@/lib/route-guards";

export const Route = createFileRoute("/parent/login")({
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
  head: () => ({
    meta: [{ title: "Parent Login — Hyderabad School" }],
  }),
  component: ParentLoginPage,
});

function ParentLoginPage() {
  return <PortalLoginForm portal="parent" />;
}
