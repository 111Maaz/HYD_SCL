import { createIsomorphicFn } from "@tanstack/react-start";

import { getAuthStateForUser, type AuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/services/supabase/env";

/**
 * Uses getUser() (verified with Auth server) — not getSession() from cookies alone.
 */
export const getAuthState = createIsomorphicFn()
  .client(async (): Promise<AuthState | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { createSupabaseBrowserClient } = await import("@/services/supabase/client");
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return getAuthStateForUser(supabase, data.user.id, data.user.email);
  })
  .server(async (): Promise<AuthState | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { createSupabaseServerClient } = await import("@/services/supabase.server");
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return getAuthStateForUser(supabase, data.user.id, data.user.email);
  });
