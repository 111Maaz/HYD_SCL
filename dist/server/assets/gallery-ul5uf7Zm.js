import { u as uploadFile, d as deleteFileByUrl } from "./storage-rV4HRCJm.js";
import { g as getSupabase, r as requireSupabase } from "./supabase-pxAHMEVs.js";
const GALLERY_BUCKET = "gallery-images";
const VIDEO_URL_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;
function isGalleryVideoUrl(url) {
  return VIDEO_URL_PATTERN.test(url);
}
async function fetchGalleryImages(fallback) {
  const supabase = getSupabase();
  if (!supabase) {
    return fallback;
  }
  const { data, error } = await supabase.from("gallery_images").select("*").eq("is_active", true).order("display_order", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load gallery images.");
  }
  if (!data?.length) {
    return fallback;
  }
  return data.map((image) => ({
    id: image.id,
    src: image.image_url,
    caption: image.caption,
    span: image.span_class ?? void 0
  }));
}
async function fetchAllGalleryImages() {
  const client = requireSupabase();
  const { data, error } = await client.from("gallery_images").select("*").order("display_order", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load gallery images.");
  }
  return data ?? [];
}
async function getNextDisplayOrder() {
  const client = requireSupabase();
  const { data, error } = await client.from("gallery_images").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to determine display order.");
  }
  return (data?.display_order ?? -1) + 1;
}
async function uploadGalleryImage(file, input) {
  const client = requireSupabase();
  const displayOrder = await getNextDisplayOrder();
  const imageUrl = await uploadFile(GALLERY_BUCKET, file);
  const { data, error } = await client.from("gallery_images").insert({
    image_url: imageUrl,
    caption: input.caption.trim(),
    span_class: input.span_class?.trim() ? input.span_class.trim() : null,
    display_order: displayOrder,
    is_active: input.is_active ?? true
  }).select().single();
  if (error) {
    throw new Error(error.message || "Failed to save gallery image.");
  }
  return data;
}
async function deleteGalleryImage(id) {
  const client = requireSupabase();
  const existing = await client.from("gallery_images").select("image_url").eq("id", id).single();
  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load gallery image.");
  }
  const { error } = await client.from("gallery_images").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "Failed to delete gallery image.");
  }
  if (existing.data?.image_url) {
    try {
      await deleteFileByUrl(GALLERY_BUCKET, existing.data.image_url);
    } catch {
    }
  }
}
async function reorderGalleryImages(orderedIds) {
  const client = requireSupabase();
  const updates = orderedIds.map(
    (id, index) => client.from("gallery_images").update({ display_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message || "Failed to reorder gallery images.");
  }
}
export {
  fetchAllGalleryImages as a,
  deleteGalleryImage as d,
  fetchGalleryImages as f,
  isGalleryVideoUrl as i,
  reorderGalleryImages as r,
  uploadGalleryImage as u
};
