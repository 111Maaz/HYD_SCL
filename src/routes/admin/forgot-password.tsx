import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const Route = createFileRoute("/admin/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot password — Hyderabad School" }],
  }),
  component: AdminForgotPasswordPage,
});

function AdminForgotPasswordPage() {
  return <ForgotPasswordForm portal="staff" />;
}
