export const ACADEMIC_YEAR_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "CLOSED",
  "ARCHIVED",
] as const;

export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUSES)[number];

export type AcademicYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: AcademicYearStatus;
  created_at: string;
  updated_at: string;
};

export type AcademicYearInput = {
  name: string;
  start_date: string;
  end_date: string;
  status?: AcademicYearStatus;
};

export type ClassMaster = {
  id: string;
  class_code: string;
  class_name: string;
  display_order: number;
  active: boolean;
};

export type ClassYear = {
  id: string;
  academic_year_id: string;
  class_id: string;
  expected_student_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: string;
  class_year_id: string;
  section_name: string;
  capacity: number | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SectionInput = {
  section_name: string;
  capacity?: number | null;
  display_order?: number;
  active?: boolean;
};

export type ClassYearWithClass = ClassYear & {
  class: ClassMaster;
  sections: Section[];
};

export type ClassYearUpdateInput = {
  expected_student_count: number;
  active?: boolean;
};

export type SectionRecommendation = {
  sectionName: string;
  capacity: number;
};

export function recommendSections(
  expectedStudents: number,
  preferredCapacity = 40,
): SectionRecommendation[] {
  if (expectedStudents <= 0 || preferredCapacity <= 0) return [];

  const sectionCount = Math.max(1, Math.ceil(expectedStudents / preferredCapacity));
  const baseCapacity = Math.ceil(expectedStudents / sectionCount);
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return Array.from({ length: sectionCount }, (_, index) => ({
    sectionName: labels[index] ?? String(index + 1),
    capacity: baseCapacity,
  }));
}

export function sectionEnrollmentSummary(
  sections: Pick<Section, "capacity" | "active">[],
): { totalCapacity: number; activeSections: number } {
  const activeSections = sections.filter((s) => s.active);
  const totalCapacity = activeSections.reduce((sum, s) => sum + (s.capacity ?? 0), 0);
  return { totalCapacity, activeSections: activeSections.length };
}

export type SectionWithClass = Section & {
  class_year: Pick<ClassYear, "id" | "academic_year_id" | "class_id"> & {
    class: Pick<ClassMaster, "class_name" | "display_order">;
  };
};

export const ACADEMIC_YEAR_STATUS_LABELS: Record<AcademicYearStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};
