import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const Route = createFileRoute("/parent/reset-password")({
  head: () => ({
    meta: [{ title: "Set new password — Hyderabad School" }],
  }),
  component: ParentResetPasswordPage,
});

function ParentResetPasswordPage() {
  return <ForgotPasswordForm portal="parent" startOnRecovery />;
}
