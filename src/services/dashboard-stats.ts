import { fetchAttendanceSummaryForDate } from "@/services/attendance";
import { fetchActiveAcademicYear } from "@/services/academic-years";
import { fetchAdmissionLeads } from "@/services/admissions";
import { fetchOutstandingTotal } from "@/services/fees";
import { requireSupabase } from "@/services/supabase";

export type DashboardStats = {
  newLeads: number;
  activeStudents: number;
  activeEnrollments: number;
  attendanceToday: { present: number; absent: number; total: number };
  outstandingFees: number;
  hasActiveYear: boolean;
  activeYearName: string | null;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const client = requireSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const [leads, activeYear] = await Promise.all([
    fetchAdmissionLeads(),
    fetchActiveAcademicYear(),
  ]);

  const newLeads = leads.filter((lead) => lead.status === "New").length;

  const { count: studentCount, error: studentError } = await client
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (studentError) {
    throw new Error(studentError.message || "Failed to count students.");
  }

  let activeEnrollments = 0;
  let attendanceToday = { present: 0, absent: 0, total: 0 };
  let outstandingFees = 0;

  if (activeYear?.id) {
    const { count, error } = await client
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("academic_year_id", activeYear.id)
      .eq("status", "ACTIVE");

    if (error) {
      throw new Error(error.message || "Failed to count enrollments.");
    }

    activeEnrollments = count ?? 0;
    attendanceToday = await fetchAttendanceSummaryForDate(activeYear.id, today);
    outstandingFees = await fetchOutstandingTotal(activeYear.id);
  }

  return {
    newLeads,
    activeStudents: studentCount ?? 0,
    activeEnrollments,
    attendanceToday,
    outstandingFees,
    hasActiveYear: Boolean(activeYear),
    activeYearName: activeYear?.name ?? null,
  };
}
