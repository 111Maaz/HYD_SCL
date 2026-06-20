import { deleteFileByUrl, uploadFile } from "@/services/storage";
import { requireSupabase, getSupabase } from "@/services/supabase";
import type { GalleryImage } from "@/types/database";

const GALLERY_BUCKET = "gallery-images";

const VIDEO_URL_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

export function isGalleryVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERN.test(url);
}

export type GalleryPhoto = {
  id: string;
  src: string;
  caption: string;
  span?: string;
};

export async function fetchGalleryImages(fallback: GalleryPhoto[]): Promise<GalleryPhoto[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load gallery images.");
  }

  if (!data?.length) {
    return fallback;
  }

  return data.map((image: GalleryImage) => ({
    id: image.id,
    src: image.image_url,
    caption: image.caption,
    span: image.span_class ?? undefined,
  }));
}

export async function fetchAllGalleryImages(): Promise<GalleryImage[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("gallery_images")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load gallery images.");
  }

  return data ?? [];
}

async function getNextDisplayOrder(): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("gallery_images")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to determine display order.");
  }

  return (data?.display_order ?? -1) + 1;
}

export type GalleryImageInput = {
  caption: string;
  span_class?: string | null;
  is_active?: boolean;
};

export async function uploadGalleryImage(
  file: File,
  input: GalleryImageInput,
): Promise<GalleryImage> {
  const client = requireSupabase();
  const displayOrder = await getNextDisplayOrder();
  const imageUrl = await uploadFile(GALLERY_BUCKET, file);

  const { data, error } = await client
    .from("gallery_images")
    .insert({
      image_url: imageUrl,
      caption: input.caption.trim(),
      span_class: input.span_class?.trim() ? input.span_class.trim() : null,
      display_order: displayOrder,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save gallery image.");
  }

  return data;
}

export async function deleteGalleryImage(id: string): Promise<void> {
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
      // Storage cleanup is best-effort.
    }
  }
}

export async function reorderGalleryImages(orderedIds: string[]): Promise<void> {
  const client = requireSupabase();

  const updates = orderedIds.map((id, index) =>
    client.from("gallery_images").update({ display_order: index }).eq("id", id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message || "Failed to reorder gallery images.");
  }
}

export async function updateGalleryImage(
  id: string,
  input: GalleryImageInput,
): Promise<GalleryImage> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("gallery_images")
    .update({
      caption: input.caption.trim(),
      span_class: input.span_class?.trim() ? input.span_class.trim() : null,
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update gallery image.");
  }

  return data;
}
