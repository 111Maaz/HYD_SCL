import { requireSupabase } from "@/services/supabase";
import {
  getGuardianDisplayName,
  type Guardian,
  type GuardianInput,
  type GuardianWithLinks,
  type LinkedStudentSummary,
  type StudentGuardian,
  type StudentGuardianAccessUpdate,
  type StudentGuardianInput,
} from "@/types/guardians";
import { getStudentDisplayName, type Student } from "@/types/students";

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  return phone.replace(/\s+/g, "").trim();
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

export async function fetchGuardians(search?: string): Promise<GuardianWithLinks[]> {
  const client = requireSupabase();
  let query = client.from("guardians").select("*").order("created_at", { ascending: false });

  const term = search?.trim();
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  const { data: guardians, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load guardians.");
  }

  const rows = guardians ?? [];
  if (rows.length === 0) return [];

  const guardianIds = rows.map((g) => g.id);
  const { data: links, error: linksError } = await client
    .from("student_guardians")
    .select(
      `
      id,
      student_id,
      guardian_id,
      is_primary,
      can_view_attendance,
      can_view_fees,
      can_view_academic_data,
      student:students (
        id,
        student_number,
        first_name,
        middle_name,
        last_name,
        status
      )
    `,
    )
    .in("guardian_id", guardianIds);

  if (linksError) {
    throw new Error(linksError.message || "Failed to load guardian links.");
  }

  const linksByGuardian = new Map<string, LinkedStudentSummary[]>();
  for (const link of links ?? []) {
    const student = link.student as {
      id: string;
      student_number: string;
      first_name: string;
      middle_name: string | null;
      last_name: string | null;
      status: string;
    } | null;
    if (!student) continue;

    const list = linksByGuardian.get(link.guardian_id) ?? [];
    list.push({
      link_id: link.id,
      student_id: student.id,
      student_number: student.student_number,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      status: student.status,
      is_primary: link.is_primary,
      can_view_attendance: link.can_view_attendance,
      can_view_fees: link.can_view_fees,
      can_view_academic_data: link.can_view_academic_data,
    });
    linksByGuardian.set(link.guardian_id, list);
  }

  return rows.map((guardian) => ({
    ...guardian,
    linked_students: linksByGuardian.get(guardian.id) ?? [],
    has_login: Boolean(guardian.auth_user_id),
  }));
}

export async function fetchGuardianById(guardianId: string): Promise<Guardian | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("guardians")
    .select("*")
    .eq("id", guardianId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load guardian.");
  }

  return data;
}

/** Find an existing guardian by email or phone to avoid sibling duplicates. */
export async function findMatchingGuardian(input: {
  email?: string | null;
  phone?: string | null;
  excludeId?: string;
}): Promise<Guardian | null> {
  const client = requireSupabase();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (email) {
    const { data, error } = await client
      .from("guardians")
      .select("*")
      .ilike("email", email)
      .limit(5);

    if (error) {
      throw new Error(error.message || "Failed to search guardians by email.");
    }

    const match = (data ?? []).find(
      (row) =>
        normalizeEmail(row.email) === email &&
        (!input.excludeId || row.id !== input.excludeId),
    );
    if (match) return match;
  }

  if (phone) {
    const { data, error } = await client.from("guardians").select("*").eq("active", true);

    if (error) {
      throw new Error(error.message || "Failed to search guardians by phone.");
    }

    const match = (data ?? []).find(
      (row) =>
        normalizePhone(row.phone) === phone &&
        (!input.excludeId || row.id !== input.excludeId),
    );
    if (match) return match;
  }

  return null;
}

export async function findOrCreateGuardian(input: GuardianInput): Promise<Guardian> {
  const existing = await findMatchingGuardian({ email: input.email, phone: input.phone });
  if (existing) return existing;
  return createGuardian(input, { allowDuplicateContact: true });
}

export async function ensureStudentGuardianLink(
  input: StudentGuardianInput,
): Promise<StudentGuardian> {
  const client = requireSupabase();

  const { data: existing } = await client
    .from("student_guardians")
    .select("*")
    .eq("student_id", input.student_id)
    .eq("guardian_id", input.guardian_id)
    .maybeSingle();

  if (existing) return existing;

  return linkStudentToGuardian(input);
}

