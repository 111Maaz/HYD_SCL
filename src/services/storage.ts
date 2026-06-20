import { requireSupabase } from "@/services/supabase";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadFile(bucket: string, file: File, folder?: string): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const path = folder
    ? `${folder}/${crypto.randomUUID()}-${baseName}.${ext}`
    : `${crypto.randomUUID()}-${baseName}.${ext}`;

  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || `Failed to upload to ${bucket}.`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFileByUrl(bucket: string, publicUrl: string): Promise<void> {
  const client = requireSupabase();
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) {
    return;
  }

  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  const { error } = await client.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(error.message || `Failed to delete file from ${bucket}.`);
  }
}
