import { BookOpen, Home, User } from "lucide-react";

export const FACULTY_NAV_ITEMS = [
  { to: "/faculty/portal/home", label: "Home", icon: Home },
  { to: "/faculty/portal/account", label: "Account centre", icon: User },
  { to: "/faculty/portal/materials", label: "Material upload", icon: BookOpen },
] as const;

export type FacultyNavItem = (typeof FACULTY_NAV_ITEMS)[number];
