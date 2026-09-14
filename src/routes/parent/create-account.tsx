import { createFileRoute } from "@tanstack/react-router";

import { ParentCreateAccountForm } from "@/components/auth/ParentCreateAccountForm";
import { redirectIfAuthenticated } from "@/lib/route-guards";

export const Route = createFileRoute("/parent/create-account")({
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
  head: () => ({ meta: [{ title: "Create Parent Account — Hyderabad School" }] }),
  component: ParentCreateAccountPage,
});

function ParentCreateAccountPage() {
  return <ParentCreateAccountForm />;
}
