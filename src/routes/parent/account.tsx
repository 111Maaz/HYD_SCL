import { createFileRoute } from "@tanstack/react-router";

import { ParentAccountCentre } from "@/components/parent/ParentAccountCentre";

export const Route = createFileRoute("/parent/account")({
  head: () => ({
    meta: [{ title: "Account — Parent — Hyderabad School" }],
  }),
  component: ParentAccountPage,
});

function ParentAccountPage() {
  return <ParentAccountCentre />;
}
