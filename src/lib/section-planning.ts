export type SectionPlanItem = {
  section_name: string;
  capacity: number;
};

const SECTION_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Recommends a section layout from expected enrollment and preferred capacity.
 * The school administrator always makes the final decision (per platform doc).
 */
export function suggestSectionPlan(
  expectedStudents: number,
  preferredCapacity: number,
): SectionPlanItem[] {
  if (expectedStudents <= 0 || preferredCapacity <= 0) {
    return [];
  }

  const sectionCount = Math.max(1, Math.ceil(expectedStudents / preferredCapacity));
  const base = Math.floor(expectedStudents / sectionCount);
  const remainder = expectedStudents % sectionCount;

  return Array.from({ length: sectionCount }, (_, index) => ({
    section_name: SECTION_NAMES[index] ?? `S${index + 1}`,
    capacity: base + (index < remainder ? 1 : 0),
  }));
}

export function totalSectionCapacity(sections: Pick<SectionPlanItem, "capacity">[]): number {
  return sections.reduce((sum, section) => sum + section.capacity, 0);
}
