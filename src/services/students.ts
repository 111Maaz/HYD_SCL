import { requireSupabase } from "@/services/supabase";
import {
  formatStudentNumber,
  parseStudentNumberSequence,
  type Student,
  type StudentInput,
  type StudentStatus,
} from "@/types/students";

export async function generateStudentNumber(admissionDate?: string | null): Promise<string> {
  const client = requireSupabase();
  const year = admissionDate
    ? new Date(`${admissionDate}T12:00:00`).getFullYear()
    : new Date().getFullYear();
  const prefix = `HS-${year}-`;

  const { data, error } = await client
    .from("students")
    .select("student_number")
    .like("student_number", `${prefix}%`);

  if (error) {
    throw new Error(error.message || "Failed to generate student number.");
  }

  let maxSequence = 0;
  for (const row of data ?? []) {
    const sequence = parseStudentNumberSequence(row.student_number, year);
    if (sequence !== null && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return formatStudentNumber(maxSequence + 1, year);
}

export async function fetchStudents(search?: string): Promise<Student[]> {
  const client = requireSupabase();
  let query = client.from("students").select("*").order("created_at", { ascending: false });

  const term = search?.trim();
  if (term) {
    query = query.or(
      `student_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,middle_name.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load students.");
  }

  return data ?? [];
}

export async function fetchStudentById(studentId: string): Promise<Student | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load student.");
  }

  return data;
}

export async function fetchStudentByNumber(studentNumber: string): Promise<Student | null> {
  const client = requireSupabase();
  const normalized = studentNumber.trim().toUpperCase();
  const { data, error } = await client
    .from("students")
    .select("*")
    .eq("student_number", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load student.");
  }

  return data;
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const client = requireSupabase();

  if (!input.first_name.trim()) {
    throw new Error("First name is required.");
  }

  const studentNumber = await generateStudentNumber(input.admission_date);

  const { data, error } = await client
    .from("students")
    .insert({
      student_number: studentNumber,
      first_name: input.first_name.trim(),
      middle_name: input.middle_name?.trim() || null,
      last_name: input.last_name?.trim() || null,
      date_of_birth: input.date_of_birth || null,
      gender: input.gender?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      admission_date: input.admission_date || null,
      status: input.status ?? "ACTIVE",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create student.");
  }

  return data;
}

export async function updateStudent(studentId: string, input: StudentInput): Promise<Student> {
  const client = requireSupabase();

  if (!input.first_name.trim()) {
    throw new Error("First name is required.");
  }

  const { data, error } = await client
    .from("students")
    .update({
      first_name: input.first_name.trim(),
      middle_name: input.middle_name?.trim() || null,
      last_name: input.last_name?.trim() || null,
      date_of_birth: input.date_of_birth || null,
      gender: input.gender?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      admission_date: input.admission_date || null,
      status: input.status ?? "ACTIVE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update student.");
  }

  return data;
}

export async function setStudentStatus(studentId: string, status: StudentStatus): Promise<Student> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("students")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update student status.");
  }

  return data;
}

export async function deleteStudent(studentId: string): Promise<void> {
  const client = requireSupabase();

  const { count, error: countError } = await client
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  if (countError) {
    throw new Error(countError.message || "Failed to check student enrollments.");
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "Cannot delete a student with enrollment history. Set status to Archived instead.",
    );
  }

  const { error } = await client.from("students").delete().eq("id", studentId);

  if (error) {
    throw new Error(error.message || "Failed to delete student.");
  }
}
