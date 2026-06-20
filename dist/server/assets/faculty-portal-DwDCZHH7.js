import { A as AuthError } from "./auth-D8LBsNTn.js";
import { u as uploadFile, d as deleteFileByUrl } from "./storage-rV4HRCJm.js";
import { r as requireSupabase } from "./supabase-pxAHMEVs.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
const CLASS_MATERIALS_BUCKET = "class-materials";
function rowToMaterial(row) {
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
    updated_at: row.updated_at
  };
}
async function assertFacultyPortalAccess(supabase, userId) {
  const { data, error } = await supabase.from("faculty_profiles").select("is_active").eq("user_id", userId).maybeSingle();
  if (error) {
    throw new AuthError(error.message);
  }
  if (!data) {
    throw new AuthError("No faculty profile found. Contact your administrator.");
  }
  if (data.is_active === false) {
    throw new AuthError(
      "Your faculty portal access has been temporarily disabled. Contact your administrator."
    );
  }
}
async function fetchOwnFacultyProfile(userId) {
  const client = requireSupabase();
  const { data, error } = await client.from("faculty_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load your profile.");
  }
  if (!data) {
    throw new Error("No faculty profile found. Contact your administrator.");
  }
  if (data.is_active === false) {
    throw new Error(
      "Your faculty portal access has been temporarily disabled. Contact your administrator."
    );
  }
  return data;
}
async function fetchFacultyClassMaterials(assignedClass) {
  const client = requireSupabase();
  const { data, error } = await client.from("class_materials").select("*").eq("class_number", assignedClass).order("subject", { ascending: true }).order("title", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load class materials.");
  }
  return (data ?? []).map(rowToMaterial);
}
async function uploadFacultyClassMaterial(file, input, userId, assignedClass) {
  const client = requireSupabase();
  const fileUrl = await uploadFile(
    CLASS_MATERIALS_BUCKET,
    file,
    `${userId}/class-${assignedClass}`
  );
  const { data, error } = await client.from("class_materials").insert({
    class_number: assignedClass,
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: input.description?.trim() ?? "",
    file_url: fileUrl,
    file_name: file.name,
    uploaded_by: userId
  }).select().single();
  if (error) {
    throw new Error(error.message || "Failed to upload class material.");
  }
  return rowToMaterial(data);
}
async function deleteFacultyClassMaterial(id, userId) {
  const client = requireSupabase();
  const existing = await client.from("class_materials").select("file_url, uploaded_by").eq("id", id).single();
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
    }
  }
}
export {
  assertFacultyPortalAccess,
  deleteFacultyClassMaterial,
  fetchFacultyClassMaterials,
  fetchOwnFacultyProfile,
  uploadFacultyClassMaterial
};
