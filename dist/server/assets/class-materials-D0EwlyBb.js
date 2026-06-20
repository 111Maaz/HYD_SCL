import { M as MOCK_CLASS_MATERIALS } from "./class-materials-DdBz_lhb.js";
import { u as uploadFile, d as deleteFileByUrl } from "./storage-rV4HRCJm.js";
import { g as getSupabase, r as requireSupabase } from "./supabase-pxAHMEVs.js";
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
async function fetchClassMaterials() {
  const supabase = getSupabase();
  if (!supabase) {
    return MOCK_CLASS_MATERIALS;
  }
  const { data, error } = await supabase.from("class_materials").select("*").order("class_number", { ascending: true }).order("subject", { ascending: true }).order("title", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load class materials.");
  }
  if (!data?.length) {
    return MOCK_CLASS_MATERIALS;
  }
  return data.map(rowToMaterial);
}
async function fetchAllClassMaterials() {
  const client = requireSupabase();
  const { data, error } = await client.from("class_materials").select("*").order("class_number", { ascending: true }).order("subject", { ascending: true }).order("title", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load class materials.");
  }
  return (data ?? []).map(rowToMaterial);
}
async function uploadClassMaterial(file, input) {
  const client = requireSupabase();
  const fileUrl = await uploadFile(CLASS_MATERIALS_BUCKET, file, `class-${input.class_number}`);
  const { data, error } = await client.from("class_materials").insert({
    class_number: input.class_number,
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: input.description?.trim() ?? "",
    file_url: fileUrl,
    file_name: file.name
  }).select().single();
  if (error) {
    throw new Error(error.message || "Failed to upload class material.");
  }
  return rowToMaterial(data);
}
async function updateClassMaterial(id, input) {
  const client = requireSupabase();
  const { data, error } = await client.from("class_materials").update({
    class_number: input.class_number,
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: input.description?.trim() ?? "",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to update class material.");
  }
  return rowToMaterial(data);
}
async function replaceClassMaterialFile(id, file) {
  const client = requireSupabase();
  const existing = await client.from("class_materials").select("file_url, class_number").eq("id", id).single();
  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load class material.");
  }
  const fileUrl = await uploadFile(
    CLASS_MATERIALS_BUCKET,
    file,
    `class-${existing.data.class_number}`
  );
  const { data, error } = await client.from("class_materials").update({
    file_url: fileUrl,
    file_name: file.name,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to replace class material file.");
  }
  if (existing.data.file_url && existing.data.file_url !== fileUrl) {
    try {
      await deleteFileByUrl(CLASS_MATERIALS_BUCKET, existing.data.file_url);
    } catch {
    }
  }
  return rowToMaterial(data);
}
async function deleteClassMaterial(id) {
  const client = requireSupabase();
  const existing = await client.from("class_materials").select("file_url").eq("id", id).single();
  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load class material.");
  }
  const { error } = await client.from("class_materials").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "Failed to delete class material.");
  }
  if (existing.data?.file_url) {
    try {
      await deleteFileByUrl(CLASS_MATERIALS_BUCKET, existing.data.file_url);
    } catch {
    }
  }
}
export {
  fetchAllClassMaterials as a,
  uploadClassMaterial as b,
  deleteClassMaterial as d,
  fetchClassMaterials as f,
  replaceClassMaterialFile as r,
  updateClassMaterial as u
};
