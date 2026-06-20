import { F as FACULTY, b as LEADERSHIP_ROLES, L as LEADERSHIP } from "./router-RRLex1WM.js";
import { d as deleteFileByUrl, u as uploadFile } from "./storage-rV4HRCJm.js";
import { g as getSupabase, r as requireSupabase } from "./supabase-pxAHMEVs.js";
const FACULTY_PHOTOS_BUCKET = "faculty-photos";
function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
function facultyMemberToPerson(member) {
  return {
    name: member.name,
    role: member.role,
    bio: member.bio ?? void 0,
    initials: getInitials(member.name),
    accent: member.accent ?? void 0,
    photoUrl: member.photo_url ?? void 0
  };
}
function normalizeRole(role) {
  return role.trim().replace(/[–—]/g, "-").replace(/\s+/g, " ").toLowerCase();
}
function findRoleMatch(people, role) {
  const normalizedRole = normalizeRole(role);
  return people.find((person) => normalizeRole(person.role) === normalizedRole && person.name.trim());
}
function pickLeadershipPeople(people) {
  return LEADERSHIP_ROLES.map((role, index) => findRoleMatch(people, role) ?? LEADERSHIP[index]);
}
async function fetchFacultyMembers() {
  const supabase = getSupabase();
  if (!supabase) {
    return FACULTY;
  }
  const { data, error } = await supabase.from("faculty_members").select("*").eq("is_active", true).order("display_order", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load faculty members.");
  }
  if (!data?.length) {
    return FACULTY;
  }
  return data.map(facultyMemberToPerson);
}
async function fetchAllFacultyMembers() {
  const client = requireSupabase();
  const { data, error } = await client.from("faculty_members").select("*").order("display_order", { ascending: true });
  if (error) {
    throw new Error(error.message || "Failed to load faculty members.");
  }
  return data ?? [];
}
async function getNextDisplayOrder() {
  const client = requireSupabase();
  const { data, error } = await client.from("faculty_members").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to determine display order.");
  }
  return (data?.display_order ?? -1) + 1;
}
async function createFacultyMember(input) {
  const client = requireSupabase();
  const displayOrder = await getNextDisplayOrder();
  const { data, error } = await client.from("faculty_members").insert({
    name: input.name.trim(),
    role: input.role.trim(),
    bio: input.bio?.trim() ? input.bio.trim() : null,
    initials: null,
    accent: input.accent?.trim() ? input.accent.trim() : null,
    photo_url: null,
    display_order: displayOrder,
    is_active: input.is_active ?? true
  }).select().single();
  if (error) {
    throw new Error(error.message || "Failed to create faculty member.");
  }
  return data;
}
async function updateFacultyMember(id, input) {
  const client = requireSupabase();
  const { data, error } = await client.from("faculty_members").update({
    name: input.name.trim(),
    role: input.role.trim(),
    bio: input.bio?.trim() ? input.bio.trim() : null,
    initials: null,
    accent: input.accent?.trim() ? input.accent.trim() : null,
    is_active: input.is_active ?? true
  }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to update faculty member.");
  }
  return data;
}
async function deleteFacultyMember(id) {
  const client = requireSupabase();
  const member = await client.from("faculty_members").select("photo_url").eq("id", id).single();
  if (member.error) {
    throw new Error(member.error.message || "Failed to load faculty member.");
  }
  const { error } = await client.from("faculty_members").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "Failed to delete faculty member.");
  }
  if (member.data?.photo_url) {
    try {
      await deleteFileByUrl(FACULTY_PHOTOS_BUCKET, member.data.photo_url);
    } catch {
    }
  }
}
async function reorderFacultyMembers(orderedIds) {
  const client = requireSupabase();
  const updates = orderedIds.map(
    (id, index) => client.from("faculty_members").update({ display_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message || "Failed to reorder faculty members.");
  }
}
async function uploadFacultyPhoto(id, file) {
  const client = requireSupabase();
  const existing = await client.from("faculty_members").select("photo_url").eq("id", id).single();
  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load faculty member.");
  }
  const publicUrl = await uploadFile(FACULTY_PHOTOS_BUCKET, file, id);
  const { data, error } = await client.from("faculty_members").update({ photo_url: publicUrl }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to save faculty photo.");
  }
  if (existing.data?.photo_url && existing.data.photo_url !== publicUrl) {
    try {
      await deleteFileByUrl(FACULTY_PHOTOS_BUCKET, existing.data.photo_url);
    } catch {
    }
  }
  return data;
}
async function removeFacultyPhoto(id) {
  const client = requireSupabase();
  const existing = await client.from("faculty_members").select("photo_url").eq("id", id).single();
  if (existing.error) {
    throw new Error(existing.error.message || "Failed to load faculty member.");
  }
  const { data, error } = await client.from("faculty_members").update({ photo_url: null }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to remove faculty photo.");
  }
  if (existing.data?.photo_url) {
    try {
      await deleteFileByUrl(FACULTY_PHOTOS_BUCKET, existing.data.photo_url);
    } catch {
    }
  }
  return data;
}
export {
  fetchAllFacultyMembers as a,
  uploadFacultyPhoto as b,
  createFacultyMember as c,
  deleteFacultyMember as d,
  removeFacultyPhoto as e,
  fetchFacultyMembers as f,
  pickLeadershipPeople as p,
  reorderFacultyMembers as r,
  updateFacultyMember as u
};
