import { r as requireSupabase } from "./supabase-pxAHMEVs.js";
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
async function uploadFile(bucket, file, folder) {
  const client = requireSupabase();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const path = folder ? `${folder}/${crypto.randomUUID()}-${baseName}.${ext}` : `${crypto.randomUUID()}-${baseName}.${ext}`;
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) {
    throw new Error(error.message || `Failed to upload to ${bucket}.`);
  }
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
async function deleteFileByUrl(bucket, publicUrl) {
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
export {
  deleteFileByUrl as d,
  uploadFile as u
};
