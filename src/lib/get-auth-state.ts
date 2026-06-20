import { createIsomorphicFn } from "@tanstack/react-start";

import { getAuthStateFromSession, type AuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/services/supabase/env";

export const getAuthState = createIsomorphicFn()
  .client(async (): Promise<AuthState | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { createSupabaseBrowserClient } = await import("@/services/supabase/client");
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return getAuthStateFromSession(supabase, data.session);
  })
  .server(async (): Promise<AuthState | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { createSupabaseServerClient } = await import("@/services/supabase.server");
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return getAuthStateFromSession(supabase, data.session);
  });
