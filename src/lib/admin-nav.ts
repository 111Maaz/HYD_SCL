import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Image,
  IndianRupee,
  LayoutDashboard,
  Layers,
  Mail,
  School,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/academic-years", label: "Academic Years", icon: CalendarRange },
  { to: "/admin/academic-structure", label: "Academic Structure", icon: Layers },
  { to: "/admin/students", label: "Students", icon: School },
  { to: "/admin/guardians", label: "Guardians", icon: HeartHandshake },
  { to: "/admin/admissions", label: "Admissions", icon: Users },
  { to: "/admin/contact", label: "Contact", icon: Mail },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/admin/fees", label: "Fees", icon: IndianRupee },
  { to: "/admin/audit", label: "Audit", icon: ScrollText },
  { to: "/admin/faculty", label: "Faculty", icon: GraduationCap },
  { to: "/admin/faculty-accounts", label: "Staff Accounts", icon: UserCog },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/class-materials", label: "Class Materials", icon: BookOpen },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number];
