import type { SupabaseClient } from "@supabase/supabase-js";

import { AuthError } from "@/lib/auth";
import type { ClassMaterial } from "@/lib/class-materials";
import { deleteFileByUrl, uploadFile } from "@/services/storage";
import { requireSupabase } from "@/services/supabase";
import {
  getStaffDisplayName,
  isStaffPortalActive,
  type ClassMaterialRow,
  type StaffProfile,
} from "@/types/database";

const CLASS_MATERIALS_BUCKET = "class-materials";

function rowToMaterial(row: ClassMaterialRow): ClassMaterial {
  return {
    id: row.id,
    class_number: row.class_number,
    title: row.title,
    subject: row.subject,
    description: row.description,
    file_url: row.file_url,
    file_name: row.file_name,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function assertFacultyPortalAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("status")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AuthError(error.message);
  }

  if (!data) {
    throw new AuthError("No faculty profile found. Contact your administrator.");
  }

  if (!isStaffPortalActive(data)) {
    throw new AuthError(
      "Your faculty portal access has been temporarily disabled. Contact your administrator.",
    );
  }
}

export async function fetchOwnFacultyProfile(userId: string): Promise<StaffProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load your profile.");
  }

  if (!data) {
    throw new Error("No faculty profile found. Contact your administrator.");
  }

  if (!isStaffPortalActive(data)) {
    throw new Error(
      "Your faculty portal access has been temporarily disabled. Contact your administrator.",
    );
  }

  return data;
}

/** Display helpers for portal UI */
export function getPortalProfileName(profile: StaffProfile): string {
  return getStaffDisplayName(profile);
}

export function getPortalProfileRole(profile: StaffProfile): string {
  return profile.designation ?? "Teacher";
}

export async function fetchFacultyClassMaterials(assignedClass: number): Promise<ClassMaterial[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("class_materials")
    .select("*")
    .eq("class_number", assignedClass)
    .order("subject", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load class materials.");
  }

  return (data ?? []).map(rowToMaterial);
}

export type FacultyMaterialInput = {
  title: string;
  subject: string;
  description?: string;
};

export async function uploadFacultyClassMaterial(
  file: File,
  input: FacultyMaterialInput,
  userId: string,
  assignedClass: number,
): Promise<ClassMaterial> {
  const client = requireSupabase();
  const fileUrl = await uploadFile(
    CLASS_MATERIALS_BUCKET,
    file,
    `${userId}/class-${assignedClass}`,
  );

  const { data, error } = await client
    .from("class_materials")
    .insert({
      class_number: assignedClass,
      title: input.title.trim(),
      subject: input.subject.trim(),
      description: input.description?.trim() ?? "",
      file_url: fileUrl,
      file_name: file.name,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to upload class material.");
  }

  return rowToMaterial(data);
}

export async function deleteFacultyClassMaterial(id: string, userId: string): Promise<void> {
  const client = requireSupabase();
  const existing = await client
    .from("class_materials")
    .select("file_url, uploaded_by")
    .eq("id", id)
    .single();

  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load class material.");
  }

  if (existing.data.uploaded_by !== userId) {
    throw new Error("You can only delete materials you uploaded.");
  }

  const { error } = await client.from("class_materials").delete().eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to delete class material.");
  }

  if (existing.data.file_url) {
    try {
      await deleteFileByUrl(CLASS_MATERIALS_BUCKET, existing.data.file_url);
    } catch {
      // Storage cleanup is best-effort.
    }
  }
}
