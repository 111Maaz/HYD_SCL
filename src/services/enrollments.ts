import { requireSupabase } from "@/services/supabase";
import type {
  Enrollment,
  EnrollmentInput,
  EnrollmentStatus,
  EnrollmentWithDetails,
} from "@/types/students";

import { fetchStudents } from "@/services/students";
import type { Student } from "@/types/students";

export async function fetchStudentsEligibleForEnrollment(
  academicYearId: string,
): Promise<Student[]> {
  const client = requireSupabase();

  const { data: enrolled, error: enrollError } = await client
    .from("enrollments")
    .select("student_id")
    .eq("academic_year_id", academicYearId)
    .eq("status", "ACTIVE");

  if (enrollError) {
    throw new Error(enrollError.message || "Failed to load enrolled students.");
  }

  const enrolledIds = new Set((enrolled ?? []).map((row) => row.student_id));
  const students = await fetchStudents();

  return students.filter((student) => student.status === "ACTIVE" && !enrolledIds.has(student.id));
}

export async function fetchEnrollmentsForYear(
  academicYearId: string,
  filters?: { classYearId?: string; sectionId?: string },
): Promise<EnrollmentWithDetails[]> {
  const client = requireSupabase();

  let query = client
    .from("enrollments")
    .select(
      `
      *,
      student:students (
        id,
        student_number,
        first_name,
        middle_name,
        last_name
      ),
      section:sections (
        id,
        section_name
      ),
      class_year:class_years (
        id,
        class:classes (
          class_name,
          display_order
        )
      ),
      academic_year:academic_years (
        id,
        name
      )
    `,
    )
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: false });

  if (filters?.classYearId) {
    query = query.eq("class_year_id", filters.classYearId);
  }

  if (filters?.sectionId) {
    query = query.eq("section_id", filters.sectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load enrollments.");
  }

  const rows = (data ?? []) as EnrollmentWithDetails[];

  return rows.sort((a, b) => {
    const classOrder =
      (a.class_year?.class?.display_order ?? 0) - (b.class_year?.class?.display_order ?? 0);
    if (classOrder !== 0) return classOrder;
    const sectionCompare = (a.section?.section_name ?? "").localeCompare(
      b.section?.section_name ?? "",
    );
    if (sectionCompare !== 0) return sectionCompare;
    return (a.roll_number ?? 9999) - (b.roll_number ?? 9999);
  });
}

export async function fetchActiveEnrollmentForStudent(
  studentId: string,
  academicYearId: string,
): Promise<Enrollment | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("enrollments")
    .select("*")
    .eq("student_id", studentId)
    .eq("academic_year_id", academicYearId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load student enrollment.");
  }

  return data;
}

export async function suggestNextRollNumber(
  academicYearId: string,
  sectionId: string,
): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("enrollments")
    .select("roll_number")
    .eq("academic_year_id", academicYearId)
    .eq("section_id", sectionId)
    .eq("status", "ACTIVE")
    .not("roll_number", "is", null);

  if (error) {
    throw new Error(error.message || "Failed to suggest roll number.");
  }

  const maxRoll = (data ?? []).reduce((max, row) => Math.max(max, row.roll_number ?? 0), 0);
  return maxRoll + 1;
}

export async function createEnrollment(input: EnrollmentInput): Promise<Enrollment> {
  const client = requireSupabase();

  const existing = await fetchActiveEnrollmentForStudent(input.student_id, input.academic_year_id);
  if (existing) {
    throw new Error("This student already has an active enrollment for this academic year.");
  }

  const { data: section, error: sectionError } = await client
    .from("sections")
    .select("class_year_id")
    .eq("id", input.section_id)
    .single();

  if (sectionError || !section) {
    throw new Error(sectionError?.message || "Section not found.");
  }

  if (section.class_year_id !== input.class_year_id) {
    throw new Error("Selected section does not belong to the chosen class.");
  }

  let rollNumber = input.roll_number ?? null;
  if (rollNumber == null) {
    rollNumber = await suggestNextRollNumber(input.academic_year_id, input.section_id);
  }

  if (rollNumber <= 0) {
    throw new Error("Roll number must be greater than zero.");
  }

  const { data, error } = await client
    .from("enrollments")
    .insert({
      student_id: input.student_id,
      academic_year_id: input.academic_year_id,
      class_year_id: input.class_year_id,
      section_id: input.section_id,
      roll_number: rollNumber,
      status: "ACTIVE",
      enrollment_date: input.enrollment_date ?? new Date().toISOString().slice(0, 10),
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("unique_active_roll_number")) {
      throw new Error("This roll number is already assigned in the selected section.");
    }
    throw new Error(error.message || "Failed to create enrollment.");
  }

  return data;
}

export async function updateEnrollment(
  enrollmentId: string,
  input: Partial<EnrollmentInput> & { status?: EnrollmentStatus },
): Promise<Enrollment> {
  const client = requireSupabase();

  const { data: existing, error: existingError } = await client
    .from("enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "Enrollment not found.");
  }

  const classYearId = input.class_year_id ?? existing.class_year_id;
  const sectionId = input.section_id ?? existing.section_id;
  const academicYearId = input.academic_year_id ?? existing.academic_year_id;

  if (input.section_id || input.class_year_id) {
    const { data: section, error: sectionError } = await client
      .from("sections")
      .select("class_year_id")
      .eq("id", sectionId)
      .single();

    if (sectionError || !section) {
      throw new Error(sectionError?.message || "Section not found.");
    }

    if (section.class_year_id !== classYearId) {
      throw new Error("Selected section does not belong to the chosen class.");
    }
  }

  const { data, error } = await client
    .from("enrollments")
    .update({
      class_year_id: classYearId,
      section_id: sectionId,
      roll_number: input.roll_number ?? existing.roll_number,
      notes: input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
      status: input.status ?? existing.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
    .select()
    .single();

  if (error) {
    if (error.message.includes("unique_active_roll_number")) {
      throw new Error("This roll number is already assigned in the selected section.");
    }
    throw new Error(error.message || "Failed to update enrollment.");
  }

  return data;
}

export async function setEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
): Promise<Enrollment> {
  const client = requireSupabase();
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "WITHDRAWN" || status === "TRANSFERRED" || status === "COMPLETED") {
    updates.leaving_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await client
    .from("enrollments")
    .update(updates)
    .eq("id", enrollmentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update enrollment status.");
  }

  return data;
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("enrollments").delete().eq("id", enrollmentId);

  if (error) {
    throw new Error(error.message || "Failed to delete enrollment.");
  }
}

export type YearEndAction = "PROMOTED" | "REPEATED" | "COMPLETED";
