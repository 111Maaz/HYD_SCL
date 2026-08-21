import { matchClassYearForGrade, parsePersonName } from "@/lib/admission-grade";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import { fetchActiveAcademicYear } from "@/services/academic-years";
import { updateAdmissionNotes, updateAdmissionStatus } from "@/services/admissions";
import { createEnrollment } from "@/services/enrollments";
import { requireSupabase } from "@/services/supabase";
import { createStudent } from "@/services/students";
import type { AdmissionEnquiry } from "@/types/database";
import type { Enrollment } from "@/types/students";
import type { Student } from "@/types/students";

export type AdmissionConversionInput = {
  enquiryId: string;
  academicYearId: string;
  classYearId: string;
  sectionId: string;
  rollNumber?: number | null;
  admissionDate?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
};

export type AdmissionConversionResult = {
  student: Student;
  enrollment: Enrollment;
  enquiry: AdmissionEnquiry;
};

export async function findStudentByAdmissionEnquiryId(
  enquiryId: string,
): Promise<Student | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("students")
    .select("*")
    .contains("metadata", { admission_enquiry_id: enquiryId })
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to check existing student for this enquiry.");
  }

  return data;
}

export async function resolveClassYearIdForGrade(
  grade: string,
  academicYearId: string,
): Promise<string | null> {
  const classYears = await fetchClassYearsWithDetails(academicYearId);
  const match = matchClassYearForGrade(grade, classYears);
  return match?.id ?? null;
}

export async function convertAdmissionEnquiryToStudent(
  input: AdmissionConversionInput,
): Promise<AdmissionConversionResult> {
  const client = requireSupabase();

  const { data: enquiry, error: enquiryError } = await client
    .from("admission_enquiries")
    .select("*")
    .eq("id", input.enquiryId)
    .single();

  if (enquiryError || !enquiry) {
    throw new Error(enquiryError?.message || "Admission enquiry not found.");
  }

  if (enquiry.status === "Enrolled") {
    throw new Error("This enquiry has already been converted to a student.");
  }

  if (enquiry.status === "Rejected") {
    throw new Error("Rejected enquiries cannot be converted.");
  }

  const existingStudent = await findStudentByAdmissionEnquiryId(input.enquiryId);
  if (existingStudent) {
    throw new Error(
      `A student record already exists for this enquiry (${existingStudent.student_number}).`,
    );
  }

  const activeYear = await fetchActiveAcademicYear();
  if (!activeYear) {
    throw new Error("No active academic year. Set one before converting admissions.");
  }

  if (input.academicYearId !== activeYear.id) {
    throw new Error("Enrollments must use the active academic year.");
  }

  const parsedName = parsePersonName(enquiry.student_name);
  const admissionDate = input.admissionDate ?? new Date().toISOString().slice(0, 10);

  const student = await createStudent({
    first_name: parsedName.first_name,
    middle_name: parsedName.middle_name,
    last_name: parsedName.last_name,
    date_of_birth: input.dateOfBirth ?? null,
    gender: input.gender ?? null,
    admission_date: admissionDate,
    status: "ACTIVE",
  });

  const { error: metadataError } = await client
    .from("students")
    .update({
      metadata: {
        admission_enquiry_id: enquiry.id,
        parent_name: enquiry.parent_name,
        parent_email: enquiry.email,
        parent_phone: enquiry.phone,
        enquiry_grade: enquiry.grade,
        source: "admission_enquiry",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", student.id);

  if (metadataError) {
    throw new Error(metadataError.message || "Failed to link student to admission enquiry.");
  }

  const enrollment = await createEnrollment({
    student_id: student.id,
    academic_year_id: input.academicYearId,
    class_year_id: input.classYearId,
    section_id: input.sectionId,
    roll_number: input.rollNumber ?? null,
    enrollment_date: admissionDate,
    notes: enquiry.message ? `From admission enquiry: ${enquiry.message}` : null,
  });

  const conversionNote = [
    enquiry.notes?.trim(),
    `Converted to student ${student.student_number} on ${admissionDate}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  await updateAdmissionNotes(enquiry.id, conversionNote || null);
  const updatedEnquiry = await updateAdmissionStatus(enquiry.id, "Enrolled");

  const { data: studentWithMetadata, error: studentError } = await client
    .from("students")
    .select("*")
    .eq("id", student.id)
    .single();

  if (studentError || !studentWithMetadata) {
    throw new Error(studentError?.message || "Failed to load converted student.");
  }

  return {
    student: studentWithMetadata,
    enrollment,
    enquiry: updatedEnquiry,
  };
}
