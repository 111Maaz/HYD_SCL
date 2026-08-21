import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { getAdminHomePath } from "@/lib/admin-access";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import { isSupabaseConfigured } from "@/services/supabase/env";
import type { UserProfile, UserRole } from "@/types/database";
import {
  STAFF_ROLE_LABELS,
  appPortalForStaffRole,
  isInchargeRole,
  isStaffRoleKey,
  pickPrimaryStaffRoleKey,
  roleUsesAssignedClass,
  type StaffRoleKey,
} from "@/types/staff-roles";

export interface AuthState {
  userId: string;
  email: string;
  /** Portal bucket: admin shell | faculty portal | parent portal */
  role: UserRole;
  /** Primary ERP staff role key (null for parents) */
  staffRoleKey: StaffRoleKey | null;
  /** School-wide incharge stacked on Teacher/Staff */
  alsoInchargeRoleKey: StaffRoleKey | null;
  guardianId: string | null;
}

/** Role used for admin nav / path guards (incharge when teacher+incharge). */
export function effectiveAdminStaffRoleKey(auth: AuthState | null): StaffRoleKey | null {
  if (!auth) return null;
  if (auth.role !== "admin") return null;
  if (
    auth.alsoInchargeRoleKey &&
    (auth.staffRoleKey === "TEACHER" || auth.staffRoleKey === "STAFF")
  ) {
    return auth.alsoInchargeRoleKey;
  }
  return auth.staffRoleKey;
}

export type LoginPortal = "staff" | "parent";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function getLoginPath(role?: UserRole | null): "/admin/login" | "/parent/login" {
  return role === "parent" ? "/parent/login" : "/admin/login";
}

function parseStaffRoleKeys(values: unknown): StaffRoleKey[] {
  if (!Array.isArray(values)) return [];
  return values.filter((k): k is StaffRoleKey => typeof k === "string" && isStaffRoleKey(k));
}

async function fetchStaffRoleKeys(
  supabase: SupabaseClient,
  userId: string,
): Promise<StaffRoleKey[]> {
  // Prefer security-definer RPC — roles RLS requires roles.view which most staff lack.
  const { data: rpcKeys, error: rpcError } = await supabase.rpc("get_my_staff_role_keys");
  if (!rpcError) {
    const keys = parseStaffRoleKeys(rpcKeys);
    if (keys.length > 0) return keys;
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (staffError || !staff) return [];

  const { data: roles, error: rolesError } = await supabase
    .from("staff_roles")
    .select("roles ( role_key )")
    .eq("staff_id", staff.id)
    .eq("active", true);

  if (rolesError) return [];

  return (roles ?? [])
    .map((r) => (r.roles as { role_key: string } | null)?.role_key)
    .filter((k): k is StaffRoleKey => !!k && isStaffRoleKey(k));
}

function splitStaffRoles(roleKeys: StaffRoleKey[]): {
  staffRoleKey: StaffRoleKey | null;
  alsoInchargeRoleKey: StaffRoleKey | null;
  portalRole: UserRole;
} {
  const teaching = roleKeys.find((k) => roleUsesAssignedClass(k)) ?? null;
  const incharge = roleKeys.find((k) => isInchargeRole(k)) ?? null;
  const primary = pickPrimaryStaffRoleKey(roleKeys);

  if (teaching && incharge) {
    return { staffRoleKey: teaching, alsoInchargeRoleKey: incharge, portalRole: "admin" };
  }

  const portal = appPortalForStaffRole(primary);
  return {
    staffRoleKey: primary,
    alsoInchargeRoleKey: null,
    portalRole: portal ?? "faculty",
  };
}

async function fetchStaffProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  (UserProfile & {
    staffRoleKey: StaffRoleKey | null;
    alsoInchargeRoleKey: StaffRoleKey | null;
  }) | null
> {
  const { data: staff, error: staffError } = await supabase
    .from("staff_profiles")
    .select("email, status")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (staffError) {
    console.warn("fetchStaffProfile:", staffError.message);
    return null;
  }

  if (!staff || staff.status !== "ACTIVE") {
    return null;
  }

  const roleKeys = await fetchStaffRoleKeys(supabase, userId);
  const split = splitStaffRoles(roleKeys);

  if (!split.staffRoleKey && roleKeys.length === 0) {
    return null;
  }

  return {
    id: userId,
    email: staff.email ?? "",
    role: split.portalRole,
    created_at: "",
    staffRoleKey: split.staffRoleKey,
    alsoInchargeRoleKey: split.alsoInchargeRoleKey,
  };
}

async function fetchGuardianProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<(UserProfile & { guardianId: string }) | null> {
  const { data: guardian, error } = await supabase
    .from("guardians")
    .select("id, email, first_name, last_name, active")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("fetchGuardianProfile:", error.message);
    return null;
  }

  if (!guardian || !guardian.active) {
    return null;
  }

  return {
    id: userId,
    email: guardian.email ?? "",
    role: "parent",
    created_at: "",
    guardianId: guardian.id,
  };
}

