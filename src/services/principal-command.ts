import { format, parseISO, subDays } from "date-fns";

import { fetchActiveAcademicYear } from "@/services/academic-years";
import { fetchAdmissionLeads } from "@/services/admissions";
import { fetchAuditLogs } from "@/services/audit";
import { fetchCalendarEvents, isHolidayEventType } from "@/services/calendar-events";
import { fetchFeeCharges, fetchFeePayments } from "@/services/fees";
import { requireSupabase } from "@/services/supabase";
import type { AcademicYear } from "@/types/academic";
import type { CalendarEvent } from "@/types/attendance";
import type { AuditLog } from "@/types/audit";
import { netChargeAmount } from "@/types/fees";
import { isInchargeRole, type StaffRoleKey } from "@/types/staff-roles";
import { getStudentDisplayName } from "@/types/students";

const LOW_ATTENDANCE_PCT = 85;
const CHRONIC_ABSENCE_DAYS = 3;

export type CommandAlert = {
  id: string;
  title: string;
  detail: string;
  href: "/admin/attendance" | "/admin/fees" | "/admin/admissions" | "/admin/guardians";
};

export type SectionAttendanceRow = {
  sectionId: string;
  className: string;
  sectionName: string;
  enrolled: number;
  present: number;
  absent: number;
  unmarked: number;
  percent: number | null;
  fullyUnmarked: boolean;
};

export type ClassStrengthRow = {
  className: string;
  displayOrder: number;
  students: number;
};

export type ClassDuesRow = {
  className: string;
  displayOrder: number;
  outstanding: number;
  studentCount: number;
};

export type FeeMonthRow = {
  month: string;
  label: string;
  assessed: number;
  collected: number;
  remaining: number;
};

export type AttendanceTrendRow = {
  date: string;
  label: string;
  percent: number | null;
};

