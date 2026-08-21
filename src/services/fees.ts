import { getCurrentStaffProfileId } from "@/services/staff-context";
import { requireSupabase } from "@/services/supabase";
import {
  netChargeAmount,
  type FeeCharge,
  type FeeChargeInput,
  type FeePayment,
  type FeePaymentInput,
  type StudentLedger,
} from "@/types/fees";
import { getStudentDisplayName } from "@/types/students";

export async function fetchFeeCharges(
  academicYearId: string,
  filters?: { studentId?: string },
): Promise<FeeCharge[]> {
  const client = requireSupabase();
  let query = client
    .from("fee_charges")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: false });

  if (filters?.studentId) {
    query = query.eq("student_id", filters.studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load fee charges.");
  }

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
    concession_amount: Number(row.concession_amount),
  }));
}

export async function createFeeCharge(input: FeeChargeInput): Promise<FeeCharge> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  if (!input.description.trim()) {
    throw new Error("Description is required.");
  }

  if (input.amount < 0) {
    throw new Error("Amount cannot be negative.");
  }

  const concession = input.concession_amount ?? 0;
  if (concession < 0 || concession > input.amount) {
    throw new Error("Invalid concession amount.");
  }

  const { data, error } = await client
    .from("fee_charges")
    .insert({
      student_id: input.student_id,
      academic_year_id: input.academic_year_id,
      fee_structure_id: input.fee_structure_id ?? null,
      charge_type: input.charge_type ?? "REGULAR",
      description: input.description.trim(),
      amount: input.amount,
      concession_amount: concession,
      due_date: input.due_date ?? null,
      created_by: staffId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create fee charge.");
  }

  return {
    ...data,
    amount: Number(data.amount),
    concession_amount: Number(data.concession_amount),
  };
}

export async function generateReceiptNumber(paymentDate?: string): Promise<string> {
  const client = requireSupabase();
  const year = paymentDate
    ? new Date(`${paymentDate}T12:00:00`).getFullYear()
    : new Date().getFullYear();
  const prefix = `RCP-${year}-`;

  const { data, error } = await client
    .from("fee_payments")
    .select("receipt_number")
    .like("receipt_number", `${prefix}%`);

  if (error) {
    throw new Error(error.message || "Failed to generate receipt number.");
  }

  let maxSequence = 0;
  for (const row of data ?? []) {
    if (!row.receipt_number) continue;
    const match = row.receipt_number.match(/^RCP-\d{4}-(\d+)$/);
    if (match) {
      maxSequence = Math.max(maxSequence, Number(match[1]));
    }
  }

  return `${prefix}${String(maxSequence + 1).padStart(5, "0")}`;
}

export async function recordFeePayment(input: FeePaymentInput): Promise<FeePayment> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const paymentDate = input.payment_date ?? new Date().toISOString().slice(0, 10);
  const receiptNumber = input.receipt_number ?? (await generateReceiptNumber(paymentDate));

  const { data, error } = await client
    .from("fee_payments")
    .insert({
      student_id: input.student_id,
      academic_year_id: input.academic_year_id,
      amount: input.amount,
      payment_date: paymentDate,
      payment_method: input.payment_method,
      reference_number: input.reference_number?.trim() || null,
      receipt_number: receiptNumber,
      notes: input.notes?.trim() || null,
      recorded_by: staffId,
      cancelled: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to record payment.");
  }

  return { ...data, amount: Number(data.amount) };
}

export async function fetchFeePayments(
  academicYearId: string,
  filters?: { studentId?: string },
): Promise<FeePayment[]> {
  const client = requireSupabase();
  let query = client
    .from("fee_payments")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("payment_date", { ascending: false });

  if (filters?.studentId) {
    query = query.eq("student_id", filters.studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load fee payments.");
  }

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function cancelFeePayment(
  paymentId: string,
  cancellationReason: string,
): Promise<FeePayment> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  if (!cancellationReason.trim()) {
    throw new Error("Cancellation reason is required.");
  }

  const { data, error } = await client
    .from("fee_payments")
    .update({
      cancelled: true,
      cancelled_at: new Date().toISOString(),
      cancelled_by: staffId,
      cancellation_reason: cancellationReason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to cancel payment.");
  }

  return { ...data, amount: Number(data.amount) };
}

export async function fetchStudentLedgers(academicYearId: string): Promise<StudentLedger[]> {
  const client = requireSupabase();

  const { data: students, error: studentsError } = await client
    .from("students")
    .select("id, student_number, first_name, middle_name, last_name")
    .eq("status", "ACTIVE")
    .order("student_number", { ascending: true });

  if (studentsError) {
    throw new Error(studentsError.message || "Failed to load students.");
  }

  const { data: charges, error: chargesError } = await client
    .from("fee_charges")
    .select("student_id, amount, concession_amount")
    .eq("academic_year_id", academicYearId);

  if (chargesError) {
    throw new Error(chargesError.message || "Failed to load fee charges.");
  }

  const { data: payments, error: paymentsError } = await client
    .from("fee_payments")
    .select("student_id, amount, cancelled")
    .eq("academic_year_id", academicYearId);

  if (paymentsError) {
    throw new Error(paymentsError.message || "Failed to load fee payments.");
  }

  const chargeTotals = new Map<string, number>();
  for (const charge of charges ?? []) {
    const net = netChargeAmount({
      amount: Number(charge.amount),
      concession_amount: Number(charge.concession_amount),
    });
    chargeTotals.set(charge.student_id, (chargeTotals.get(charge.student_id) ?? 0) + net);
  }

  const paymentTotals = new Map<string, number>();
  for (const payment of payments ?? []) {
    if (payment.cancelled) continue;
    paymentTotals.set(
      payment.student_id,
      (paymentTotals.get(payment.student_id) ?? 0) + Number(payment.amount),
    );
  }

  return (students ?? [])
    .map((student) => {
      const totalCharges = chargeTotals.get(student.id) ?? 0;
      const totalPayments = paymentTotals.get(student.id) ?? 0;
      return {
        student_id: student.id,
        student_number: student.student_number,
        student_name: getStudentDisplayName(student),
        total_charges: totalCharges,
        total_payments: totalPayments,
        balance: totalCharges - totalPayments,
      };
    })
    .filter((row) => row.total_charges > 0 || row.total_payments > 0 || row.balance !== 0);
}

export async function fetchOutstandingTotal(academicYearId: string): Promise<number> {
  const ledgers = await fetchStudentLedgers(academicYearId);
  return ledgers.reduce((sum, row) => sum + Math.max(0, row.balance), 0);
}
