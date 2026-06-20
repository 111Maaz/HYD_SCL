import { BookOpen, User } from "lucide-react";

export const FACULTY_NAV_ITEMS = [
  { to: "/faculty/portal/profile", label: "My Profile", icon: User },
  { to: "/faculty/portal/materials", label: "My Class Materials", icon: BookOpen },
] as const;
