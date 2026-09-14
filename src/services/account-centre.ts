import { AuthError } from "@/lib/auth";
import { deleteFileByUrl, uploadFile } from "@/services/storage";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import { requireSupabase } from "@/services/supabase";
import type { StaffProfile } from "@/types/database";

const STAFF_PHOTOS_BUCKET = "staff-photos";

export type AccountCentreUpdate = {
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  bio?: string | null;
  designation?: string | null;
};

export async function updateOwnAccountProfile(
  authUserId: string,
  input: AccountCentreUpdate,
): Promise<StaffProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName?.trim() || null,
      phone: input.phone?.trim() || null,
      bio: input.bio?.trim() || null,
      designation: input.designation?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_user_id", authUserId)
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to update profile.");
  return data;
}

export async function uploadOwnStaffPhoto(
  authUserId: string,
  file: File,
  previousUrl?: string | null,
): Promise<string> {
  const url = await uploadFile(STAFF_PHOTOS_BUCKET, file, authUserId);
  const client = requireSupabase();
  const { error } = await client
    .from("staff_profiles")
    .update({ photo_url: url, updated_at: new Date().toISOString() })
    .eq("auth_user_id", authUserId);

  if (error) throw new Error(error.message || "Failed to save photo.");

  if (previousUrl && previousUrl !== url) {
    try {
      await deleteFileByUrl(STAFF_PHOTOS_BUCKET, previousUrl);
    } catch {
      // Non-fatal: old object may already be gone
    }
  }

  return url;
}

/** Change password after verifying the current password (email auth). */
export async function changePasswordWithCurrent(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (reauthError) {
    throw new AuthError("Current password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new AuthError(error.message || "Failed to update password.");
  }
}

export type PasswordResetPortal = "staff" | "parent";

export function passwordResetRedirectPath(
  portal: PasswordResetPortal,
): "/admin/reset-password" | "/parent/reset-password" {
  return portal === "parent" ? "/parent/reset-password" : "/admin/reset-password";
}

/** Send a password-reset email with a one-time code (and a recovery link as backup). */
export async function sendPasswordResetEmail(
  email: string,
  portal: PasswordResetPortal = "staff",
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}${passwordResetRedirectPath(portal)}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) {
    throw new AuthError(error.message || "Failed to send reset email.");
  }
}

/** Confirm the 6-digit recovery code from email. */
export async function verifyPasswordResetOtp(email: string, token: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "recovery",
  });
  if (error) {
    throw new AuthError(error.message || "That code is invalid or has expired.");
  }
}

/** Set a new password after a recovery session (OTP or email link). */
export async function completePasswordRecovery(newPassword: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new AuthError(error.message || "Failed to update password.");
  }
  await supabase.auth.signOut();
}