export type SearchHit = {
  kind: "student" | "parent" | "staff";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type PrincipalCommandData = {
  today: string;
  activeYear: AcademicYear | null;
  isAttendanceDay: boolean;
  students: {
    activeEnrolled: number;
    boys: number;
    girls: number;
    unspecified: number;
    newThisYear: number;
    continuingThisYear: number;
  };
  attendanceToday: {
    present: number;
    absent: number;
    unmarked: number;
    markedPercent: number | null;
    percent: number | null;
  };
  attendanceTrend: AttendanceTrendRow[];
  unmarkedSections: SectionAttendanceRow[];
  lowAttendanceSections: SectionAttendanceRow[];
  chronicAbsences: Array<{ studentName: string; studentNumber: string; days: number }>;
  classStrength: ClassStrengthRow[];
  fees: {
    assessed: number;
    collected: number;
    outstanding: number;
    collectionPct: number | null;
    defaulterCount: number;
    byClass: ClassDuesRow[];
    byMonth: FeeMonthRow[];
  };
  admissions: Record<string, number>;
  parents: { total: number; pendingInvite: number };
  staff: { teaching: number; nonTeaching: number; leadership: number; total: number };
  eventsToday: CalendarEvent[];
  eventsUpcoming: CalendarEvent[];
  alerts: CommandAlert[];
  activity: AuditLog[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isBoy(gender: string | null | undefined): boolean {
  const value = (gender ?? "").trim().toLowerCase();
  return value === "male" || value === "boy" || value === "m";
}

function isGirl(gender: string | null | undefined): boolean {
  const value = (gender ?? "").trim().toLowerCase();
  return value === "female" || value === "girl" || value === "f";
}

function isPresentStatus(status: string): boolean {
  return status === "PRESENT" || status === "LATE" || status === "EXCUSED";
}

function isAbsentStatus(status: string): boolean {
  return status === "ABSENT" || status === "LEAVE" || status === "HALF_DAY";
}

function monthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  return format(new Date(Number(year), Number(month) - 1, 1), "MMM");
}

type EnrollmentRow = {
  id: string;
  student_id: string;
  section_id: string;
  class_year_id: string;
  previous_enrollment_id: string | null;
  student: {
    id: string;
    student_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string | null;
    gender: string | null;
    admission_date: string | null;
  } | null;
  section: { id: string; section_name: string } | null;
  class_year: {
    id: string;
    class: { class_name: string; display_order: number } | null;
  } | null;
};

export async function fetchPrincipalCommandData(): Promise<PrincipalCommandData> {
  const client = requireSupabase();
  const today = todayIso();
  const activeYear = await fetchActiveAcademicYear();

  const emptyFees = {
    assessed: 0,
    collected: 0,
    outstanding: 0,
    collectionPct: null as number | null,
    defaulterCount: 0,
    byClass: [] as ClassDuesRow[],
    byMonth: [] as FeeMonthRow[],
  };

  if (!activeYear) {
    const [leads, parents] = await Promise.all([
      fetchAdmissionLeads(),
      countParents(),
    ]);
    const admissions = tallyAdmissions(leads);
    return {
      today,
      activeYear: null,
      isAttendanceDay: false,
      students: {
        activeEnrolled: 0,
        boys: 0,
        girls: 0,
        unspecified: 0,
        newThisYear: 0,
        continuingThisYear: 0,
      },
      attendanceToday: { present: 0, absent: 0, unmarked: 0, markedPercent: null, percent: null },
      attendanceTrend: [],
      unmarkedSections: [],
      lowAttendanceSections: [],
      chronicAbsences: [],
      classStrength: [],
      fees: emptyFees,
      admissions,
      parents,
      staff: await countStaff(),
      eventsToday: [],
      eventsUpcoming: [],
      alerts: buildAdmissionAlerts(admissions, parents.pendingInvite),
      activity: await fetchAuditLogs({ limit: 8 }),
    };
  }

  const sevenAgo = format(subDays(parseISO(today), 6), "yyyy-MM-dd");

  const [
    enrollmentResult,
    leads,
    parents,
    staff,
    charges,
    payments,
    calendar,
    activity,
  ] = await Promise.all([
    client
      .from("enrollments")
      .select(
        `
        id,
        student_id,
        section_id,
        class_year_id,
        previous_enrollment_id,
        student:students (
          id,
          student_number,
          first_name,
          middle_name,
          last_name,
          gender,
          admission_date
        ),
        section:sections ( id, section_name ),
        class_year:class_years (
          id,
          class:classes ( class_name, display_order )
        )
      `,
      )
      .eq("academic_year_id", activeYear.id)
      .eq("status", "ACTIVE"),
    fetchAdmissionLeads(),
    countParents(),
    countStaff(),
    fetchFeeCharges(activeYear.id),
    fetchFeePayments(activeYear.id),
    fetchCalendarEvents(activeYear.id),
    fetchAuditLogs({ limit: 8 }),
  ]);

  if (enrollmentResult.error) {
    throw new Error(enrollmentResult.error.message || "Failed to load enrollments.");
  }

  const enrollments = (enrollmentResult.data ?? []) as EnrollmentRow[];
  const enrollmentIds = enrollments.map((row) => row.id);

  let todayRecords: Array<{ enrollment_id: string; status: string }> = [];
  let recentRecords: Array<{ enrollment_id: string; attendance_date: string; status: string }> =
    [];

  if (enrollmentIds.length > 0) {
    const [todayRes, recentRes] = await Promise.all([
      client
        .from("attendance_records")
        .select("enrollment_id, status")
        .eq("attendance_date", today)
        .in("enrollment_id", enrollmentIds),
      client
        .from("attendance_records")
        .select("enrollment_id, attendance_date, status")
        .gte("attendance_date", sevenAgo)
        .lte("attendance_date", today)
        .in("enrollment_id", enrollmentIds),
    ]);
    if (todayRes.error) {
      throw new Error(todayRes.error.message || "Failed to load today's attendance.");
    }
    if (recentRes.error) {
      throw new Error(recentRes.error.message || "Failed to load attendance history.");
    }
    todayRecords = todayRes.data ?? [];
    recentRecords = recentRes.data ?? [];
  }

  const todayByEnrollment = new Map(todayRecords.map((row) => [row.enrollment_id, row.status]));

  let boys = 0;
  let girls = 0;
  let unspecified = 0;
  let newThisYear = 0;
  let continuingThisYear = 0;
  const classStrengthMap = new Map<string, ClassStrengthRow>();

  for (const row of enrollments) {
    const gender = row.student?.gender ?? null;
    if (isBoy(gender)) boys += 1;
    else if (isGirl(gender)) girls += 1;
    else unspecified += 1;

    const admitted = row.student?.admission_date;
    const admittedThisYear =
      !!admitted && admitted >= activeYear.start_date && admitted <= activeYear.end_date;
    if (admittedThisYear || (!admitted && !row.previous_enrollment_id)) {
      newThisYear += 1;
    } else {
      continuingThisYear += 1;
    }

    const className = row.class_year?.class?.class_name ?? "Unassigned";
    const displayOrder = row.class_year?.class?.display_order ?? 99;
    const current = classStrengthMap.get(className) ?? {
      className,
      displayOrder,
      students: 0,
    };
    current.students += 1;
    classStrengthMap.set(className, current);
  }

  const classStrength = [...classStrengthMap.values()].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.className.localeCompare(b.className),
  );

  const sectionMap = new Map<
    string,
    {
      sectionId: string;
      className: string;
      sectionName: string;
      displayOrder: number;
      enrolled: number;
      present: number;
      absent: number;
      unmarked: number;
    }
  >();

  for (const row of enrollments) {
    const key = row.section_id;
    const className = row.class_year?.class?.class_name ?? "Unassigned";
    const sectionName = row.section?.section_name ?? "—";
    const displayOrder = row.class_year?.class?.display_order ?? 99;
    const bucket = sectionMap.get(key) ?? {
      sectionId: key,
      className,
      sectionName,
      displayOrder,
      enrolled: 0,
      present: 0,
      absent: 0,
      unmarked: 0,
    };
    bucket.enrolled += 1;
    const status = todayByEnrollment.get(row.id);
    if (!status) bucket.unmarked += 1;
    else if (isPresentStatus(status)) bucket.present += 1;
    else if (isAbsentStatus(status)) bucket.absent += 1;
    else bucket.present += 1;
    sectionMap.set(key, bucket);
  }

  const sectionRows: SectionAttendanceRow[] = [...sectionMap.values()]
    .map((row) => {
      const marked = row.present + row.absent;
      return {
        sectionId: row.sectionId,
        className: row.className,
        sectionName: row.sectionName,
        enrolled: row.enrolled,
        present: row.present,
        absent: row.absent,
        unmarked: row.unmarked,
        percent: marked > 0 ? Math.round((row.present / marked) * 1000) / 10 : null,
        fullyUnmarked: row.enrolled > 0 && row.unmarked === row.enrolled,
      };
    })
    .sort(
      (a, b) =>
        a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName),
    );

  const holidayToday = calendar.some(
    (event) => event.event_date === today && isHolidayEventType(event.event_type),
  );
  const isAttendanceDay = !holidayToday;

  const present = sectionRows.reduce((sum, row) => sum + row.present, 0);
  const absent = sectionRows.reduce((sum, row) => sum + row.absent, 0);
  const unmarked = sectionRows.reduce((sum, row) => sum + row.unmarked, 0);
  const markedToday = present + absent;
  const markedPercent = isAttendanceDay && enrollments.length > 0
    ? Math.round((markedToday / enrollments.length) * 1000) / 10
    : null;
  const percent = markedToday > 0 ? Math.round((present / markedToday) * 1000) / 10 : null;

  const unmarkedSections = isAttendanceDay
    ? sectionRows.filter((row) => row.fullyUnmarked)
    : [];
  const lowAttendanceSections = isAttendanceDay
    ? sectionRows.filter(
        (row) =>
          !row.fullyUnmarked &&
          row.percent != null &&
          row.percent < LOW_ATTENDANCE_PCT &&
          row.enrolled >= 5,
      )
    : [];

  const absenceByEnrollment = new Map<string, number>();
  for (const record of recentRecords) {
    if (!isAbsentStatus(record.status)) continue;
    absenceByEnrollment.set(
      record.enrollment_id,
      (absenceByEnrollment.get(record.enrollment_id) ?? 0) + 1,
    );
  }
  const chronicAbsences = enrollments
    .map((row) => ({
      studentName: row.student ? getStudentDisplayName(row.student) : "Student",
      studentNumber: row.student?.student_number ?? "",
      days: absenceByEnrollment.get(row.id) ?? 0,
    }))
    .filter((row) => row.days >= CHRONIC_ABSENCE_DAYS)
    .sort((a, b) => b.days - a.days)
    .slice(0, 8);

  const holidayDates = new Set(
    calendar.filter((event) => isHolidayEventType(event.event_type)).map((event) => event.event_date),
  );
  const attendanceTrend: AttendanceTrendRow[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = format(subDays(parseISO(today), offset), "yyyy-MM-dd");
    const dayRecords = recentRecords.filter((row) => row.attendance_date === date);
    const dayPresent = dayRecords.filter((row) => isPresentStatus(row.status)).length;
    const dayAbsent = dayRecords.filter((row) => isAbsentStatus(row.status)).length;
    const dayMarked = dayPresent + dayAbsent;
    attendanceTrend.push({
      date,
      label: format(parseISO(date), "EEE"),
      percent: holidayDates.has(date) || dayMarked === 0
        ? null
        : Math.round((dayPresent / dayMarked) * 1000) / 10,
    });
  }

  const livePayments = payments.filter((row) => !row.cancelled);
  const assessed = charges.reduce((sum, row) => sum + netChargeAmount(row), 0);
  const collected = livePayments.reduce((sum, row) => sum + Number(row.amount), 0);
  const balanceByStudent = new Map<string, number>();
  for (const charge of charges) {
    balanceByStudent.set(
      charge.student_id,
      (balanceByStudent.get(charge.student_id) ?? 0) + netChargeAmount(charge),
    );
  }
  for (const payment of livePayments) {
    balanceByStudent.set(
      payment.student_id,
      (balanceByStudent.get(payment.student_id) ?? 0) - Number(payment.amount),
    );
  }
  const outstanding = [...balanceByStudent.values()].reduce(
    (sum, value) => sum + Math.max(0, value),
    0,
  );
  const defaulterCount = [...balanceByStudent.values()].filter((value) => value > 0.009).length;

  const classByStudent = new Map<string, { className: string; displayOrder: number }>();
  for (const row of enrollments) {
    classByStudent.set(row.student_id, {
      className: row.class_year?.class?.class_name ?? "Unassigned",
      displayOrder: row.class_year?.class?.display_order ?? 99,
    });
  }
  const duesByClass = new Map<string, ClassDuesRow>();
  for (const [studentId, balance] of balanceByStudent) {
    if (balance <= 0.009) continue;
    const meta = classByStudent.get(studentId) ?? { className: "Unassigned", displayOrder: 99 };
    const current = duesByClass.get(meta.className) ?? {
      className: meta.className,
      displayOrder: meta.displayOrder,
      outstanding: 0,
      studentCount: 0,
    };
    current.outstanding += balance;
    current.studentCount += 1;
    duesByClass.set(meta.className, current);
  }
  const byClass = [...duesByClass.values()].sort(
    (a, b) => b.outstanding - a.outstanding,
  );

  const monthKeys: string[] = [];
  const cursor = new Date(`${activeYear.start_date}T12:00:00`);
  const end = new Date(`${activeYear.end_date}T12:00:00`);
  while (cursor <= end && monthKeys.length < 12) {
    monthKeys.push(format(cursor, "yyyy-MM"));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const assessedByMonth = new Map<string, number>();
  const collectedByMonth = new Map<string, number>();
  for (const key of monthKeys) {
    assessedByMonth.set(key, 0);
    collectedByMonth.set(key, 0);
  }
  for (const charge of charges) {
    const key = (charge.due_date ?? charge.created_at.slice(0, 10)).slice(0, 7);
    if (!assessedByMonth.has(key)) continue;
    assessedByMonth.set(key, (assessedByMonth.get(key) ?? 0) + netChargeAmount(charge));
  }
  for (const payment of livePayments) {
    const key = payment.payment_date.slice(0, 7);
    if (!collectedByMonth.has(key)) continue;
    collectedByMonth.set(key, (collectedByMonth.get(key) ?? 0) + Number(payment.amount));
  }
  const byMonth: FeeMonthRow[] = monthKeys.map((month) => {
    const monthAssessed = assessedByMonth.get(month) ?? 0;
    const monthCollected = collectedByMonth.get(month) ?? 0;
    return {
      month,
      label: monthLabel(month),
      assessed: monthAssessed,
      collected: monthCollected,
      remaining: Math.max(0, monthAssessed - monthCollected),
    };
  });

  const admissions = tallyAdmissions(leads);
  const eventsToday = calendar.filter((event) => event.event_date === today);
  const eventsUpcoming = calendar
    .filter((event) => event.event_date > today)
    .slice(0, 6);

  const alerts: CommandAlert[] = [];
  if (isAttendanceDay && unmarkedSections.length > 0) {
    alerts.push({
      id: "attendance-unmarked",
      title: "Attendance not marked",
      detail: `${unmarkedSections.length} section${unmarkedSections.length === 1 ? " has" : "s have"} not submitted attendance today.`,
      href: "/admin/attendance",
    });
  }
  if (lowAttendanceSections.length > 0) {
    alerts.push({
      id: "attendance-low",
      title: "Low attendance",
      detail: `${lowAttendanceSections.length} section${lowAttendanceSections.length === 1 ? " is" : "s are"} below ${LOW_ATTENDANCE_PCT}% among marked students.`,
      href: "/admin/attendance",
    });
  }
  if (outstanding > 0) {
    alerts.push({
      id: "fees-outstanding",
      title: "Outstanding fees",
      detail: `${defaulterCount} student${defaulterCount === 1 ? " has" : "s have"} dues totalling ${formatInr(outstanding)}.`,
      href: "/admin/fees",
    });
  }
  alerts.push(...buildAdmissionAlerts(admissions, parents.pendingInvite));

  return {
    today,
    activeYear,
    isAttendanceDay,
    students: {
      activeEnrolled: enrollments.length,
      boys,
      girls,
      unspecified,
      newThisYear,
      continuingThisYear,
    },
    attendanceToday: { present, absent, unmarked, markedPercent, percent },
    attendanceTrend,
    unmarkedSections,
    lowAttendanceSections,
    chronicAbsences,
    classStrength,
    fees: {
      assessed,
      collected,
      outstanding,
      collectionPct: assessed > 0 ? Math.round((collected / assessed) * 1000) / 10 : null,
      defaulterCount,
      byClass,
      byMonth,
    },
    admissions,
    parents,
    staff,
    eventsToday,
    eventsUpcoming,
    alerts,
    activity,
  };
}

export async function searchPrincipalDirectory(term: string): Promise<SearchHit[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  const client = requireSupabase();
  const like = `%${q}%`;

  const [students, guardians, staff] = await Promise.all([
    client
      .from("students")
      .select("id, student_number, first_name, middle_name, last_name")
      .or(
        `student_number.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},middle_name.ilike.${like}`,
      )
      .limit(8),
    client
      .from("guardians")
      .select("id, first_name, last_name, email, phone")
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
      .limit(6),
    client
      .from("staff_profiles")
      .select("id, first_name, last_name, email, designation")
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},designation.ilike.${like}`)
      .limit(6),
  ]);

  const hits: SearchHit[] = [];

  for (const row of students.data ?? []) {
    hits.push({
      kind: "student",
      id: row.id,
      title: getStudentDisplayName(row),
      subtitle: row.student_number,
      href: "/admin/students",
    });
  }
  for (const row of guardians.data ?? []) {
    hits.push({
      kind: "parent",
      id: row.id,
      title: [row.first_name, row.last_name].filter(Boolean).join(" "),
      subtitle: row.email || row.phone || "Guardian",
      href: "/admin/guardians",
    });
  }
  for (const row of staff.data ?? []) {
    hits.push({
      kind: "staff",
      id: row.id,
      title: [row.first_name, row.last_name].filter(Boolean).join(" "),
      subtitle: row.designation || row.email || "Staff",
      href: "/admin/faculty-accounts",
    });
  }

  return hits;
}

function tallyAdmissions(leads: Array<{ status: string }>): Record<string, number> {
  const counts: Record<string, number> = {
    New: 0,
    Contacted: 0,
    "Visit Scheduled": 0,
    Enrolled: 0,
    Rejected: 0,
  };
  for (const lead of leads) {
    counts[lead.status] = (counts[lead.status] ?? 0) + 1;
  }
  return counts;
}

function buildAdmissionAlerts(
  admissions: Record<string, number>,
  pendingInvite: number,
): CommandAlert[] {
  const alerts: CommandAlert[] = [];
  const open = (admissions.New ?? 0) + (admissions.Contacted ?? 0) + (admissions["Visit Scheduled"] ?? 0);
  if (open > 0) {
    alerts.push({
      id: "admissions-open",
      title: "Admissions in pipeline",
      detail: `${open} enquir${open === 1 ? "y is" : "ies are"} still open (new, contacted, or visit scheduled).`,
      href: "/admin/admissions",
    });
  }
  if (pendingInvite > 0) {
    alerts.push({
      id: "parent-invite",
      title: "Parent logins pending",
      detail: `${pendingInvite} guardian${pendingInvite === 1 ? " has" : "s have"} no portal login yet.`,
      href: "/admin/guardians",
    });
  }
  return alerts;
}

async function countParents(): Promise<{ total: number; pendingInvite: number }> {
  const client = requireSupabase();
  const { data, error } = await client.from("guardians").select("id, auth_user_id, active");
  if (error) throw new Error(error.message || "Failed to count guardians.");
  const rows = (data ?? []).filter((row) => row.active !== false);
  return {
    total: rows.length,
    pendingInvite: rows.filter((row) => !row.auth_user_id).length,
  };
}

async function countStaff(): Promise<{
  teaching: number;
  nonTeaching: number;
  leadership: number;
  total: number;
}> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("staff_profiles")
    .select(
      `
      id,
      status,
      staff_roles (
        active,
        roles ( role_key )
      )
    `,
    )
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(error.message || "Failed to count staff.");
  }

  let teaching = 0;
  let nonTeaching = 0;
  let leadership = 0;
  for (const row of data ?? []) {
    const keys = ((row.staff_roles ?? []) as Array<{
      active: boolean;
      roles: { role_key: string } | null;
    }>)
      .filter((item) => item.active && item.roles?.role_key)
      .map((item) => item.roles!.role_key as StaffRoleKey);
    if (keys.includes("TEACHER")) teaching += 1;
    else if (keys.includes("STAFF")) nonTeaching += 1;
    else if (
      keys.includes("PRINCIPAL") ||
      keys.includes("VICE_PRINCIPAL") ||
      keys.some((key) => isInchargeRole(key))
    ) {
      leadership += 1;
    } else {
      nonTeaching += 1;
    }
  }

  return {
    teaching,
    nonTeaching,
    leadership,
    total: teaching + nonTeaching + leadership,
  };
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
