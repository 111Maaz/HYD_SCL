import { isRedirect, redirect } from "@tanstack/react-router";

import { canAccessAdminPath, getAdminHomePath } from "@/lib/admin-access";
import {
  effectiveAdminStaffRoleKey,
  getAuthState,
  getDashboardPath,
  getLoginPath,
} from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function requireRole(role: UserRole) {
  try {
    const auth = await getAuthState();

    if (!auth) {
      throw redirect({ to: getLoginPath(role) });
    }

    if (auth.role !== role) {
      throw redirect({
        to: getDashboardPath(auth.role, auth.staffRoleKey, auth.alsoInchargeRoleKey),
      });
    }

    return auth;
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.warn("requireRole:", error);
    throw redirect({ to: getLoginPath(role) });
  }
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireAdminPath(pathname: string) {
  const auth = await requireAdmin();
  const roleKey = effectiveAdminStaffRoleKey(auth);

  if (!canAccessAdminPath(roleKey, pathname)) {
    throw redirect({ to: getAdminHomePath(roleKey) });
  }

  return auth;
}

export async function requireParent() {
  return requireRole("parent");
}

export async function redirectIfAuthenticated() {
  try {
    const auth = await getAuthState();

    if (!auth) {
      return null;
    }

    throw redirect({
      to: getDashboardPath(auth.role, auth.staffRoleKey, auth.alsoInchargeRoleKey),
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.warn("redirectIfAuthenticated:", error);
    return null;
  }
}
