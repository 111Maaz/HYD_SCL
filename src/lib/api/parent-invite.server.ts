import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AuthError } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/services/supabase.server";
import type { Guardian } from "@/types/guardians";

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
    throw new AuthError("Only administrators can invite parents.");
  }

  return user;
}

const inviteParentSchema = z.object({
  guardianId: z.string().uuid(),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export type InviteParentInput = z.infer<typeof inviteParentSchema>;

export type InviteParentResult = {
  guardian: Guardian;
  email: string;
  temporaryPassword: string;
  createdNewAuthUser: boolean;
};

/**
 * Create (or reuse) an auth user for a guardian and set guardians.auth_user_id.
 * Admin shares the temporary password out-of-band (WhatsApp / print slip).
 */
export const inviteParentAccountFn = createServerFn({ method: "POST" })
  .validator(inviteParentSchema)
  .handler(async ({ data }): Promise<InviteParentResult> => {
    await requireAdminOnServer();

    let adminClient;
    try {
      adminClient = createSupabaseAdminClient();
    } catch (error) {
      throw new AuthError(
        error instanceof Error
          ? error.message
          : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to invite parents.",
      );
    }

    const { data: guardian, error: guardianError } = await adminClient
      .from("guardians")
      .select("*")
      .eq("id", data.guardianId)
      .single();

    if (guardianError || !guardian) {
      throw new AuthError(guardianError?.message ?? "Guardian not found.");
    }

    if (!guardian.active) {
      throw new AuthError("Cannot invite an inactive guardian.");
    }

    const email = guardian.email?.trim().toLowerCase();
    if (!email) {
      throw new AuthError("Guardian needs an email address before inviting.");
    }

    if (guardian.auth_user_id) {
      const { error: pwdError } = await adminClient.auth.admin.updateUserById(
        guardian.auth_user_id,
        {
          password: data.password,
          email_confirm: true,
          user_metadata: {
            role: "parent",
            name: [guardian.first_name, guardian.last_name].filter(Boolean).join(" "),
            guardian_id: guardian.id,
          },
        },
      );

      if (pwdError) {
        throw new AuthError(pwdError.message || "Failed to reset parent password.");
      }

      return {
        guardian,
        email,
        temporaryPassword: data.password,
        createdNewAuthUser: false,
      };
    }

    // Reuse existing auth user with same email if present
    const { data: listed } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existingAuth = listed?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    let authUserId: string;
    let createdNewAuthUser = false;

    if (existingAuth) {
      // Ensure not already linked to staff
      const { data: staffHit } = await adminClient
        .from("staff_profiles")
        .select("id")
        .eq("auth_user_id", existingAuth.id)
        .maybeSingle();

      if (staffHit) {
        throw new AuthError(
          "This email belongs to a staff account. Use a different parent email.",
        );
      }

      const { data: otherGuardian } = await adminClient
        .from("guardians")
        .select("id")
        .eq("auth_user_id", existingAuth.id)
        .neq("id", guardian.id)
        .maybeSingle();

      if (otherGuardian) {
        throw new AuthError(
          "This email is already linked to another guardian account.",
        );
      }

      authUserId = existingAuth.id;
      const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
        password: data.password,
        email_confirm: true,
        user_metadata: {
          role: "parent",
          name: [guardian.first_name, guardian.last_name].filter(Boolean).join(" "),
          guardian_id: guardian.id,
        },
      });

      if (updateError) {
        throw new AuthError(updateError.message || "Failed to update parent auth user.");
      }
    } else {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          role: "parent",
          name: [guardian.first_name, guardian.last_name].filter(Boolean).join(" "),
          guardian_id: guardian.id,
        },
      });

      if (createError || !created.user) {
        throw new AuthError(createError?.message ?? "Failed to create parent login.");
      }

      authUserId = created.user.id;
      createdNewAuthUser = true;
    }

    const { data: updated, error: linkError } = await adminClient
      .from("guardians")
      .update({
        auth_user_id: authUserId,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guardian.id)
      .select()
      .single();

    if (linkError || !updated) {
      if (createdNewAuthUser) {
        await adminClient.auth.admin.deleteUser(authUserId);
      }
      throw new AuthError(linkError?.message ?? "Failed to link parent login to guardian.");
    }

    return {
      guardian: updated,
      email,
      temporaryPassword: data.password,
      createdNewAuthUser,
    };
  });
