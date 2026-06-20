import { LayoutDashboard, Users, GraduationCap, UserCog, Image, BookOpen, Settings } from "lucide-react";
const ADMIN_NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/admissions", label: "Admissions", icon: Users },
  { to: "/admin/faculty", label: "Faculty", icon: GraduationCap },
  { to: "/admin/faculty-accounts", label: "Faculty Accounts", icon: UserCog },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/class-materials", label: "Class Materials", icon: BookOpen },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];
export {
  ADMIN_NAV_ITEMS as A
};
