import type { AttendanceStatus } from "@/types/attendance";

/** Binary status used in the marking UI (late/leave go in remarks). */
export type AttendanceMarkStatus = "PRESENT" | "ABSENT";

export function normalizeAttendanceMarkStatus(
  status: AttendanceStatus | null | "",
): AttendanceMarkStatus | "" {
  if (!status) return "";
  if (status === "ABSENT" || status === "LEAVE") return "ABSENT";
  return "PRESENT";
}

export function attendanceRowToneClass(status: AttendanceMarkStatus | ""): string {
  if (status === "PRESENT") {
    return "border-l-emerald-500/70 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.09]";
  }
  if (status === "ABSENT") {
    return "border-l-rose-500/70 bg-rose-500/[0.06] hover:bg-rose-500/[0.09]";
  }
  return "border-l-transparent hover:bg-muted/40";
}
