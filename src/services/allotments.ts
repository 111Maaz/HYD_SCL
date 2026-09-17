import { requireSupabase } from "@/services/supabase";
import { schoolTodayIso } from "@/lib/school-date";
import type {
  AttendanceTeacherAllotmentRow,
  SecondaryTeacherAllotment,
  SecondaryTeacherAllotmentRow,
} from "@/types/allotments";
import type { StaffProfile } from "@/types/database";
import { getStaffDisplayName } from "@/types/database";

export async function fetchOwnStaffProfile(authUserId: string): Promise<StaffProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load staff profile.");
  if (!data) throw new Error("Staff profile not found.");
  return data;
}

export async function listActiveTeachersAndStaff(): Promise<StaffProfile[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select("*")
    .eq("status", "ACTIVE")
    .not("auth_user_id", "is", null)
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load staff.");
  return data ?? [];
}

export async function listStaffForLeadership(): Promise<
  Array<StaffProfile & { role_keys: string[] }>
> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select(
      `
      *,
      staff_roles (
        active,
        roles ( role_key )
      )
    `,
    )
    .not("auth_user_id", "is", null)
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load staff directory.");

  return (data ?? []).map((row) => {
    const roles = (row.staff_roles ?? []) as Array<{
      active: boolean;
      roles: { role_key: string } | null;
    }>;
    const role_keys = roles
      .filter((r) => r.active && r.roles?.role_key)
      .map((r) => r.roles!.role_key);
    const { staff_roles: _ignored, ...profile } = row as StaffProfile & {
      staff_roles?: unknown;
    };
    return { ...(profile as StaffProfile), role_keys };
  });
}

const ALLOTMENT_SELECT = `
  *,
  teacher:staff_profiles!teacher_staff_id (
    id, first_name, last_name, email, photo_url, designation
  ),
  section:sections!section_id (
    id, section_name, class_year_id,
    class_year:class_years (
      id,
      class:classes ( class_name, class_code )
    )
  )
`;

export async function fetchAttendanceAllotmentsForYear(
  academicYearId: string,
): Promise<AttendanceTeacherAllotmentRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("attendance_teacher_allotments")
    .select(ALLOTMENT_SELECT)
    .eq("academic_year_id", academicYearId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load attendance allotments.");
  return (data ?? []) as AttendanceTeacherAllotmentRow[];
}

export async function fetchMyAttendanceAllotments(
  staffId: string,
): Promise<AttendanceTeacherAllotmentRow[]> {
  const client = requireSupabase();
  const today = schoolTodayIso();

  const { data: asPrimary, error: primaryError } = await client
    .from("attendance_teacher_allotments")
    .select(ALLOTMENT_SELECT)
    .eq("teacher_staff_id", staffId)
    .eq("active", true)
    .lte("starts_on", today)
    .or(`ends_on.is.null,ends_on.gte.${today}`);

  if (primaryError) throw new Error(primaryError.message || "Failed to load your allotments.");

  const { data: covers, error: coverError } = await client
    .from("secondary_teacher_allotments")
    .select("primary_staff_id")
    .eq("secondary_staff_id", staffId)
    .eq("active", true)
    .lte("starts_on", today)
    .gte("ends_on", today);

  if (coverError) throw new Error(coverError.message || "Failed to load cover allotments.");

  const primaryIds = [...new Set((covers ?? []).map((c) => c.primary_staff_id))];
  let asSecondary: AttendanceTeacherAllotmentRow[] = [];

  if (primaryIds.length > 0) {
    const { data, error } = await client
      .from("attendance_teacher_allotments")
      .select(ALLOTMENT_SELECT)
      .in("teacher_staff_id", primaryIds)
      .eq("active", true)
      .lte("starts_on", today)
      .or(`ends_on.is.null,ends_on.gte.${today}`);
    if (error) throw new Error(error.message || "Failed to load covered classes.");
    asSecondary = (data ?? []) as AttendanceTeacherAllotmentRow[];
  }

  const byId = new Map<string, AttendanceTeacherAllotmentRow>();
  for (const row of [...(asPrimary ?? []), ...asSecondary]) {
    byId.set(row.id, row as AttendanceTeacherAllotmentRow);
  }
  return [...byId.values()];
}

