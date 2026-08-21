import { bootstrapClassYearsForAcademicYear } from "@/services/academic-years";
import { requireSupabase } from "@/services/supabase";
import type {
  ClassYear,
  ClassYearUpdateInput,
  ClassYearWithClass,
  Section,
  SectionInput,
} from "@/types/academic";

export async function fetchClassYearsWithDetails(
  academicYearId: string,
): Promise<ClassYearWithClass[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("class_years")
    .select(
      `
      *,
      class:classes (
        id,
        class_code,
        class_name,
        display_order,
        active
      ),
      sections (
        id,
        class_year_id,
        section_name,
        capacity,
        display_order,
        active,
        created_at,
        updated_at
      )
    `,
    )
    .eq("academic_year_id", academicYearId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load class structure.");
  }

  const rows = (data ?? []) as Array<
    ClassYear & {
      class: ClassYearWithClass["class"];
      sections: Section[] | null;
    }
  >;

  return rows
    .map((row) => ({
      ...row,
      sections: (row.sections ?? []).sort((a, b) => a.display_order - b.display_order),
    }))
    .sort((a, b) => a.class.display_order - b.class.display_order);
}

export async function updateClassYear(
  classYearId: string,
  input: ClassYearUpdateInput,
): Promise<ClassYear> {
  const client = requireSupabase();

  if (input.expected_student_count < 0) {
    throw new Error("Expected student count cannot be negative.");
  }

  const { data, error } = await client
    .from("class_years")
    .update({
      expected_student_count: input.expected_student_count,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classYearId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update class year.");
  }

  return data;
}

export async function createSection(
  classYearId: string,
  input: SectionInput,
): Promise<Section> {
  const client = requireSupabase();
  const name = input.section_name.trim();

  if (!name) {
    throw new Error("Section name is required.");
  }

  if (input.capacity != null && input.capacity <= 0) {
    throw new Error("Capacity must be greater than zero.");
  }

  const displayOrder =
    input.display_order ?? (await getNextSectionDisplayOrder(client, classYearId));

  const { data, error } = await client
    .from("sections")
    .insert({
      class_year_id: classYearId,
      section_name: name,
      capacity: input.capacity ?? null,
      display_order: displayOrder,
      active: input.active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create section.");
  }

  return data;
}

export async function updateSection(sectionId: string, input: SectionInput): Promise<Section> {
  const client = requireSupabase();
  const name = input.section_name.trim();

  if (!name) {
    throw new Error("Section name is required.");
  }

  if (input.capacity != null && input.capacity <= 0) {
    throw new Error("Capacity must be greater than zero.");
  }

  const { data, error } = await client
    .from("sections")
    .update({
      section_name: name,
      capacity: input.capacity ?? null,
      display_order: input.display_order,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sectionId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update section.");
  }

  return data;
}

export async function deleteSection(sectionId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("sections").delete().eq("id", sectionId);

  if (error) {
    throw new Error(
      error.message.includes("violates foreign key")
        ? "Cannot delete this section because enrollments already exist."
        : error.message || "Failed to delete section.",
    );
  }
}

/** Apply recommended sections for a class-year. */
export async function applySectionRecommendations(
  classYearId: string,
  recommendations: Array<{ sectionName: string; capacity: number }>,
  options?: { replaceExisting?: boolean },
): Promise<Section[]> {
  const client = requireSupabase();
  let toApply = recommendations;

  if (options?.replaceExisting) {
    const { data: existing, error: existingError } = await client
      .from("sections")
      .select("id")
      .eq("class_year_id", classYearId);

    if (existingError) {
      throw new Error(existingError.message || "Failed to load existing sections.");
    }

    if (existing?.length) {
      const { error: deleteError } = await client
        .from("sections")
        .delete()
        .in(
          "id",
          existing.map((row) => row.id),
        );

      if (deleteError) {
        throw new Error(
          deleteError.message.includes("violates foreign key")
            ? "Cannot replace sections while enrollments exist. Remove enrollments first."
            : deleteError.message || "Failed to clear existing sections.",
        );
      }
    }
  } else {
    const { data: existing, error: existingError } = await client
      .from("sections")
      .select("section_name")
      .eq("class_year_id", classYearId);

    if (existingError) {
      throw new Error(existingError.message || "Failed to load existing sections.");
    }

    const existingNames = new Set(
      (existing ?? []).map((row) => row.section_name.trim().toLowerCase()),
    );

    toApply = recommendations.filter(
      (rec) => !existingNames.has(rec.sectionName.trim().toLowerCase()),
    );

    if (toApply.length === 0) {
      throw new Error("All recommended section names already exist. Enable replace or add manually.");
    }
  }

  const created: Section[] = [];

  for (let index = 0; index < toApply.length; index++) {
    const rec = toApply[index];
    const section = await createSection(classYearId, {
      section_name: rec.sectionName,
      capacity: rec.capacity,
      display_order: index + 1,
      active: true,
    });
    created.push(section);
  }

  return created;
}

export async function ensureClassYearsInitialized(academicYearId: string): Promise<void> {
  await bootstrapClassYearsForAcademicYear(academicYearId);
}

async function getNextSectionDisplayOrder(
  client: ReturnType<typeof requireSupabase>,
  classYearId: string,
): Promise<number> {
  const { data, error } = await client
    .from("sections")
    .select("display_order")
    .eq("class_year_id", classYearId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to determine section order.");
  }

  return (data?.display_order ?? 0) + 1;
}
