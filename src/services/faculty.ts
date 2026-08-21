import type { Person } from "@/components/site/PersonCard";
import { FACULTY, LEADERSHIP, LEADERSHIP_ROLES } from "@/lib/site";
import { deleteFileByUrl, uploadFile } from "@/services/storage";
import { requireSupabase, getSupabase } from "@/services/supabase";
import {
  getStaffDisplayName,
  type StaffProfile,
  type StaffStatus,
} from "@/types/database";

const STAFF_PHOTOS_BUCKET = "faculty-photos";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function staffProfileToPerson(member: StaffProfile): Person {
  const name = getStaffDisplayName(member);
  return {
    name,
    role: member.designation ?? "",
    bio: member.bio ?? undefined,
    initials: member.initials ?? getInitials(name),
    accent: member.accent ?? undefined,
    photoUrl: member.photo_url ?? undefined,
  };
}

/** @deprecated Use staffProfileToPerson */
export const facultyMemberToPerson = staffProfileToPerson;

export type FacultyMemberInput = {
  name: string;
  role: string;
  bio?: string | null;
  accent?: string | null;
  is_active?: boolean;
};

function normalizeRole(role: string): string {
  return role.trim().replace(/[–—]/g, "-").replace(/\s+/g, " ").toLowerCase();
}

function findRoleMatch(people: Person[], role: string): Person | undefined {
  const normalizedRole = normalizeRole(role);
  return people.find(
    (person) => normalizeRole(person.role) === normalizedRole && person.name.trim(),
  );
}

export function pickLeadershipPeople(people: Person[]): Person[] {
  return LEADERSHIP_ROLES.map((role, index) => findRoleMatch(people, role) ?? LEADERSHIP[index]);
}

export function pickHomeFacultyPreview(people: Person[], count = 4): Person[] {
  const preview: Person[] = [];

  for (const role of LEADERSHIP_ROLES) {
    const match = findRoleMatch(people, role);
    if (match && !preview.includes(match)) {
      preview.push(match);
    }
    if (preview.length === count) return preview;
  }

  for (const person of people) {
    if (person.name.trim() && !preview.includes(person)) {
      preview.push(person);
    }
    if (preview.length === count) return preview;
  }

  return preview;
}

export async function fetchFacultyMembers(): Promise<Person[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return FACULTY;
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("is_public", true)
    .eq("status", "ACTIVE")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load faculty members.");
  }

  if (!data?.length) {
    return FACULTY;
  }

  return data.map(staffProfileToPerson);
}

export async function fetchAllFacultyMembers(): Promise<StaffProfile[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select("*")
    .or("auth_user_id.is.null,is_public.eq.true")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load faculty members.");
  }

  return data ?? [];
}

async function getNextDisplayOrder(): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select("display_order")
    .eq("is_public", true)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to determine display order.");
  }

  return (data?.display_order ?? -1) + 1;
}

export async function createFacultyMember(input: FacultyMemberInput): Promise<StaffProfile> {
  const client = requireSupabase();
  const displayOrder = await getNextDisplayOrder();

  const { data, error } = await client
    .from("staff_profiles")
    .insert({
      first_name: input.name.trim(),
      designation: input.role.trim(),
      bio: input.bio?.trim() ? input.bio.trim() : null,
      initials: null,
      accent: input.accent?.trim() ? input.accent.trim() : null,
      photo_url: null,
      display_order: displayOrder,
      is_public: input.is_active ?? true,
      status: (input.is_active ?? true ? "ACTIVE" : "INACTIVE") as StaffStatus,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create faculty member.");
  }

  return data;
}

export async function updateFacultyMember(
  id: string,
  input: FacultyMemberInput,
): Promise<StaffProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .update({
      first_name: input.name.trim(),
      designation: input.role.trim(),
      bio: input.bio?.trim() ? input.bio.trim() : null,
      initials: null,
      accent: input.accent?.trim() ? input.accent.trim() : null,
      is_public: input.is_active ?? true,
      status: (input.is_active ?? true ? "ACTIVE" : "INACTIVE") as StaffStatus,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update faculty member.");
  }

  return data;
}

export async function deleteFacultyMember(id: string): Promise<void> {
  const client = requireSupabase();
  const member = await client.from("staff_profiles").select("photo_url").eq("id", id).single();

  if (member.error) {
    throw new Error(member.error.message || "Failed to load faculty member.");
  }

  const { error } = await client.from("staff_profiles").delete().eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to delete faculty member.");
  }

  if (member.data?.photo_url) {
    try {
      await deleteFileByUrl(STAFF_PHOTOS_BUCKET, member.data.photo_url);
    } catch {
      // Photo cleanup is best-effort after row deletion.
    }
  }
}

export async function reorderFacultyMembers(orderedIds: string[]): Promise<void> {
  const client = requireSupabase();

  const updates = orderedIds.map((id, index) =>
    client.from("staff_profiles").update({ display_order: index }).eq("id", id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message || "Failed to reorder faculty members.");
  }
}

export async function uploadFacultyPhoto(id: string, file: File): Promise<StaffProfile> {
  const client = requireSupabase();
  const existing = await client.from("staff_profiles").select("photo_url").eq("id", id).single();

  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load faculty member.");
  }

  const publicUrl = await uploadFile(STAFF_PHOTOS_BUCKET, file, id);

  const { data, error } = await client
    .from("staff_profiles")
    .update({ photo_url: publicUrl })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save faculty photo.");
  }

  if (existing.data?.photo_url && existing.data.photo_url !== publicUrl) {
    try {
      await deleteFileByUrl(STAFF_PHOTOS_BUCKET, existing.data.photo_url);
    } catch {
      // Old photo cleanup is best-effort.
    }
  }

  return data;
}

export async function removeFacultyPhoto(id: string): Promise<StaffProfile> {
  const client = requireSupabase();
  const existing = await client.from("staff_profiles").select("photo_url").eq("id", id).single();

  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load faculty member.");
  }

  const { data, error } = await client
    .from("staff_profiles")
    .update({ photo_url: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to remove faculty photo.");
  }

  if (existing.data?.photo_url) {
    try {
      await deleteFileByUrl(STAFF_PHOTOS_BUCKET, existing.data.photo_url);
    } catch {
      // Storage cleanup is best-effort.
    }
  }

  return data;
}
