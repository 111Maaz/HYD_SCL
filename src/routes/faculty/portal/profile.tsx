import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/faculty/portal/account" });
  },
  component: () => null,
});
