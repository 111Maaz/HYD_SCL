import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const Route = createFileRoute("/parent/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot password — Hyderabad School" }],
  }),
  component: ParentForgotPasswordPage,
});

function ParentForgotPasswordPage() {
  return <ForgotPasswordForm portal="parent" />;
}