export async function createGuardian(
  input: GuardianInput,
  options?: { allowDuplicateContact?: boolean },
): Promise<Guardian> {
  const client = requireSupabase();

  if (!input.first_name.trim()) {
    throw new Error("First name is required.");
  }

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!options?.allowDuplicateContact) {
    const existing = await findMatchingGuardian({ email, phone });
    if (existing) {
      throw new Error(
        `A guardian already exists for this contact (${getGuardianDisplayName(existing)}). Link that guardian to the student instead of creating a duplicate.`,
      );
    }
  }

  const { data, error } = await client
    .from("guardians")
    .insert({
      first_name: input.first_name.trim(),
      last_name: input.last_name?.trim() || null,
      relationship: input.relationship?.trim() || null,
      phone,
      email,
      address: input.address?.trim() || null,
      active: input.active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create guardian.");
  }

  return data;
}

export async function updateGuardian(guardianId: string, input: GuardianInput): Promise<Guardian> {
  const client = requireSupabase();

  if (!input.first_name.trim()) {
    throw new Error("First name is required.");
  }

  const { data, error } = await client
    .from("guardians")
    .update({
      first_name: input.first_name.trim(),
      last_name: input.last_name?.trim() || null,
      relationship: input.relationship?.trim() || null,
      phone: normalizePhone(input.phone),
      email: normalizeEmail(input.email),
      address: input.address?.trim() || null,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", guardianId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update guardian.");
  }

  return data;
}

export async function setGuardianActive(guardianId: string, active: boolean): Promise<Guardian> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("guardians")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", guardianId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update guardian status.");
  }

  return data;
}

export async function linkStudentToGuardian(
  input: StudentGuardianInput,
): Promise<StudentGuardian> {
  const client = requireSupabase();

  const { data: existing } = await client
    .from("student_guardians")
    .select("id")
    .eq("student_id", input.student_id)
    .eq("guardian_id", input.guardian_id)
    .maybeSingle();

  if (existing) {
    throw new Error("This student is already linked to this guardian.");
  }

  if (input.is_primary) {
    await client
      .from("student_guardians")
      .update({ is_primary: false })
      .eq("student_id", input.student_id)
      .eq("is_primary", true);
  }

  const { data, error } = await client
    .from("student_guardians")
    .insert({
      student_id: input.student_id,
      guardian_id: input.guardian_id,
      is_primary: input.is_primary ?? false,
      can_view_attendance: input.can_view_attendance ?? true,
      can_view_fees: input.can_view_fees ?? true,
      can_view_academic_data: input.can_view_academic_data ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to link student to guardian.");
  }

  return data;
}

export async function updateStudentGuardianAccess(
  linkId: string,
  updates: StudentGuardianAccessUpdate,
): Promise<StudentGuardian> {
  const client = requireSupabase();

  if (updates.is_primary) {
    const { data: link } = await client
      .from("student_guardians")
      .select("student_id")
      .eq("id", linkId)
      .single();

    if (link) {
      await client
        .from("student_guardians")
        .update({ is_primary: false })
        .eq("student_id", link.student_id)
        .eq("is_primary", true)
        .neq("id", linkId);
    }
  }

  const { data, error } = await client
    .from("student_guardians")
    .update(updates)
    .eq("id", linkId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update link permissions.");
  }

  return data;
}

export async function unlinkStudentFromGuardian(linkId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("student_guardians").delete().eq("id", linkId);

  if (error) {
    throw new Error(error.message || "Failed to unlink student.");
  }
}

/** Students visible to the signed-in parent (RLS-enforced). */
export async function fetchLinkedChildrenForCurrentParent(): Promise<
  Array<
    Student & {
      link: Pick<
        StudentGuardian,
        "is_primary" | "can_view_attendance" | "can_view_fees" | "can_view_academic_data"
      >;
    }
  >
> {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { data: guardian, error: guardianError } = await client
    .from("guardians")
    .select("id, active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (guardianError) {
    throw new Error(guardianError.message || "Failed to load guardian profile.");
  }

  if (!guardian || !guardian.active) {
    throw new Error("No active parent profile linked to this account.");
  }

  const { data, error } = await client
    .from("student_guardians")
    .select(
      `
      is_primary,
      can_view_attendance,
      can_view_fees,
      can_view_academic_data,
      student:students (*)
    `,
    )
    .eq("guardian_id", guardian.id);

  if (error) {
    throw new Error(error.message || "Failed to load linked children.");
  }

  return (data ?? [])
    .map((row) => {
      const student = row.student as Student | null;
      if (!student) return null;
      return {
        ...student,
        link: {
          is_primary: row.is_primary,
          can_view_attendance: row.can_view_attendance,
          can_view_fees: row.can_view_fees,
          can_view_academic_data: row.can_view_academic_data,
        },
      };
    })
    .filter(Boolean) as Array<
    Student & {
      link: Pick<
        StudentGuardian,
        "is_primary" | "can_view_attendance" | "can_view_fees" | "can_view_academic_data"
      >;
    }
  >;
}

export { getGuardianDisplayName, getStudentDisplayName };
