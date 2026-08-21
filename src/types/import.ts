export const IMPORT_JOB_TYPES = ["ADMISSIONS", "GUARDIAN_LINK"] as const;
export type ImportJobType = (typeof IMPORT_JOB_TYPES)[number];

export const IMPORT_JOB_STATUSES = ["PENDING", "VALIDATED", "COMMITTED", "FAILED"] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

export const IMPORT_ROW_STATUSES = ["PENDING", "VALID", "ERROR", "COMMITTED", "SKIPPED"] as const;
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];

export type ImportJob = {
  id: string;
  job_type: ImportJobType;
  file_name: string;
  status: ImportJobStatus;
  row_count: number;
  valid_count: number;
  error_count: number;
  created_by_staff_id: string | null;
  committed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ImportRow = {
  id: string;
  job_id: string;
  row_number: number;
  raw_data: Record<string, string>;
  status: ImportRowStatus;
  error_message: string | null;
  target_student_id: string | null;
  target_guardian_id: string | null;
  created_at: string;
};

export const GUARDIAN_LINK_CSV_HEADERS = [
  "student_number",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_phone",
  "guardian_email",
] as const;

/** Expected CSV headers for ADMISSIONS intake */
export const ADMISSIONS_CSV_HEADERS = [
  "first_name",
  "last_name",
  "date_of_birth",
  "gender",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_phone",
  "guardian_email",
  "class_name",
  "section_name",
] as const;
