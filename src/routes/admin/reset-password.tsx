import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [{ title: "Set new password — Hyderabad School" }],
  }),
  component: AdminResetPasswordPage,
});

function AdminResetPasswordPage() {
  return <ForgotPasswordForm portal="staff" startOnRecovery />;
}
