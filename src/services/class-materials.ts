import { MOCK_CLASS_MATERIALS, type ClassMaterial } from "@/lib/class-materials";
import { deleteFileByUrl, uploadFile } from "@/services/storage";
import { requireSupabase, getSupabase } from "@/services/supabase";
import type { ClassMaterialRow } from "@/types/database";

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

export async function fetchClassMaterials(): Promise<ClassMaterial[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return MOCK_CLASS_MATERIALS;
  }

  const { data, error } = await supabase
    .from("class_materials")
    .select("*")
    .order("class_number", { ascending: true })
    .order("subject", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load class materials.");
  }

  if (!data?.length) {
    return MOCK_CLASS_MATERIALS;
  }

  return data.map(rowToMaterial);
}

export async function fetchAllClassMaterials(): Promise<ClassMaterial[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("class_materials")
    .select("*")
    .order("class_number", { ascending: true })
    .order("subject", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load class materials.");
  }

  return (data ?? []).map(rowToMaterial);
}

export type ClassMaterialInput = {
  class_number: number;
  title: string;
  subject: string;
  description?: string;
};

export async function uploadClassMaterial(
  file: File,
  input: ClassMaterialInput,
): Promise<ClassMaterial> {
  const client = requireSupabase();
  const fileUrl = await uploadFile(CLASS_MATERIALS_BUCKET, file, `class-${input.class_number}`);

  const { data, error } = await client
    .from("class_materials")
    .insert({
      class_number: input.class_number,
      title: input.title.trim(),
      subject: input.subject.trim(),
      description: input.description?.trim() ?? "",
      file_url: fileUrl,
      file_name: file.name,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to upload class material.");
  }

  return rowToMaterial(data);
}

export async function updateClassMaterial(
  id: string,
  input: ClassMaterialInput,
): Promise<ClassMaterial> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("class_materials")
    .update({
      class_number: input.class_number,
      title: input.title.trim(),
      subject: input.subject.trim(),
      description: input.description?.trim() ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update class material.");
  }

  return rowToMaterial(data);
}

export async function replaceClassMaterialFile(id: string, file: File): Promise<ClassMaterial> {
  const client = requireSupabase();
  const existing = await client
    .from("class_materials")
    .select("file_url, class_number")
    .eq("id", id)
    .single();

  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load class material.");
  }

  const fileUrl = await uploadFile(
    CLASS_MATERIALS_BUCKET,
    file,
    `class-${existing.data.class_number}`,
  );

  const { data, error } = await client
    .from("class_materials")
    .update({
      file_url: fileUrl,
      file_name: file.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to replace class material file.");
  }

  if (existing.data.file_url && existing.data.file_url !== fileUrl) {
    try {
      await deleteFileByUrl(CLASS_MATERIALS_BUCKET, existing.data.file_url);
    } catch {
      // Old file cleanup is best-effort.
    }
  }

  return rowToMaterial(data);
}

export async function deleteClassMaterial(id: string): Promise<void> {
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
      // Storage cleanup is best-effort.
    }
  }
}
