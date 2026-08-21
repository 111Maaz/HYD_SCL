import { createIsomorphicFn } from "@tanstack/react-start";
import { isRedirect, redirect } from "@tanstack/react-router";

import { requireRole } from "@/lib/route-guards";
import { isSupabaseConfigured } from "@/services/supabase/env";

const assertFacultyCanAccessPortal = createIsomorphicFn()
  .client(async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const { createSupabaseBrowserClient } = await import("@/services/supabase/client");
    const { assertFacultyPortalAccess } = await import("@/services/faculty-portal");
    await assertFacultyPortalAccess(createSupabaseBrowserClient(), userId);
  })
  .server(async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const { createSupabaseServerClient } = await import("@/services/supabase.server");
    const { assertFacultyPortalAccess } = await import("@/services/faculty-portal");
    await assertFacultyPortalAccess(createSupabaseServerClient(), userId);
  });

export async function requireFaculty() {
  try {
    const auth = await requireRole("faculty");
    await assertFacultyCanAccessPortal(auth.userId);
    return auth;
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.warn("requireFaculty:", error);
    throw redirect({ to: "/admin/login" as const });
  }
}
