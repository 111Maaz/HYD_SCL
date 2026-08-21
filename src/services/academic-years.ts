import { requireSupabase } from "@/services/supabase";
import type {
  AcademicYear,
  AcademicYearInput,
  AcademicYearStatus,
  ClassYear,
} from "@/types/academic";

export async function fetchAcademicYears(): Promise<AcademicYear[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("academic_years")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load academic years.");
  }

  return data ?? [];
}

export async function fetchActiveAcademicYear(): Promise<AcademicYear | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("academic_years")
    .select("*")
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load active academic year.");
  }

  return data;
}

export async function createAcademicYear(
  input: AcademicYearInput,
  options?: { bootstrapClasses?: boolean },
): Promise<AcademicYear> {
  const client = requireSupabase();

  if (input.end_date <= input.start_date) {
    throw new Error("End date must be after start date.");
  }

  const status = input.status ?? "PLANNING";

  if (status === "ACTIVE") {
    await deactivateOtherActiveYears(client, null);
  }

  const { data, error } = await client
    .from("academic_years")
    .insert({
      name: input.name.trim(),
      start_date: input.start_date,
      end_date: input.end_date,
      status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create academic year.");
  }

  if (options?.bootstrapClasses) {
    await bootstrapClassYearsForAcademicYear(data.id);
  }

  return data;
}

export async function updateAcademicYear(
  id: string,
  input: AcademicYearInput,
): Promise<AcademicYear> {
  const client = requireSupabase();

  if (input.end_date <= input.start_date) {
    throw new Error("End date must be after start date.");
  }

  const status = input.status ?? "PLANNING";

  if (status === "ACTIVE") {
    await deactivateOtherActiveYears(client, id);
  }

  const { data, error } = await client
    .from("academic_years")
    .update({
      name: input.name.trim(),
      start_date: input.start_date,
      end_date: input.end_date,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update academic year.");
  }

  return data;
}

export async function setAcademicYearStatus(
  id: string,
  status: AcademicYearStatus,
): Promise<AcademicYear> {
  const client = requireSupabase();

  if (status === "ACTIVE") {
    await deactivateOtherActiveYears(client, id);
  }

  const { data, error } = await client
    .from("academic_years")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update academic year status.");
  }

  return data;
}

export async function deleteAcademicYear(id: string): Promise<void> {
  const client = requireSupabase();

  const { data: year, error: fetchError } = await client
    .from("academic_years")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message || "Failed to load academic year.");
  }

  if (year.status !== "PLANNING") {
    throw new Error("Only academic years in Planning status can be deleted.");
  }

  const { error } = await client.from("academic_years").delete().eq("id", id);

  if (error) {
    throw new Error(
      error.message.includes("violates foreign key")
        ? "Cannot delete this year because class structure or enrollments already exist."
        : error.message || "Failed to delete academic year.",
    );
  }
}

/** Create class_years rows for every active master class. Idempotent. */
export async function bootstrapClassYearsForAcademicYear(
  academicYearId: string,
): Promise<ClassYear[]> {
  const client = requireSupabase();

  const { data: classes, error: classesError } = await client
    .from("classes")
    .select("id")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (classesError) {
    throw new Error(classesError.message || "Failed to load master class list.");
  }

  if (!classes?.length) {
    throw new Error("No master classes found. Ensure the classes table is seeded.");
  }

  const { data: existing, error: existingError } = await client
    .from("class_years")
    .select("class_id")
    .eq("academic_year_id", academicYearId);

  if (existingError) {
    throw new Error(existingError.message || "Failed to check existing class years.");
  }

  const existingClassIds = new Set((existing ?? []).map((row) => row.class_id));
  const toInsert = classes
    .filter((c) => !existingClassIds.has(c.id))
    .map((c) => ({
      academic_year_id: academicYearId,
      class_id: c.id,
      expected_student_count: 0,
      active: true,
    }));

  if (toInsert.length === 0) {
    const { data: all, error: allError } = await client
      .from("class_years")
      .select("*")
      .eq("academic_year_id", academicYearId)
      .order("created_at", { ascending: true });

    if (allError) {
      throw new Error(allError.message || "Failed to load class years.");
    }

    return all ?? [];
  }

  const { data, error } = await client.from("class_years").insert(toInsert).select();

  if (error) {
    throw new Error(error.message || "Failed to initialize class structure.");
  }

  return data ?? [];
}

export async function fetchClassYearsForAcademicYear(
  academicYearId: string,
): Promise<ClassYear[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("class_years")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load class years.");
  }

  return data ?? [];
}

async function deactivateOtherActiveYears(
  client: ReturnType<typeof requireSupabase>,
  exceptId: string | null,
) {
  let query = client
    .from("academic_years")
    .update({ status: "CLOSED" as const, updated_at: new Date().toISOString() })
    .eq("status", "ACTIVE");

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to update other active academic years.");
  }
}
