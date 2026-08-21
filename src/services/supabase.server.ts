import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/start-server-core/request-response";
import type { SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

import { getServerConfig } from "@/lib/config.server";
import type { Database } from "@/types/database";

const serverRealtimeOptions = {
  realtime: {
    transport: ws,
  },
} as const;

function readPublicSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

export function createSupabaseServerClient(): SupabaseClient<Database> {
  const { url, anonKey } = readPublicSupabaseEnv();
  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });
      },
    },
  });
}

/** Service-role client for admin provisioning (auth.admin, bypass RLS). Server-only. */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const config = getServerConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env file to provision faculty accounts.",
    );
  }

  return createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...serverRealtimeOptions,
  });
}
