import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AuthError } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/services/supabase.server";
import type { StaffProfile } from "@/types/database";
import {
  ASSIGNABLE_STAFF_ROLE_KEYS,
  INCHARGE_ROLE_KEYS,
  isInchargeRole,
  isSchoolWideStaffRole,
  pickPrimaryStaffRoleKey,
  roleUsesAssignedClass,
  type StaffRoleKey,
} from "@/types/staff-roles";

const staffRoleKeySchema = z.enum(
  ASSIGNABLE_STAFF_ROLE_KEYS as unknown as [StaffRoleKey, ...StaffRoleKey[]],
);

const inchargeRoleKeySchema = z.enum(
  INCHARGE_ROLE_KEYS as unknown as [StaffRoleKey, ...StaffRoleKey[]],
);

const classNumberSchema = z.number().int().min(1).max(10);

function refineStaffAssignment<
  T extends {
    staffRoleKey?: StaffRoleKey;
    assignedClass?: number | null;
    alsoInchargeRoleKey?: StaffRoleKey | null;
  },
>(data: T, ctx: z.RefinementCtx) {
  const staffRoleKey = data.staffRoleKey ?? "TEACHER";

  if (isSchoolWideStaffRole(staffRoleKey)) {
    if (data.alsoInchargeRoleKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "School-wide roles cannot stack another incharge. Pick Teacher/Staff to add a class + incharge.",
        path: ["alsoInchargeRoleKey"],
      });
    }
    return;
  }

  if (roleUsesAssignedClass(staffRoleKey) && staffRoleKey === "TEACHER") {
    if (data.assignedClass == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Teachers must have an assigned class.",
        path: ["assignedClass"],
      });
    }
  }

  if (data.alsoInchargeRoleKey && !isInchargeRole(data.alsoInchargeRoleKey)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Additional duty must be an incharge role.",
      path: ["alsoInchargeRoleKey"],
    });
  }
}

const createFacultyAccountSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    name: z.string().trim().min(2).max(100),
    role: z.string().trim().min(2).max(100),
    bio: z.string().trim().max(1000).optional(),
    /** Null for school-wide roles (VP / incharges). Required for Teacher. */
    assignedClass: classNumberSchema.nullable().optional(),
    /** ERP role_key from public.roles — defaults to TEACHER */
    staffRoleKey: staffRoleKeySchema.default("TEACHER"),
    /** Optional school-wide incharge stacked on Teacher/Staff. */
    alsoInchargeRoleKey: inchargeRoleKeySchema.nullable().optional(),
  })
  .superRefine(refineStaffAssignment);

export type CreateFacultyAccountInput = z.infer<typeof createFacultyAccountSchema>;

const updateFacultyAccountSchema = z
  .object({
    profileId: z.string().uuid(),
    name: z.string().trim().min(2).max(100),
    role: z.string().trim().min(2).max(100),
    bio: z.string().trim().max(1000).optional(),
    assignedClass: classNumberSchema.nullable().optional(),
    staffRoleKey: staffRoleKeySchema.optional(),
    alsoInchargeRoleKey: inchargeRoleKeySchema.nullable().optional(),
  })
  .superRefine(refineStaffAssignment);

export type UpdateFacultyAccountInput = z.infer<typeof updateFacultyAccountSchema>;

export type StaffAccountRow = StaffProfile & {
  staff_role_key: StaffRoleKey | null;
  /** Extra school-wide incharge when the person is also Teacher/Staff. */
  also_incharge_role_key: StaffRoleKey | null;
};

async function requireAdminOnServer() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthError("You must be signed in as an administrator.");
  }

  const { data: role, error: roleError } = await supabase.rpc("get_app_role");

  if (roleError) {
    throw new AuthError(roleError.message);
  }

  if (role !== "admin") {
    throw new AuthError("Only administrators can manage staff accounts.");
  }

  return user;
}

function resolveAssignedClass(
  staffRoleKey: StaffRoleKey,
  assignedClass: number | null | undefined,
): number | null {
  if (!roleUsesAssignedClass(staffRoleKey)) return null;
  return assignedClass ?? null;
}

function resolveActiveRoleKeys(
  staffRoleKey: StaffRoleKey,
  alsoInchargeRoleKey?: StaffRoleKey | null,
): StaffRoleKey[] {
  const keys: StaffRoleKey[] = [staffRoleKey];
  if (
    roleUsesAssignedClass(staffRoleKey) &&
    alsoInchargeRoleKey &&
    isInchargeRole(alsoInchargeRoleKey)
  ) {
    keys.push(alsoInchargeRoleKey);
  }
  return keys;
}

