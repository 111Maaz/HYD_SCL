import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { AttendanceStatusToggle } from "@/components/attendance/AttendanceStatusToggle";
import { PortalPage, PortalPanel, PortalStatPill } from "@/components/portal/PortalPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  attendanceRowToneClass,
  normalizeAttendanceMarkStatus,
  type AttendanceMarkStatus,
} from "@/lib/attendance-ui";
import { schoolTodayIso } from "@/lib/school-date";
import {
  attendanceRowDisplayName,
  fetchAttendanceRows,
  saveAttendanceBatch,
  type AttendanceSaveRow,
} from "@/services/attendance";
import { fetchCalendarEventForDate, isHolidayEventType } from "@/services/calendar-events";
import type { AttendanceStatus } from "@/types/attendance";

type DraftRow = {
  status: AttendanceMarkStatus | "";
  remarks: string;
};

export function FacultyAttendanceView({
  sectionId,
  yearId,
}: {
  sectionId: string;
  yearId: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [attendanceDate, setAttendanceDate] = useState(schoolTodayIso);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});

  const { data: dayEvent } = useQuery({
    queryKey: ["faculty", "calendar-day", yearId, attendanceDate],
    queryFn: () => fetchCalendarEventForDate(yearId, attendanceDate),
    enabled: Boolean(yearId && attendanceDate),
    retry: false,
  });

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["faculty", "attendance-rows", yearId, sectionId, attendanceDate],
    queryFn: () => fetchAttendanceRows(yearId, sectionId, attendanceDate),
    enabled: Boolean(yearId && sectionId && attendanceDate),
    retry: false,
  });

  useEffect(() => {
    const next: Record<string, DraftRow> = {};
    for (const row of rows) {
      next[row.enrollment_id] = {
        status: normalizeAttendanceMarkStatus(row.status as AttendanceStatus | null),
        remarks: row.remarks ?? "",
      };
    }
    setDrafts(next);
  }, [rows]);

  const markAll = useCallback(
    (status: AttendanceMarkStatus) => {
      setDrafts((prev) => {
        const next: Record<string, DraftRow> = { ...prev };
        for (const row of rows) {
          next[row.enrollment_id] = {
            status,
            remarks: prev[row.enrollment_id]?.remarks ?? "",
          };
        }
        return next;
      });
    },
    [rows],
  );

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let unmarked = 0;
    for (const row of rows) {
      const status = drafts[row.enrollment_id]?.status ?? "";
      if (status === "PRESENT") present += 1;
      else if (status === "ABSENT") absent += 1;
      else unmarked += 1;
    }
    return { present, absent, unmarked };
  }, [drafts, rows]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: AttendanceSaveRow[] = Object.entries(drafts)
        .filter(([, d]) => d.status)
        .map(([enrollmentId, d]) => ({
          enrollment_id: enrollmentId,
          status: d.status as AttendanceStatus,
          remarks: d.remarks.trim() || null,
        }));
      await saveAttendanceBatch(yearId, attendanceDate, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["faculty", "attendance-rows", yearId, sectionId, attendanceDate],
      });
      void queryClient.invalidateQueries({ queryKey: ["teacher", "attendance-completion"] });
      toast.success("Attendance saved.");
      void navigate({ to: "/faculty/portal/home" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const holidayBlocked = Boolean(dayEvent && isHolidayEventType(dayEvent.event_type));

  const updateDraft = (enrollmentId: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [enrollmentId]: { ...(prev[enrollmentId] ?? { status: "", remarks: "" }), ...patch },
    }));
  };

  return (
    <PortalPage>
      <AdminPageHeader
        title="Take attendance"
        description="Tap P or A for each student. Add a short note for late or leave."
      />

      <PortalPanel contentClassName="space-y-3 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full min-w-0 space-y-1 sm:w-auto sm:min-w-[160px]">
            <Label htmlFor="att-date" className="text-xs">
              Date
            </Label>
            <Input
              id="att-date"
              type="date"
              className="h-8 w-full bg-background/80 text-sm"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>

          <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
            <Label className="text-xs">Mark all</Label>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 border-emerald-500/20 bg-emerald-500/10 px-2.5 text-xs text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-200"
                disabled={rows.length === 0 || holidayBlocked}
                onClick={() => markAll("PRESENT")}
              >
                All P
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-rose-500/25 px-2.5 text-xs text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                disabled={rows.length === 0 || holidayBlocked}
                onClick={() => markAll("ABSENT")}
              >
                All A
              </Button>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              <PortalStatPill tone="present" label={`${stats.present} P`} />
              <PortalStatPill tone="absent" label={`${stats.absent} A`} />
              {stats.unmarked > 0 ? (
                <PortalStatPill tone="neutral" label={`${stats.unmarked} —`} />
              ) : null}
            </div>
          ) : null}

          <Button
            size="sm"
            className="h-8 w-full sm:ml-auto sm:w-auto"
            disabled={saveMutation.isPending || holidayBlocked || rows.length === 0}
            onClick={() => saveMutation.mutate()}
          >
            <Save className="size-3.5" />
            Save
          </Button>
        </div>
      </PortalPanel>

      {holidayBlocked ? (
        <div className="mt-3">
          <AdminErrorState message="This date is a holiday / non-attendance day on the calendar." />
        </div>
      ) : isLoading ? (
        <AdminLoadingState label="Loading students…" />
      ) : isError ? (
        <AdminErrorState
          message={error instanceof Error ? error.message : "Failed to load attendance."}
        />
      ) : (
        <PortalPanel
          className="mt-3"
          title={rows.length > 0 ? `Students (${rows.length})` : undefined}
          contentClassName="p-0 sm:p-0"
        >
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No enrolled students in this section.
            </p>
          ) : (
            <div className="max-h-[min(70vh,720px)] overflow-y-auto overscroll-contain">
              <div className="sticky top-0 z-10 grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-2 border-b border-border/70 bg-card/95 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur sm:grid-cols-[2rem_minmax(0,1fr)_4.5rem_minmax(120px,1fr)] sm:px-3 sm:text-xs">
                <span>#</span>
                <span>Student</span>
                <span className="text-center">P / A</span>
                <span>Note</span>
              </div>
              <ul>
                {rows.map((row, index) => {
                  const draft = drafts[row.enrollment_id] ?? { status: "", remarks: "" };
                  return (
                    <li
                      key={row.enrollment_id}
                      className={`portal-attendance-row grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-2 border-b border-border/40 border-l-2 px-2 py-1 transition-colors duration-100 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)_4.5rem_minmax(120px,1fr)] sm:px-3 sm:py-1 ${attendanceRowToneClass(draft.status)}`}
                    >
                      <span className="text-[11px] tabular-nums text-muted-foreground sm:text-xs">
                        {index + 1}
                      </span>
                      <p className="min-w-0 truncate text-xs font-medium leading-tight sm:text-sm">
                        {attendanceRowDisplayName(row)}
                      </p>
                      <AttendanceStatusToggle
                        value={draft.status}
                        onChange={(status) => updateDraft(row.enrollment_id, { status })}
                        disabled={holidayBlocked}
                        dense
                      />
                      <Input
                        value={draft.remarks}
                        onChange={(e) =>
                          updateDraft(row.enrollment_id, { remarks: e.target.value })
                        }
                        placeholder="late, leave…"
                        className="h-7 min-w-0 border-border/60 bg-background/70 px-2 text-xs"
                        aria-label={`Note for ${attendanceRowDisplayName(row)}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </PortalPanel>
      )}
    </PortalPage>
  );
}
