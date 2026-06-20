import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AuthError } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/services/supabase.server";
import type { FacultyProfile } from "@/types/database";

const createFacultyAccountSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(1000).optional(),
  assignedClass: z.number().int().min(1).max(10),
});

export type CreateFacultyAccountInput = z.infer<typeof createFacultyAccountSchema>;

const updateFacultyAccountSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(1000).optional(),
  assignedClass: z.number().int().min(1).max(10),
});

export type UpdateFacultyAccountInput = z.infer<typeof updateFacultyAccountSchema>;

async function requireAdminOnServer() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthError("You must be signed in as an administrator.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new AuthError(profileError.message);
  }

  if (!profile || profile.role !== "admin") {
    throw new AuthError("Only administrators can create faculty accounts.");
  }

  return user;
}

export const createFacultyAccountFn = createServerFn({ method: "POST" })
  .validator(createFacultyAccountSchema)
  .handler(async ({ data }): Promise<FacultyProfile> => {
    await requireAdminOnServer();

    let adminClient;
    try {
      adminClient = createSupabaseAdminClient();
    } catch (error) {
      throw new AuthError(
        error instanceof Error
          ? error.message
          : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment to provision faculty accounts.",
      );
    }

    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: "faculty",
        name: data.name,
      },
    });

    if (createError || !authData.user) {
      throw new AuthError(createError?.message ?? "Failed to create faculty auth account.");
    }

    const { data: profile, error: profileError } = await adminClient
      .from("faculty_profiles")
      .insert({
        user_id: authData.user.id,
        name: data.name,
        role: data.role,
        bio: data.bio?.trim() ? data.bio.trim() : null,
        assigned_class: data.assignedClass,
      })
      .select()
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new AuthError(profileError.message ?? "Failed to create faculty profile.");
    }

    return profile;
  });

export const listFacultyProfilesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<FacultyProfile[]> => {
    await requireAdminOnServer();

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("faculty_profiles")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new AuthError(error.message ?? "Failed to load faculty accounts.");
    }

    return data ?? [];
  },
);

export const updateFacultyAccountFn = createServerFn({ method: "POST" })
  .validator(updateFacultyAccountSchema)
  .handler(async ({ data }): Promise<FacultyProfile> => {
    await requireAdminOnServer();

    const supabase = createSupabaseServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("faculty_profiles")
      .select("user_id")
      .eq("id", data.profileId)
      .single();

    if (existingError || !existing) {
      throw new AuthError(existingError?.message ?? "Faculty account not found.");
    }

    const { data: profile, error } = await supabase
      .from("faculty_profiles")
      .update({
        name: data.name,
        role: data.role,
        bio: data.bio?.trim() ? data.bio.trim() : null,
        assigned_class: data.assignedClass,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.profileId)
      .select()
      .single();

    if (error) {
      throw new AuthError(error.message ?? "Failed to update faculty account.");
    }

    try {
      const adminClient = createSupabaseAdminClient();
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        existing.user_id,
        {
          user_metadata: {
            role: "faculty",
            name: data.name,
          },
        },
      );

      if (authUpdateError) {
        console.warn("Faculty profile updated but auth metadata sync failed:", authUpdateError.message);
      }
    } catch {
      // Profile update succeeded; metadata sync requires service role key.
    }

    return profile;
  });

const setFacultyAccountActiveSchema = z.object({
  profileId: z.string().uuid(),
  isActive: z.boolean(),
});

export const setFacultyAccountActiveFn = createServerFn({ method: "POST" })
  .validator(setFacultyAccountActiveSchema)
  .handler(async ({ data }): Promise<FacultyProfile> => {
    await requireAdminOnServer();

    let adminClient;
    try {
      adminClient = createSupabaseAdminClient();
    } catch (error) {
      throw new AuthError(
        error instanceof Error
          ? error.message
          : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment to manage faculty accounts.",
      );
    }

    const { data: profile, error } = await adminClient
      .from("faculty_profiles")
      .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
      .eq("id", data.profileId)
      .select()
      .single();

    if (error) {
      throw new AuthError(error.message ?? "Failed to update faculty account status.");
    }

    return profile;
  });