/** Set exactly these roles active; deactivate any other active roles for the staff member. */
async function assignStaffRoles(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  staffId: string,
  roleKeys: StaffRoleKey[],
) {
  const uniqueKeys = [...new Set(roleKeys)];
  const roleIds: string[] = [];

  for (const roleKey of uniqueKeys) {
    const { data: roleRow, error: roleError } = await adminClient
      .from("roles")
      .select("id")
      .eq("role_key", roleKey)
      .maybeSingle();

    if (roleError || !roleRow?.id) {
      throw new AuthError(`Role ${roleKey} is not seeded in the database.`);
    }
    roleIds.push(roleRow.id);
  }

  // Deactivate all currently active roles, then ensure desired ones are active.
  // ends_at must be strictly after starts_at (staff_role_dates_valid) — bump by 1s
  // so same-second create+deactivate from the auth trigger does not fail.
  const { error: deactivateError } = await adminClient
    .from("staff_roles")
    .update({ active: false, ends_at: new Date(Date.now() + 1000).toISOString() })
    .eq("staff_id", staffId)
    .eq("active", true);

  if (deactivateError) {
    throw new AuthError(deactivateError.message || "Failed to update staff roles.");
  }

  for (const roleId of roleIds) {
    const { data: existingRow } = await adminClient
      .from("staff_roles")
      .select("id")
      .eq("staff_id", staffId)
      .eq("role_id", roleId)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRow) {
      const { error: reactivateError } = await adminClient
        .from("staff_roles")
        .update({ active: true, ends_at: null, starts_at: new Date().toISOString() })
        .eq("id", existingRow.id);
      if (reactivateError) {
        throw new AuthError(reactivateError.message || "Failed to reactivate staff role.");
      }
      continue;
    }

    const { error: insertError } = await adminClient.from("staff_roles").insert({
      staff_id: staffId,
      role_id: roleId,
      active: true,
    });

    if (insertError) {
      throw new AuthError(insertError.message || "Failed to assign staff role.");
    }
  }
}

function appMetaRole(roleKeys: StaffRoleKey[]): "admin" | "faculty" {
  const primary = pickPrimaryStaffRoleKey(roleKeys);
  if (!primary || primary === "TEACHER" || primary === "STAFF") return "faculty";
  return "admin";
}

function splitListedRoles(activeKeys: StaffRoleKey[]): {
  staff_role_key: StaffRoleKey | null;
  also_incharge_role_key: StaffRoleKey | null;
} {
  const primary = pickPrimaryStaffRoleKey(activeKeys);
  const teaching = activeKeys.find((k) => roleUsesAssignedClass(k)) ?? null;
  const incharge = activeKeys.find((k) => isInchargeRole(k)) ?? null;

  // Teacher/Staff + incharge: show teaching as base, incharge as also_
  if (teaching && incharge) {
    return { staff_role_key: teaching, also_incharge_role_key: incharge };
  }

  return { staff_role_key: primary, also_incharge_role_key: null };
}

export const createFacultyAccountFn = createServerFn({ method: "POST" })
  .validator(createFacultyAccountSchema)
  .handler(async ({ data }): Promise<StaffProfile> => {
    await requireAdminOnServer();

    let adminClient;
    try {
      adminClient = createSupabaseAdminClient();
    } catch (error) {
      throw new AuthError(
        error instanceof Error
          ? error.message
          : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment to provision staff accounts.",
      );
    }

    const staffRoleKey = data.staffRoleKey ?? "TEACHER";
    const roleKeys = resolveActiveRoleKeys(staffRoleKey, data.alsoInchargeRoleKey);
    const assignedClass = resolveAssignedClass(staffRoleKey, data.assignedClass);
    const metaRole = appMetaRole(roleKeys);

    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: metaRole,
        name: data.name,
        staff_role_key: pickPrimaryStaffRoleKey(roleKeys),
      },
    });

    if (createError || !authData.user) {
      throw new AuthError(createError?.message ?? "Failed to create staff auth account.");
    }

    const { data: existingProfile } = await adminClient
      .from("staff_profiles")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    let profile: StaffProfile | null = null;

    if (existingProfile) {
      const { data: updated, error: updateError } = await adminClient
        .from("staff_profiles")
        .update({
          first_name: data.name,
          email: data.email,
          designation: data.role,
          bio: data.bio?.trim() ? data.bio.trim() : null,
          assigned_class: assignedClass,
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (updateError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new AuthError(updateError.message ?? "Failed to update staff profile.");
      }

      profile = updated;
      await assignStaffRoles(adminClient, existingProfile.id, roleKeys);
    } else {
      const { data: inserted, error: profileError } = await adminClient
        .from("staff_profiles")
        .insert({
          auth_user_id: authData.user.id,
          first_name: data.name,
          email: data.email,
          designation: data.role,
          bio: data.bio?.trim() ? data.bio.trim() : null,
          assigned_class: assignedClass,
          status: "ACTIVE",
        })
        .select()
        .single();

      if (profileError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new AuthError(profileError.message ?? "Failed to create staff profile.");
      }

      profile = inserted;
      await assignStaffRoles(adminClient, inserted.id, roleKeys);
    }

    return profile!;
  });