async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  | (UserProfile & {
      staffRoleKey: StaffRoleKey | null;
      alsoInchargeRoleKey: StaffRoleKey | null;
      guardianId: string | null;
    })
  | null
> {
  const staff = await fetchStaffProfile(supabase, userId);
  if (staff) {
    return { ...staff, guardianId: null };
  }

  const parent = await fetchGuardianProfile(supabase, userId);
  if (parent) {
    return { ...parent, staffRoleKey: null, alsoInchargeRoleKey: null };
  }

  return null;
}

export async function getAuthStateFromSession(
  supabase: SupabaseClient,
  session: Session | null,
): Promise<AuthState | null> {
  if (!session?.user) {
    return null;
  }

  return getAuthStateForUser(supabase, session.user.id, session.user.email);
}

export async function getAuthStateForUser(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<AuthState | null> {
  try {
    const profile = await fetchUserProfile(supabase, userId);

    if (!profile) {
      return null;
    }

    return {
      userId: profile.id,
      email: profile.email || email || "",
      role: profile.role,
      staffRoleKey: profile.staffRoleKey,
      alsoInchargeRoleKey: profile.alsoInchargeRoleKey ?? null,
      guardianId: profile.guardianId,
    };
  } catch (error) {
    console.warn("getAuthStateForUser:", error);
    return null;
  }
}

export { getAuthState } from "@/lib/get-auth-state";

/**
 * Sign in with email/password. Role is detected from staff_roles or guardians.
 * `expectedPortal` keeps staff and parent logins separate (mentor: staff vs parent identity).
 */
export async function signIn(
  email: string,
  password: string,
  expectedPortal?: LoginPortal,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    throw new AuthError("Supabase is not configured.");
  }

  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthError(error.message);
  }

  const profile = await fetchUserProfile(supabase, data.user.id);

  if (!profile) {
    await supabase.auth.signOut();
    throw new AuthError(
      "No active staff or parent profile found for this account. Contact the school office.",
    );
  }

  if (expectedPortal === "parent" && profile.role !== "parent") {
    await supabase.auth.signOut();
    throw new AuthError("This is a staff account. Please use Staff Login.");
  }

  if (expectedPortal === "staff" && profile.role === "parent") {
    await supabase.auth.signOut();
    throw new AuthError("This is a parent account. Please use Parent Login.");
  }

  if (profile.role === "faculty") {
    const { assertFacultyPortalAccess } = await import("@/services/faculty-portal");
    try {
      await assertFacultyPortalAccess(supabase, data.user.id);
    } catch (err) {
      await supabase.auth.signOut();
      throw err instanceof AuthError
        ? err
        : new AuthError("Unable to verify faculty portal access.");
    }
  }

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    staffRoleKey: profile.staffRoleKey,
    alsoInchargeRoleKey: profile.alsoInchargeRoleKey ?? null,
    guardianId: profile.guardianId,
  };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthError(error.message);
  }
}

export function getDashboardPath(
  role: UserRole,
  staffRoleKey?: StaffRoleKey | null,
  alsoInchargeRoleKey?: StaffRoleKey | null,
): string {
  if (role === "parent") return "/parent/children";
  if (role === "faculty") return "/faculty/portal/home";
  const adminKey =
    alsoInchargeRoleKey && (staffRoleKey === "TEACHER" || staffRoleKey === "STAFF")
      ? alsoInchargeRoleKey
      : staffRoleKey;
  return getAdminHomePath(adminKey ?? null);
}

export function getStaffRoleLabel(staffRoleKey: StaffRoleKey | null | undefined): string {
  if (!staffRoleKey) return "Staff";
  return STAFF_ROLE_LABELS[staffRoleKey];
}

export function resolvePortalFromStaffRole(
  staffRoleKey: StaffRoleKey | null,
): Exclude<UserRole, "parent"> | null {
  return appPortalForStaffRole(staffRoleKey);
}
