import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty/portal/")({
  beforeLoad: () => {
    throw redirect({ to: "/faculty/portal/home" });
  },
});
