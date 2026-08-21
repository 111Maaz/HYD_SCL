import { BookOpen, CalendarDays, GraduationCap, IndianRupee, LayoutDashboard, Upload, User } from "lucide-react";

import type { StaffRoleKey } from "@/types/staff-roles";
import { STAFF_ROLE_LABELS } from "@/types/staff-roles";

/** Slim role portals — Account Centre + role home (not the old full ERP nav). */
export const ROLE_PORTAL_NAV = {
  PRINCIPAL: [
    { to: "/admin/dashboard", label: "Console", icon: LayoutDashboard },
    { to: "/admin/import", label: "Import Centre", icon: Upload },
    { to: "/admin/year-end", label: "Year-end", icon: GraduationCap },
    { to: "/admin/account", label: "Account centre", icon: User },
  ],
  VICE_PRINCIPAL: [
    { to: "/admin/dashboard", label: "Console", icon: LayoutDashboard },
    { to: "/admin/import", label: "Import Centre", icon: Upload },
    { to: "/admin/year-end", label: "Year-end", icon: GraduationCap },
    { to: "/admin/account", label: "Account centre", icon: User },
  ],
  ATTENDANCE_INCHARGE: [
    { to: "/admin/attendance", label: "Attendance allotment", icon: LayoutDashboard },
    { to: "/admin/account", label: "Account centre", icon: User },
  ],
  ACADEMIC_INCHARGE: [
    { to: "/admin/academic-structure", label: "Academic home", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: GraduationCap },
    { to: "/admin/guardians", label: "Guardians", icon: User },
    { to: "/admin/year-end", label: "Year-end", icon: GraduationCap },
    { to: "/admin/account", label: "Account centre", icon: User },
  ],
  FEES_INCHARGE: [
    { to: "/admin/fees", label: "Fees home", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: GraduationCap },
    { to: "/admin/account", label: "Account centre", icon: User },
  ],
  OPERATIONS_INCHARGE: [
    { to: "/admin/calendar", label: "Operations home", icon: LayoutDashboard },
    { to: "/admin/gallery", label: "Gallery", icon: BookOpen },
    { to: "/admin/contact", label: "Contact", icon: CalendarDays },
    { to: "/admin/account", label: "Account centre", icon: User },
  ],
} as const;

export type AdminPortalPath =
  | "/admin/dashboard"
  | "/admin/account"
  | "/admin/attendance"
  | "/admin/academic-structure"
  | "/admin/fees"
  | "/admin/calendar"
  | "/admin/academic-years"
  | "/admin/students"
  | "/admin/guardians"
  | "/admin/admissions"
  | "/admin/class-materials"
  | "/admin/gallery"
  | "/admin/contact"
  | "/admin/faculty"
  | "/admin/faculty-accounts"
  | "/admin/audit"
  | "/admin/settings"
  | "/admin/import"
  | "/admin/year-end";

const ROLE_ADMIN_PATHS: Record<StaffRoleKey, readonly AdminPortalPath[]> = {
  PRINCIPAL: [
    "/admin/dashboard",
    "/admin/account",
    "/admin/import",
    "/admin/year-end",
    "/admin/faculty-accounts",
    "/admin/audit",
    "/admin/settings",
    "/admin/academic-years",
    "/admin/academic-structure",
    "/admin/students",
    "/admin/guardians",
    "/admin/admissions",
    "/admin/attendance",
    "/admin/fees",
    "/admin/calendar",
    "/admin/gallery",
    "/admin/contact",
    "/admin/faculty",
    "/admin/class-materials",
  ],
  VICE_PRINCIPAL: [
    "/admin/dashboard",
    "/admin/account",
    "/admin/import",
    "/admin/year-end",
    "/admin/faculty-accounts",
    "/admin/attendance",
    "/admin/academic-years",
    "/admin/academic-structure",
    "/admin/students",
    "/admin/guardians",
    "/admin/admissions",
    "/admin/fees",
    "/admin/calendar",
    "/admin/gallery",
    "/admin/contact",
    "/admin/faculty",
    "/admin/class-materials",
  ],
  ACADEMIC_INCHARGE: [
    "/admin/account",
    "/admin/academic-years",
    "/admin/academic-structure",
    "/admin/students",
    "/admin/guardians",
    "/admin/admissions",
    "/admin/class-materials",
    "/admin/calendar",
    "/admin/year-end",
  ],
  ATTENDANCE_INCHARGE: ["/admin/account", "/admin/attendance", "/admin/students", "/admin/calendar"],
  FEES_INCHARGE: ["/admin/account", "/admin/fees", "/admin/students"],
  OPERATIONS_INCHARGE: [
    "/admin/account",
    "/admin/calendar",
    "/admin/gallery",
    "/admin/contact",
    "/admin/faculty",
    "/admin/class-materials",
  ],
  TEACHER: [],
  STAFF: [],
};

const ROLE_HOME_PATH: Record<StaffRoleKey, string> = {
  PRINCIPAL: "/admin/dashboard",
  VICE_PRINCIPAL: "/admin/dashboard",
  ACADEMIC_INCHARGE: "/admin/academic-structure",
  ATTENDANCE_INCHARGE: "/admin/attendance",
  FEES_INCHARGE: "/admin/fees",
  OPERATIONS_INCHARGE: "/admin/calendar",
  TEACHER: "/faculty/portal/home",
  STAFF: "/faculty/portal/home",
};

export function getAdminPathsForRole(
  staffRoleKey: StaffRoleKey | null | undefined,
): readonly AdminPortalPath[] {
  if (!staffRoleKey) return ROLE_ADMIN_PATHS.PRINCIPAL;
  return ROLE_ADMIN_PATHS[staffRoleKey] ?? [];
}

export function getAdminNavItemsForRole(staffRoleKey: StaffRoleKey | null | undefined) {
  const key = staffRoleKey ?? "PRINCIPAL";
  if (key === "TEACHER" || key === "STAFF") return [];
  const items = ROLE_PORTAL_NAV[key as keyof typeof ROLE_PORTAL_NAV];
  return items ? [...items] : [];
}

export function canAccessAdminPath(
  staffRoleKey: StaffRoleKey | null | undefined,
  pathname: string,
): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return true;
  if (pathname === "/admin/account") return true;
  const allowed = getAdminPathsForRole(staffRoleKey);
  return allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getAdminHomePath(staffRoleKey: StaffRoleKey | null | undefined): string {
  if (!staffRoleKey) return "/admin/dashboard";
  return ROLE_HOME_PATH[staffRoleKey] ?? "/admin/dashboard";
}

export function getAdminShellTitle(staffRoleKey: StaffRoleKey | null | undefined): string {
  if (!staffRoleKey) return "Admin";
  if (staffRoleKey === "PRINCIPAL") return "Principal";
  if (staffRoleKey === "VICE_PRINCIPAL") return "Vice Principal";
  return STAFF_ROLE_LABELS[staffRoleKey];
}

export function seesPrincipalDashboard(staffRoleKey: StaffRoleKey | null | undefined): boolean {
  return staffRoleKey === "PRINCIPAL" || staffRoleKey === "VICE_PRINCIPAL" || !staffRoleKey;
}