export async function upsertAttendanceAllotment(input: {
  academicYearId: string;
  sectionId: string;
  teacherStaffId: string;
  allottedByStaffId: string | null;
}): Promise<void> {
  const client = requireSupabase();

  // Deactivate existing active allotment for this section
  const { data: existing } = await client
    .from("attendance_teacher_allotments")
    .select("id")
    .eq("section_id", input.sectionId)
    .eq("active", true)
    .maybeSingle();

  if (existing) {
    const { error: endError } = await client
      .from("attendance_teacher_allotments")
      .update({
        active: false,
        ends_on: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (endError) throw new Error(endError.message || "Failed to replace previous allotment.");
  }

  const { error } = await client.from("attendance_teacher_allotments").insert({
    academic_year_id: input.academicYearId,
    section_id: input.sectionId,
    teacher_staff_id: input.teacherStaffId,
    allotted_by_staff_id: input.allottedByStaffId,
    active: true,
  });

  if (error) throw new Error(error.message || "Failed to allot teacher.");
}

export async function clearAttendanceAllotment(sectionId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("attendance_teacher_allotments")
    .update({
      active: false,
      ends_on: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("section_id", sectionId)
    .eq("active", true);

  if (error) throw new Error(error.message || "Failed to clear allotment.");
}

export async function fetchSecondaryCoverForMe(
  staffId: string,
): Promise<SecondaryTeacherAllotmentRow[]> {
  const client = requireSupabase();
  const today = schoolTodayIso();
  const { data, error } = await client
    .from("secondary_teacher_allotments")
    .select(
      `
      *,
      primary:staff_profiles!primary_staff_id (
        id, first_name, last_name, email, photo_url
      ),
      secondary:staff_profiles!secondary_staff_id (
        id, first_name, last_name, email, photo_url
      )
    `,
    )
    .eq("secondary_staff_id", staffId)
    .eq("active", true)
    .lte("starts_on", today)
    .gte("ends_on", today)
    .order("starts_on", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load secondary covers.");
  return (data ?? []) as SecondaryTeacherAllotmentRow[];
}

export async function fetchMySecondaryAllotments(
  staffId: string,
): Promise<SecondaryTeacherAllotmentRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("secondary_teacher_allotments")
    .select(
      `
      *,
      secondary:staff_profiles!secondary_staff_id (
        id, first_name, last_name, email, photo_url
      )
    `,
    )
    .eq("primary_staff_id", staffId)
    .eq("active", true)
    .order("starts_on", { ascending: false });

  if (error) throw new Error(error.message || "Failed to load your secondary allotments.");
  return (data ?? []) as SecondaryTeacherAllotmentRow[];
}

export async function createSecondaryAllotment(input: {
  primaryStaffId: string;
  secondaryStaffId: string;
  startsOn: string;
  endsOn: string;
  notes?: string;
}): Promise<SecondaryTeacherAllotment> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("secondary_teacher_allotments")
    .insert({
      primary_staff_id: input.primaryStaffId,
      secondary_staff_id: input.secondaryStaffId,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      notes: input.notes?.trim() || null,
      active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to set secondary teacher.");
  return data;
}

export async function endSecondaryAllotment(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("secondary_teacher_allotments")
    .update({
      active: false,
      ends_on: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message || "Failed to end secondary allotment.");
}

export function allotmentClassLabel(row: AttendanceTeacherAllotmentRow): string {
  const className =
    row.section?.class_year?.class?.class_name ??
    row.section?.class_year?.class?.class_code ??
    "Class";
  const section = row.section?.section_name ?? "—";
  return `${className} — ${section}`;
}

export function staffLabel(person: {
  first_name: string;
  last_name?: string | null;
} | null | undefined): string {
  if (!person) return "—";
  return getStaffDisplayName(person as StaffProfile);
}
