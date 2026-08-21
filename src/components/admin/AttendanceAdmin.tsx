import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/services/academic-years";
import {
  attendanceRowDisplayName,
  fetchAttendanceRows,
  saveAttendanceBatch,
  type AttendanceSaveRow,
} from "@/services/attendance";
import { fetchCalendarEventForDate, isHolidayEventType } from "@/services/calendar-events";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  CALENDAR_EVENT_TYPE_LABELS,
  type AttendanceStatus,
} from "@/types/attendance";

type DraftRow = {
  status: AttendanceStatus | "";
  remarks: string;
};

export function AttendanceAdmin() {
  const queryClient = useQueryClient();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassYearId, setSelectedClassYearId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});

  const {
    data: years = [],
    isLoading: yearsLoading,
    isError: yearsError,
    error: yearsLoadError,
  } = useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: fetchAcademicYears,
  });

  const { data: activeYear } = useQuery({
    queryKey: ["admin", "active-academic-year"],
    queryFn: fetchActiveAcademicYear,
  });

  useEffect(() => {
    if (selectedYearId) return;
    if (activeYear?.id) setSelectedYearId(activeYear.id);
    else if (years[0]?.id) setSelectedYearId(years[0].id);
  }, [activeYear?.id, selectedYearId, years]);

  const {
    data: classYears = [],
    isError: classYearsError,
    error: classYearsLoadError,
  } = useQuery({
    queryKey: ["admin", "class-years", selectedYearId],
    queryFn: () => fetchClassYearsWithDetails(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const sections = useMemo(() => {
    if (!selectedClassYearId) return [];
    return classYears.find((row) => row.id === selectedClassYearId)?.sections.filter((s) => s.active) ?? [];
  }, [classYears, selectedClassYearId]);

  const { data: dayEvent } = useQuery({
    queryKey: ["admin", "calendar-day", selectedYearId, attendanceDate],
    queryFn: () => fetchCalendarEventForDate(selectedYearId, attendanceDate),
    enabled: Boolean(selectedYearId && attendanceDate),
    retry: false,
  });

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "attendance-rows", selectedYearId, selectedSectionId, attendanceDate],
    queryFn: () => fetchAttendanceRows(selectedYearId, selectedSectionId, attendanceDate),
    enabled: Boolean(selectedYearId && selectedSectionId && attendanceDate),
    retry: false,
  });

  useEffect(() => {
    const next: Record<string, DraftRow> = {};
    for (const row of rows) {
      next[row.enrollment_id] = {
        status: row.status ?? "PRESENT",
        remarks: row.remarks ?? "",
      };
    }
    setDrafts(next);
  }, [rows]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: AttendanceSaveRow[] = Object.entries(drafts)
        .filter(([, draft]) => draft.status)
        .map(([enrollmentId, draft]) => ({
          enrollment_id: enrollmentId,
          status: draft.status as AttendanceStatus,
          remarks: draft.remarks || null,
        }));

      await saveAttendanceBatch(selectedYearId, attendanceDate, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "attendance-rows"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      toast.success("Attendance saved.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isHoliday = dayEvent ? isHolidayEventType(dayEvent.event_type) : false;

  const hasYears = years.length > 0;
  const hasClassYears = classYears.length > 0;
  const hasAnySections = classYears.some((cy) => cy.sections.some((s) => s.active));

  if (yearsLoading) return <AdminLoadingState label="Loading attendance…" />;
  if (yearsError) {
    return (
      <AdminErrorState
        message={
          yearsLoadError instanceof Error
            ? yearsLoadError.message
            : "Failed to load academic years. Run ERP migrations and ensure your admin has PRINCIPAL role."
        }
      />
    );
  }

  if (classYearsError) {
    return (
      <AdminErrorState
        message={
          classYearsLoadError instanceof Error
            ? classYearsLoadError.message
            : "Failed to load class structure."
        }
      />
    );
  }

  if (!hasYears || !hasClassYears || !hasAnySections) {
    return (
      <>
        <AdminPageHeader
          title="Attendance"
          description="Mark daily attendance by section once academic structure and enrollments exist."
        />
        <div className="rounded-xl border border-dashed bg-card px-6 py-10">
          <ClipboardCheck className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-center font-medium">Attendance prerequisites</p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Complete these steps first — the roster stays empty until students are enrolled in a
            section.
          </p>
          <ol className="mx-auto mt-6 max-w-lg list-decimal space-y-2 pl-5 text-sm">
            <li className={hasYears ? "text-muted-foreground line-through" : ""}>
              Create / activate an academic year (Academic Years)
            </li>
            <li className={hasClassYears ? "text-muted-foreground line-through" : ""}>
              Initialize classes for that year (Academic Structure)
            </li>
            <li className={hasAnySections ? "text-muted-foreground line-through" : ""}>
              Create sections for each class (Academic Structure)
            </li>
            <li>Add students (Students)</li>
            <li>Enroll students into class + section (Students → Enrollments)</li>
            <li>Optional: create Teacher / Attendance Incharge accounts (Staff Accounts)</li>
          </ol>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Attendance"
        description="Mark daily attendance by section. Changes to existing records are tracked as corrections."
        action={
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending || !selectedSectionId || rows.length === 0 || isHoliday
            }
          >
            <Save className="size-4" />
            Save attendance
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2">
          <Label>Academic year</Label>
          <Select
            value={selectedYearId || undefined}
            onValueChange={setSelectedYearId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Class</Label>
          <Select
            value={selectedClassYearId || "unset"}
            onValueChange={(value) => {
              setSelectedClassYearId(value === "unset" ? "" : value);
              setSelectedSectionId("");
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classYears.map((classYear) => (
                <SelectItem key={classYear.id} value={classYear.id}>
                  {classYear.class.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Section</Label>
          <Select
            value={selectedSectionId || "unset"}
            onValueChange={(value) => setSelectedSectionId(value === "unset" ? "" : value)}
            disabled={!selectedClassYearId}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.section_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            className="w-[180px]"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />
        </div>
      </div>

      {dayEvent && (
        <p className="mb-4 text-sm text-muted-foreground">
          Calendar: {dayEvent.title} ({CALENDAR_EVENT_TYPE_LABELS[dayEvent.event_type]})
          {isHoliday ? " — attendance is blocked on this day." : ""}
        </p>
      )}

      {!selectedSectionId ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <ClipboardCheck className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">Select a section</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose class and section to mark attendance.
          </p>
        </div>
      ) : isLoading ? (
        <AdminLoadingState label="Loading students…" />
      ) : isError ? (
        <AdminErrorState
          message={error instanceof Error ? error.message : "Failed to load attendance."}
        />
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No active enrollments in this section.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Roll</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const draft = drafts[row.enrollment_id] ?? { status: "PRESENT", remarks: "" };
                return (
                  <TableRow key={row.enrollment_id}>
                    <TableCell className="font-mono">{row.roll_number ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{attendanceRowDisplayName(row)}</div>
                      <div className="text-xs text-muted-foreground">{row.student_number}</div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft.status || "PRESENT"}
                        onValueChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [row.enrollment_id]: {
                              ...draft,
                              status: value as AttendanceStatus,
                            },
                          }))
                        }
                        disabled={isHoliday}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTENDANCE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {ATTENDANCE_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.remarks}
                        onChange={(e) =>
                          setDrafts((current) => ({
                            ...current,
                            [row.enrollment_id]: { ...draft, remarks: e.target.value },
                          }))
                        }
                        disabled={isHoliday}
                        placeholder="Optional"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
