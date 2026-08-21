import { getCurrentStaffProfileId } from "@/services/staff-context";
import { requireSupabase } from "@/services/supabase";
import { netChargeAmount, type FeeStructure, type FeeStructureInput } from "@/types/fees";

export async function fetchFeeStructures(academicYearId: string): Promise<FeeStructure[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("fee_structures")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load fee structures.");
  }

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function createFeeStructure(input: FeeStructureInput): Promise<FeeStructure> {
  const client = requireSupabase();

  if (!input.fee_name.trim()) {
    throw new Error("Fee name is required.");
  }

  if (input.amount < 0) {
    throw new Error("Amount cannot be negative.");
  }

  const { data, error } = await client
    .from("fee_structures")
    .insert({
      academic_year_id: input.academic_year_id,
      class_year_id: input.class_year_id ?? null,
      fee_name: input.fee_name.trim(),
      amount: input.amount,
      due_date: input.due_date ?? null,
      active: input.active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create fee structure.");
  }

  return { ...data, amount: Number(data.amount) };
}

export async function updateFeeStructure(
  structureId: string,
  input: Partial<FeeStructureInput>,
): Promise<FeeStructure> {
  const client = requireSupabase();

  if (input.amount !== undefined && input.amount < 0) {
    throw new Error("Amount cannot be negative.");
  }

  const { data, error } = await client
    .from("fee_structures")
    .update({
      class_year_id: input.class_year_id,
      fee_name: input.fee_name?.trim(),
      amount: input.amount,
      due_date: input.due_date,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", structureId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update fee structure.");
  }

  return { ...data, amount: Number(data.amount) };
}

export async function deleteFeeStructure(structureId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("fee_structures").delete().eq("id", structureId);

  if (error) {
    throw new Error(
      error.message.includes("violates foreign key")
        ? "Cannot delete a fee structure that has charges linked."
        : error.message || "Failed to delete fee structure.",
    );
  }
}

export async function generateChargesFromStructure(structureId: string): Promise<number> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  const { data: structure, error: structureError } = await client
    .from("fee_structures")
    .select("*")
    .eq("id", structureId)
    .single();

  if (structureError || !structure) {
    throw new Error(structureError?.message || "Fee structure not found.");
  }

  let enrollmentQuery = client
    .from("enrollments")
    .select("student_id")
    .eq("academic_year_id", structure.academic_year_id)
    .eq("status", "ACTIVE");

  if (structure.class_year_id) {
    enrollmentQuery = enrollmentQuery.eq("class_year_id", structure.class_year_id);
  }

  const { data: enrollments, error: enrollError } = await enrollmentQuery;

  if (enrollError) {
    throw new Error(enrollError.message || "Failed to load enrollments for fee generation.");
  }

  const studentIds = [...new Set((enrollments ?? []).map((row) => row.student_id))];
  if (studentIds.length === 0) {
    return 0;
  }

  const { data: existing, error: existingError } = await client
    .from("fee_charges")
    .select("student_id")
    .eq("fee_structure_id", structureId)
    .in("student_id", studentIds);

  if (existingError) {
    throw new Error(existingError.message || "Failed to check existing charges.");
  }

  const existingStudentIds = new Set((existing ?? []).map((row) => row.student_id));
  const toCreate = studentIds.filter((id) => !existingStudentIds.has(id));

  if (toCreate.length === 0) {
    return 0;
  }

  const rows = toCreate.map((studentId) => ({
    student_id: studentId,
    academic_year_id: structure.academic_year_id,
    fee_structure_id: structureId,
    charge_type: "REGULAR" as const,
    description: structure.fee_name,
    amount: structure.amount,
    concession_amount: 0,
    due_date: structure.due_date,
    created_by: staffId,
  }));

  const { error: insertError } = await client.from("fee_charges").insert(rows);

  if (insertError) {
    throw new Error(insertError.message || "Failed to generate fee charges.");
  }

  return rows.length;
}
