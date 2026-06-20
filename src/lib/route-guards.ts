import { redirect } from "@tanstack/react-router";

import { getAuthState } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function requireRole(role: UserRole) {
  const auth = await getAuthState();

  if (!auth) {
    throw redirect({ to: "/admin/login" });
  }

  if (auth.role !== role) {
    throw redirect({ to: auth.role === "admin" ? "/admin/dashboard" : "/faculty/portal/profile" });
  }

  return auth;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function redirectIfAuthenticated() {
  const auth = await getAuthState();

  if (!auth) {
    return null;
  }

  throw redirect({
    to: auth.role === "admin" ? "/admin/dashboard" : "/faculty/portal/profile",
  });
}
