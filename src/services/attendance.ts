import { fetchCalendarEventForDate, isHolidayEventType } from "@/services/calendar-events";
import { getCurrentStaffProfileId } from "@/services/staff-context";
import { requireSupabase } from "@/services/supabase";
import type { AttendanceRecord, AttendanceRow, AttendanceStatus } from "@/types/attendance";
import { getStudentDisplayName } from "@/types/students";

export async function fetchAttendanceRows(
  academicYearId: string,
  sectionId: string,
  attendanceDate: string,
): Promise<AttendanceRow[]> {
  const client = requireSupabase();

  const { data: enrollments, error: enrollError } = await client
    .from("enrollments")
    .select(
      `
      id,
      roll_number,
      student:students (
        id,
        student_number,
        first_name,
        middle_name,
        last_name
      )
    `,
    )
    .eq("academic_year_id", academicYearId)
    .eq("section_id", sectionId)
    .eq("status", "ACTIVE")
    .order("roll_number", { ascending: true });

  if (enrollError) {
    throw new Error(enrollError.message || "Failed to load section enrollments.");
  }

  const enrollmentIds = (enrollments ?? []).map((row) => row.id);

  let attendanceByEnrollment = new Map<string, AttendanceRecord>();

  if (enrollmentIds.length > 0) {
    const { data: records, error: recordsError } = await client
      .from("attendance_records")
      .select("*")
      .eq("attendance_date", attendanceDate)
      .in("enrollment_id", enrollmentIds);

    if (recordsError) {
      throw new Error(recordsError.message || "Failed to load attendance records.");
    }

    attendanceByEnrollment = new Map(
      (records ?? []).map((record) => [record.enrollment_id, record as AttendanceRecord]),
    );
  }

  return (enrollments ?? [])
    .map((enrollment) => {
      const student = enrollment.student as {
        id: string;
        student_number: string;
        first_name: string;
        middle_name: string | null;
        last_name: string | null;
      };
      const record = attendanceByEnrollment.get(enrollment.id);

      return {
        enrollment_id: enrollment.id,
        roll_number: enrollment.roll_number,
        student_id: student.id,
        student_number: student.student_number,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        status: record?.status ?? null,
        remarks: record?.remarks ?? null,
        record_id: record?.id ?? null,
      };
    })
    .sort((a, b) => (a.roll_number ?? 9999) - (b.roll_number ?? 9999));
}

/** Sections whose every active enrollment has an attendance record on the given date. */
export async function fetchCompletedAttendanceSectionIds(
  sectionIds: string[],
  attendanceDate: string,
): Promise<string[]> {
  const uniqueSectionIds = [...new Set(sectionIds)];
  if (uniqueSectionIds.length === 0) return [];

  const client = requireSupabase();
  const { data: enrollments, error: enrollmentError } = await client
    .from("enrollments")
    .select("id, section_id")
    .eq("status", "ACTIVE")
    .in("section_id", uniqueSectionIds);

  if (enrollmentError) {
    throw new Error(enrollmentError.message || "Failed to load attendance sections.");
  }

  const enrollmentRows = enrollments ?? [];
  if (enrollmentRows.length === 0) return [];

  const { data: records, error: recordsError } = await client
    .from("attendance_records")
    .select("enrollment_id")
    .eq("attendance_date", attendanceDate)
    .in("enrollment_id", enrollmentRows.map((row) => row.id));

  if (recordsError) {
    throw new Error(recordsError.message || "Failed to check today's attendance.");
  }

  const markedIds = new Set((records ?? []).map((row) => row.enrollment_id));
  const sectionCounts = new Map<string, { total: number; marked: number }>();
  for (const enrollment of enrollmentRows) {
    const count = sectionCounts.get(enrollment.section_id) ?? { total: 0, marked: 0 };
    count.total += 1;
    if (markedIds.has(enrollment.id)) count.marked += 1;
    sectionCounts.set(enrollment.section_id, count);
  }

  return [...sectionCounts]
    .filter(([, count]) => count.total > 0 && count.total === count.marked)
    .map(([sectionId]) => sectionId);
}

