import { createIsomorphicFn } from "@tanstack/react-start";

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
  const auth = await requireRole("faculty");
  await assertFacultyCanAccessPortal(auth.userId);
  return auth;
}
