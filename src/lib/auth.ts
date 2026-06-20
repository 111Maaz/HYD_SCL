import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/services/supabase/client";
import { isSupabaseConfigured } from "@/services/supabase/env";
import type { UserProfile, UserRole } from "@/types/database";

export interface AuthState {
  userId: string;
  email: string;
  role: UserRole;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new AuthError(error.message);
  }

  return data;
}

export async function getAuthStateFromSession(
  supabase: SupabaseClient,
  session: Session | null,
): Promise<AuthState | null> {
  if (!session?.user) {
    return null;
  }

  const profile = await fetchUserProfile(supabase, session.user.id);

  if (!profile) {
    return null;
  }

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  };
}

export { getAuthState } from "@/lib/get-auth-state";

export async function signIn(
  email: string,
  password: string,
  selectedRole: UserRole,
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
    throw new AuthError("No user profile found. Contact your administrator.");
  }

  if (profile.role !== selectedRole) {
    await supabase.auth.signOut();
    throw new AuthError(
      `This account is registered as ${profile.role}. Select the correct role to continue.`,
    );
  }

  if (profile.role === "faculty") {
    const { assertFacultyPortalAccess } = await import("@/services/faculty-portal");
    try {
      await assertFacultyPortalAccess(supabase, data.user.id);
    } catch (error) {
      await supabase.auth.signOut();
      throw error instanceof AuthError
        ? error
        : new AuthError("Unable to verify faculty portal access.");
    }
  }

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
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

export function getDashboardPath(role: UserRole): "/admin/dashboard" | "/faculty/portal/profile" {
  return role === "admin" ? "/admin/dashboard" : "/faculty/portal/profile";
}
