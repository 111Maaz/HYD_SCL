import { fetchActiveAcademicYear } from "@/services/academic-years";
import { requireSupabase } from "@/services/supabase";
import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus } from "@/types/attendance";
import { netChargeAmount } from "@/types/fees";
import { getStudentDisplayName } from "@/types/students";

export type ParentChildAttendanceRow = {
  attendance_date: string;
  status: AttendanceStatus;
  remarks: string | null;
};

export type ParentChildFeeSummary = {
  total_charges: number;
  total_payments: number;
  balance: number;
  charges: Array<{
    id: string;
    description: string;
    amount: number;
    concession_amount: number;
    due_date: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    receipt_number: string | null;
    cancelled: boolean;
  }>;
};

export type ParentChildEnrollment = {
  class_name: string;
  section_name: string;
  roll_number: number | null;
  academic_year_name: string;
};

export async function fetchOwnGuardianProfile() {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await client
    .from("guardians")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load profile.");
  if (!data) throw new Error("No parent profile linked to this account.");
  return data;
}

export async function updateOwnGuardianProfile(input: {
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await client
    .from("guardians")
    .update({
      first_name: input.first_name.trim(),
      last_name: input.last_name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to update profile.");
  return data;
}

export async function fetchParentChildEnrollment(
  studentId: string,
): Promise<ParentChildEnrollment | null> {
  const client = requireSupabase();
  const year = await fetchActiveAcademicYear();
  if (!year) return null;

  const { data, error } = await client
    .from("enrollments")
    .select(
      `
      roll_number,
      section:sections ( section_name ),
      class_year:class_years (
        class:classes ( class_name )
      ),
      academic_year:academic_years ( name )
    `,
    )
    .eq("student_id", studentId)
    .eq("academic_year_id", year.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load enrollment.");
  if (!data) return null;

  return {
    class_name: (data.class_year as { class: { class_name: string } }).class.class_name,
    section_name: (data.section as { section_name: string }).section_name,
    roll_number: data.roll_number,
    academic_year_name: (data.academic_year as { name: string }).name,
  };
}

export async function fetchParentChildProfile(studentId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to load student.");
  if (!data) throw new Error("Student not found or not linked to your account.");
  return data;
}

export async function fetchParentChildAttendance(
  studentId: string,
  limit = 60,
): Promise<ParentChildAttendanceRow[]> {
  const client = requireSupabase();
  const year = await fetchActiveAcademicYear();
  if (!year) return [];

  const { data: enrollments, error: enrollError } = await client
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("academic_year_id", year.id);

  if (enrollError) throw new Error(enrollError.message || "Failed to load enrollment.");

  const enrollmentIds = (enrollments ?? []).map((e) => e.id);
  if (enrollmentIds.length === 0) return [];

  const { data, error } = await client
    .from("attendance_records")
    .select("attendance_date, status, remarks")
    .in("enrollment_id", enrollmentIds)
    .order("attendance_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || "Failed to load attendance.");

  return (data ?? []) as ParentChildAttendanceRow[];
}

export async function fetchParentChildFees(studentId: string): Promise<ParentChildFeeSummary> {
  const client = requireSupabase();
  const year = await fetchActiveAcademicYear();
  if (!year) {
    return { total_charges: 0, total_payments: 0, balance: 0, charges: [], payments: [] };
  }

  const { data: charges, error: chargesError } = await client
    .from("fee_charges")
    .select("id, description, amount, concession_amount, due_date")
    .eq("student_id", studentId)
    .eq("academic_year_id", year.id)
    .order("created_at", { ascending: false });

  if (chargesError) throw new Error(chargesError.message || "Failed to load fee charges.");

  const { data: payments, error: paymentsError } = await client
    .from("fee_payments")
    .select("id, amount, payment_date, receipt_number, cancelled")
    .eq("student_id", studentId)
    .eq("academic_year_id", year.id)
    .order("payment_date", { ascending: false });

  if (paymentsError) throw new Error(paymentsError.message || "Failed to load fee payments.");

  const chargeRows = (charges ?? []).map((c) => ({
    id: c.id,
    description: c.description,
    amount: Number(c.amount),
    concession_amount: Number(c.concession_amount),
    due_date: c.due_date,
  }));

  const paymentRows = (payments ?? []).map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    payment_date: p.payment_date,
    receipt_number: p.receipt_number,
    cancelled: p.cancelled,
  }));

  const total_charges = chargeRows.reduce(
    (sum, c) => sum + netChargeAmount({ amount: c.amount, concession_amount: c.concession_amount }),
    0,
  );
  const total_payments = paymentRows
    .filter((p) => !p.cancelled)
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    total_charges,
    total_payments,
    balance: total_charges - total_payments,
    charges: chargeRows,
    payments: paymentRows,
  };
}

export function formatAttendanceStatus(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_LABELS[status] ?? status;
}

export { getStudentDisplayName };
