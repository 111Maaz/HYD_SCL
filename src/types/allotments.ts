export type AttendanceTeacherAllotment = {
  id: string;
  academic_year_id: string;
  section_id: string;
  teacher_staff_id: string;
  allotted_by_staff_id: string | null;
  active: boolean;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceTeacherAllotmentRow = AttendanceTeacherAllotment & {
  teacher?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    photo_url: string | null;
    designation: string | null;
  } | null;
  section?: {
    id: string;
    section_name: string;
    class_year_id: string;
    class_year?: {
      id: string;
      class?: { class_name: string; class_code: string } | null;
    } | null;
  } | null;
};

export type SecondaryTeacherAllotment = {
  id: string;
  primary_staff_id: string;
  secondary_staff_id: string;
  starts_on: string;
  ends_on: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SecondaryTeacherAllotmentRow = SecondaryTeacherAllotment & {
  primary?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    photo_url: string | null;
  } | null;
  secondary?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    photo_url: string | null;
  } | null;
};
