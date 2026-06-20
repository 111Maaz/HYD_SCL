import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { createSupabaseBrowserClient, getSupabaseBrowserClient } from "./supabase/client";

export { isSupabaseConfigured } from "./supabase/env";
export { createSupabaseBrowserClient, getSupabaseBrowserClient } from "./supabase/client";

/** Lazy browser client — null during SSR. Prefer requireSupabase() in client code. */
export function getSupabase(): SupabaseClient<Database> | null {
  return getSupabaseBrowserClient();
}

export function requireSupabase(): SupabaseClient<Database> {
  return createSupabaseBrowserClient();
}
