export const CALENDAR_EVENT_TYPES = [
  "WORKING_DAY",
  "HOLIDAY",
  "SPECIAL_WORKING_DAY",
  "EXAM",
  "EVENT",
  "SCHOOL_CLOSURE",
] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "LEAVE",
  "HALF_DAY",
  "EXCUSED",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type CalendarEvent = {
  id: string;
  academic_year_id: string;
  event_date: string;
  event_type: CalendarEventType;
  title: string;
  description: string | null;
  applies_to_all: boolean;
  class_id: string | null;
  section_id: string | null;
  is_attendance_day: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEventInput = {
  academic_year_id: string;
  event_date: string;
  event_type: CalendarEventType;
  title: string;
  description?: string | null;
  applies_to_all?: boolean;
  class_id?: string | null;
  section_id?: string | null;
  is_attendance_day?: boolean;
};

export type AttendanceRecord = {
  id: string;
  enrollment_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks: string | null;
  marked_by: string | null;
  marked_at: string;
  corrected_at: string | null;
  corrected_by: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceRow = {
  enrollment_id: string;
  roll_number: number | null;
  student_id: string;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
  record_id: string | null;
};

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  WORKING_DAY: "Working day",
  HOLIDAY: "Holiday",
  SPECIAL_WORKING_DAY: "Special working day",
  EXAM: "Exam",
  EVENT: "Event",
  SCHOOL_CLOSURE: "School closure",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  LEAVE: "Leave",
  HALF_DAY: "Half day",
  EXCUSED: "Excused",
};
