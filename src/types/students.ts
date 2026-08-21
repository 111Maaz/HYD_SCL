export const STUDENT_STATUSES = [
  "ACTIVE",
  "WITHDRAWN",
  "TRANSFERRED",
  "GRADUATED",
  "ARCHIVED",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const ENROLLMENT_STATUSES = [
  "ACTIVE",
  "PROMOTED",
  "REPEATED",
  "TRANSFERRED",
  "WITHDRAWN",
  "COMPLETED",
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export type Student = {
  id: string;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  admission_date: string | null;
  status: StudentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type StudentInput = {
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  admission_date?: string | null;
  status?: StudentStatus;
};

export type Enrollment = {
  id: string;
  student_id: string;
  academic_year_id: string;
  class_year_id: string;
  section_id: string;
  roll_number: number | null;
  status: EnrollmentStatus;
  enrollment_date: string;
  leaving_date: string | null;
  previous_enrollment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EnrollmentInput = {
  student_id: string;
  academic_year_id: string;
  class_year_id: string;
  section_id: string;
  roll_number?: number | null;
  enrollment_date?: string;
  notes?: string | null;
};

export type EnrollmentWithDetails = Enrollment & {
  student: Pick<Student, "id" | "student_number" | "first_name" | "middle_name" | "last_name">;
  section: { id: string; section_name: string };
  class_year: {
    id: string;
    class: { class_name: string; display_order: number };
  };
  academic_year: { id: string; name: string };
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: "Active",
  WITHDRAWN: "Withdrawn",
  TRANSFERRED: "Transferred",
  GRADUATED: "Graduated",
  ARCHIVED: "Archived",
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: "Active",
  PROMOTED: "Promoted",
  REPEATED: "Repeated",
  TRANSFERRED: "Transferred",
  WITHDRAWN: "Withdrawn",
  COMPLETED: "Completed",
};

export function getStudentDisplayName(student: {
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
}): string {
  return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ").trim();
}

export const STUDENT_NUMBER_PREFIX = "HS";

export function formatStudentNumber(sequence: number, year: number): string {
  return `${STUDENT_NUMBER_PREFIX}-${year}-${String(sequence).padStart(5, "0")}`;
}

export function parseStudentNumberYear(studentNumber: string): number | null {
  const match = studentNumber.match(/^HS-(\d{4})-\d+$/);
  return match ? Number(match[1]) : null;
}

export function parseStudentNumberSequence(studentNumber: string, year: number): number | null {
  const match = studentNumber.match(/^HS-(\d{4})-(\d+)$/);
  if (!match || Number(match[1]) !== year) return null;
  return Number(match[2]);
}