export const listFacultyProfilesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StaffAccountRow[]> => {
    await requireAdminOnServer();

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("staff_profiles")
      .select(
        `
        *,
        staff_roles (
          active,
          roles (
            role_key
          )
        )
      `,
      )
      .not("auth_user_id", "is", null)
      .order("first_name", { ascending: true });

    if (error) {
      throw new AuthError(error.message ?? "Failed to load staff accounts.");
    }

    return (data ?? []).map((row) => {
      const roles = (row.staff_roles ?? []) as Array<{
        active: boolean;
        roles: { role_key: string } | null;
      }>;
      const activeKeys = roles
        .filter((r) => r.active && r.roles?.role_key)
        .map((r) => r.roles!.role_key as StaffRoleKey);
      const split = splitListedRoles(activeKeys);
      const { staff_roles: _ignored, ...profile } = row as StaffProfile & {
        staff_roles?: unknown;
      };
      return {
        ...(profile as StaffProfile),
        staff_role_key: split.staff_role_key,
        also_incharge_role_key: split.also_incharge_role_key,
      };
    });
  },
);

export const updateFacultyAccountFn = createServerFn({ method: "POST" })
  .validator(updateFacultyAccountSchema)
  .handler(async ({ data }): Promise<StaffProfile> => {
    await requireAdminOnServer();

    const supabase = createSupabaseServerClient();
    const { data: existing, error: existingError } = await supabase
      .from("staff_profiles")
      .select("auth_user_id")
      .eq("id", data.profileId)
      .single();

    if (existingError || !existing?.auth_user_id) {
      throw new AuthError(existingError?.message ?? "Staff account not found.");
    }

    const staffRoleKey = data.staffRoleKey ?? "TEACHER";
    const assignedClass = resolveAssignedClass(staffRoleKey, data.assignedClass);
    const roleKeys = resolveActiveRoleKeys(staffRoleKey, data.alsoInchargeRoleKey);

    const { data: profile, error } = await supabase
      .from("staff_profiles")
      .update({
        first_name: data.name,
        designation: data.role,
        bio: data.bio?.trim() ? data.bio.trim() : null,
        assigned_class: assignedClass,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.profileId)
      .select()
      .single();

    if (error) {
      throw new AuthError(error.message ?? "Failed to update staff account.");
    }

    try {
      const adminClient = createSupabaseAdminClient();

      if (data.staffRoleKey) {
        await assignStaffRoles(adminClient, data.profileId, roleKeys);
      }

      const metaRole = appMetaRole(roleKeys);

      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        existing.auth_user_id,
        {
          user_metadata: {
            role: metaRole,
            name: data.name,
            staff_role_key: pickPrimaryStaffRoleKey(roleKeys),
          },
        },
      );

      if (authUpdateError) {
        console.warn("Staff profile updated but auth metadata sync failed:", authUpdateError.message);
      }
    } catch {
      // Profile update succeeded; role/metadata sync requires service role key.
    }

    return profile;
  });

const setFacultyAccountActiveSchema = z.object({
  profileId: z.string().uuid(),
  isActive: z.boolean(),
});

export const setFacultyAccountActiveFn = createServerFn({ method: "POST" })
  .validator(setFacultyAccountActiveSchema)
  .handler(async ({ data }): Promise<StaffProfile> => {
    await requireAdminOnServer();

    let adminClient;
    try {
      adminClient = createSupabaseAdminClient();
    } catch (error) {
      throw new AuthError(
        error instanceof Error
          ? error.message
          : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment to manage staff accounts.",
      );
    }

    const { data: profile, error } = await adminClient
      .from("staff_profiles")
      .update({
        status: data.isActive ? "ACTIVE" : "INACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.profileId)
      .select()
      .single();

    if (error) {
      throw new AuthError(error.message ?? "Failed to update staff account status.");
    }

    return profile;
  });
