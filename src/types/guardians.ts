export type Guardian = {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type GuardianInput = {
  first_name: string;
  last_name?: string | null;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active?: boolean;
};

export type StudentGuardian = {
  id: string;
  student_id: string;
  guardian_id: string;
  is_primary: boolean;
  can_view_attendance: boolean;
  can_view_fees: boolean;
  can_view_academic_data: boolean;
  created_at: string;
};

export type StudentGuardianInput = {
  student_id: string;
  guardian_id: string;
  is_primary?: boolean;
  can_view_attendance?: boolean;
  can_view_fees?: boolean;
  can_view_academic_data?: boolean;
};

export type StudentGuardianAccessUpdate = {
  is_primary?: boolean;
  can_view_attendance?: boolean;
  can_view_fees?: boolean;
  can_view_academic_data?: boolean;
};

export type LinkedStudentSummary = {
  link_id: string;
  student_id: string;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  status: string;
  is_primary: boolean;
  can_view_attendance: boolean;
  can_view_fees: boolean;
  can_view_academic_data: boolean;
};

export type GuardianWithLinks = Guardian & {
  linked_students: LinkedStudentSummary[];
  has_login: boolean;
};

export const GUARDIAN_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Guardian",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Other",
] as const;

export function getGuardianDisplayName(guardian: {
  first_name: string;
  last_name?: string | null;
}): string {
  return [guardian.first_name, guardian.last_name].filter(Boolean).join(" ").trim();
}
