/** ERP staff role keys seeded in public.roles */

export const STAFF_ROLE_KEYS = [
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "ACADEMIC_INCHARGE",
  "ATTENDANCE_INCHARGE",
  "FEES_INCHARGE",
  "OPERATIONS_INCHARGE",
  "TEACHER",
  "STAFF",
] as const;

export type StaffRoleKey = (typeof STAFF_ROLE_KEYS)[number];

export const STAFF_ROLE_LABELS: Record<StaffRoleKey, string> = {
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  ACADEMIC_INCHARGE: "Academic Incharge",
  ATTENDANCE_INCHARGE: "Attendance Incharge",
  FEES_INCHARGE: "Fees Incharge",
  OPERATIONS_INCHARGE: "Operations Incharge",
  TEACHER: "Teacher",
  STAFF: "Staff",
};

/** Roles that may be assigned when provisioning a staff login account. */
export const ASSIGNABLE_STAFF_ROLE_KEYS: StaffRoleKey[] = [
  "TEACHER",
  "ATTENDANCE_INCHARGE",
  "FEES_INCHARGE",
  "ACADEMIC_INCHARGE",
  "OPERATIONS_INCHARGE",
  "VICE_PRINCIPAL",
  "STAFF",
];

/** School-wide duties — not tied to a class. */
export const SCHOOL_WIDE_ROLE_KEYS: StaffRoleKey[] = [
  "VICE_PRINCIPAL",
  "ACADEMIC_INCHARGE",
  "ATTENDANCE_INCHARGE",
  "FEES_INCHARGE",
  "OPERATIONS_INCHARGE",
];

/** Incharge duties that a class teacher may also hold school-wide. */
export const INCHARGE_ROLE_KEYS: StaffRoleKey[] = [
  "ACADEMIC_INCHARGE",
  "ATTENDANCE_INCHARGE",
  "FEES_INCHARGE",
  "OPERATIONS_INCHARGE",
];

export function isStaffRoleKey(value: string): value is StaffRoleKey {
  return (STAFF_ROLE_KEYS as readonly string[]).includes(value);
}

export function isSchoolWideStaffRole(roleKey: StaffRoleKey | null | undefined): boolean {
  if (!roleKey) return false;
  return (SCHOOL_WIDE_ROLE_KEYS as readonly string[]).includes(roleKey);
}

export function isInchargeRole(roleKey: StaffRoleKey | null | undefined): boolean {
  if (!roleKey) return false;
  return (INCHARGE_ROLE_KEYS as readonly string[]).includes(roleKey);
}

/** Class assignment applies to Teacher / Staff only (optional teaching class). */
export function roleUsesAssignedClass(roleKey: StaffRoleKey | null | undefined): boolean {
  return roleKey === "TEACHER" || roleKey === "STAFF";
}

const ROLE_PRIORITY: Record<StaffRoleKey, number> = {
  PRINCIPAL: 1,
  VICE_PRINCIPAL: 2,
  ACADEMIC_INCHARGE: 3,
  ATTENDANCE_INCHARGE: 4,
  FEES_INCHARGE: 5,
  OPERATIONS_INCHARGE: 6,
  TEACHER: 7,
  STAFF: 8,
};

export function pickPrimaryStaffRoleKey(
  roleKeys: Array<StaffRoleKey | string | null | undefined>,
): StaffRoleKey | null {
  const keys = roleKeys.filter((k): k is StaffRoleKey => !!k && isStaffRoleKey(k));
  if (keys.length === 0) return null;
  return [...keys].sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b])[0] ?? null;
}

/** Maps ERP role → existing app portal (admin shell vs faculty portal). */
export function appPortalForStaffRole(roleKey: StaffRoleKey | null | undefined): "admin" | "faculty" | null {
  if (!roleKey) return null;
  if (roleKey === "TEACHER" || roleKey === "STAFF") return "faculty";
  return "admin";
}
