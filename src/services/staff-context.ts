import { requireSupabase } from "@/services/supabase";

export async function getCurrentStaffProfileId(): Promise<string | null> {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return null;

  const { data, error } = await client
    .from("staff_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to resolve staff profile.");
  }

  return data?.id ?? null;
}
