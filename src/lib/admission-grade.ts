import type { ClassYearWithClass } from "@/types/academic";

/** Normalize admission form grade labels for class matching. */
export function normalizeAdmissionGrade(grade: string): string {
  return grade.trim();
}

/**
 * Match an admission enquiry grade (e.g. "Class 5", "Nursery") to a class-year row.
 */
export function matchClassYearForGrade(
  grade: string,
  classYears: ClassYearWithClass[],
): ClassYearWithClass | null {
  const normalized = normalizeAdmissionGrade(grade).toLowerCase();

  const exact = classYears.find(
    (row) =>
      row.class.class_name.toLowerCase() === normalized ||
      row.class.class_code.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const classNumberMatch = normalized.match(/^class\s*(\d{1,2})$/);
  if (classNumberMatch) {
    const classNumber = classNumberMatch[1];
    const padded = classNumber.padStart(2, "0");

    const byNumber = classYears.find((row) => {
      const name = row.class.class_name.toLowerCase();
      const code = row.class.class_code.toLowerCase();
      return (
        name === `class ${classNumber}` ||
        name === `class-${classNumber}` ||
        code === `c${classNumber}` ||
        code === `class${classNumber}` ||
        code === `class_${padded}` ||
        code === `grade_${classNumber}`
      );
    });
    if (byNumber) return byNumber;
  }

  return null;
}

/** Split a free-text person name into first, optional middle, and last. */
export function parsePersonName(fullName: string): {
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "Student", middle_name: null, last_name: null };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], middle_name: null, last_name: null };
  }
  if (parts.length === 2) {
    return { first_name: parts[0], middle_name: null, last_name: parts[1] };
  }

  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}