export type AttendanceSaveRow = {
  enrollment_id: string;
  status: AttendanceStatus;
  remarks?: string | null;
};

export async function saveAttendanceBatch(
  academicYearId: string,
  attendanceDate: string,
  rows: AttendanceSaveRow[],
): Promise<void> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  const calendarEvent = await fetchCalendarEventForDate(academicYearId, attendanceDate);
  if (calendarEvent && isHolidayEventType(calendarEvent.event_type)) {
    throw new Error(`${calendarEvent.title} is marked as a non-working day.`);
  }

  const validRows = rows.filter((row) => row.status);
  if (validRows.length === 0) {
    throw new Error("Select attendance status for at least one student.");
  }

  const enrollmentIds = validRows.map((row) => row.enrollment_id);
  const { data: existing, error: existingError } = await client
    .from("attendance_records")
    .select("id, enrollment_id")
    .eq("attendance_date", attendanceDate)
    .in("enrollment_id", enrollmentIds);

  if (existingError) {
    throw new Error(existingError.message || "Failed to check existing attendance.");
  }

  const existingByEnrollment = new Map(
    (existing ?? []).map((record) => [record.enrollment_id, record.id]),
  );

  const now = new Date().toISOString();

  for (const row of validRows) {
    const existingId = existingByEnrollment.get(row.enrollment_id);

    if (existingId) {
      const { error } = await client
        .from("attendance_records")
        .update({
          status: row.status,
          remarks: row.remarks?.trim() || null,
          corrected_at: now,
          corrected_by: staffId,
          updated_at: now,
        })
        .eq("id", existingId);

      if (error) {
        throw new Error(error.message || "Failed to update attendance.");
      }
      continue;
    }

    const { error } = await client.from("attendance_records").insert({
      enrollment_id: row.enrollment_id,
      attendance_date: attendanceDate,
      status: row.status,
      remarks: row.remarks?.trim() || null,
      marked_by: staffId,
      marked_at: now,
    });

    if (error) {
      throw new Error(error.message || "Failed to save attendance.");
    }
  }
}

export async function correctAttendanceRecord(
  recordId: string,
  status: AttendanceStatus,
  correctionReason: string,
): Promise<AttendanceRecord> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  if (!correctionReason.trim()) {
    throw new Error("Correction reason is required.");
  }

  const { data, error } = await client
    .from("attendance_records")
    .update({
      status,
      correction_reason: correctionReason.trim(),
      corrected_at: new Date().toISOString(),
      corrected_by: staffId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to correct attendance.");
  }

  return data;
}

export async function fetchAttendanceSummaryForDate(
  academicYearId: string,
  attendanceDate: string,
): Promise<{ present: number; absent: number; total: number }> {
  const client = requireSupabase();

  const { data: enrollments, error: enrollError } = await client
    .from("enrollments")
    .select("id")
    .eq("academic_year_id", academicYearId)
    .eq("status", "ACTIVE");

  if (enrollError) {
    throw new Error(enrollError.message || "Failed to load enrollments.");
  }

  const enrollmentIds = (enrollments ?? []).map((row) => row.id);
  if (enrollmentIds.length === 0) {
    return { present: 0, absent: 0, total: 0 };
  }

  const { data: records, error: recordsError } = await client
    .from("attendance_records")
    .select("status")
    .eq("attendance_date", attendanceDate)
    .in("enrollment_id", enrollmentIds);

  if (recordsError) {
    throw new Error(recordsError.message || "Failed to load attendance summary.");
  }

  const present = (records ?? []).filter(
    (row) => row.status === "PRESENT" || row.status === "LATE" || row.status === "EXCUSED",
  ).length;
  const absent = (records ?? []).filter(
    (row) => row.status === "ABSENT" || row.status === "LEAVE" || row.status === "HALF_DAY",
  ).length;

  return { present, absent, total: records?.length ?? 0 };
}

export function attendanceRowDisplayName(row: AttendanceRow): string {
  return getStudentDisplayName(row);
}
