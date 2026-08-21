import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PortalPage, PortalPanel } from "@/components/portal/PortalPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  allotmentClassLabel,
  clearAttendanceAllotment,
  fetchAttendanceAllotmentsForYear,
  fetchOwnStaffProfile,
  listActiveTeachersAndStaff,
  staffLabel,
  upsertAttendanceAllotment,
} from "@/services/allotments";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/services/academic-years";
import { getStaffDisplayName } from "@/types/database";

export function AttendanceAllotmentAdmin() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassYearId, setSelectedClassYearId] = useState("");
  const [teacherBySection, setTeacherBySection] = useState<Record<string, string>>({});

  const { data: ownProfile } = useQuery({
    queryKey: ["account-centre", auth?.userId],
    queryFn: () => fetchOwnStaffProfile(auth!.userId),
    enabled: !!auth?.userId,
  });

  const { data: years = [], isLoading: yearsLoading } = useQuery({
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
    isLoading: structureLoading,
    isError: structureError,
    error: structureErr,
  } = useQuery({
    queryKey: ["admin", "class-years", selectedYearId],
    queryFn: () => fetchClassYearsWithDetails(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const {
    data: allotments = [],
    isLoading: allotmentsLoading,
  } = useQuery({
    queryKey: ["admin", "attendance-allotments", selectedYearId],
    queryFn: () => fetchAttendanceAllotmentsForYear(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["admin", "teachers-for-allotment"],
    queryFn: listActiveTeachersAndStaff,
  });

  const allotmentBySection = useMemo(() => {
    const map = new Map(allotments.map((row) => [row.section_id, row]));
    return map;
  }, [allotments]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of allotments) {
      next[row.section_id] = row.teacher_staff_id;
    }
    setTeacherBySection((prev) => ({ ...next, ...prev }));
  }, [allotments]);

  const sections = useMemo(() => {
    if (!selectedClassYearId) return [];
    return (
      classYears.find((row) => row.id === selectedClassYearId)?.sections.filter((s) => s.active) ??
      []
    );
  }, [classYears, selectedClassYearId]);

  const saveMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const teacherStaffId = teacherBySection[sectionId];
      if (!teacherStaffId) throw new Error("Select a teacher first.");
      await upsertAttendanceAllotment({
        academicYearId: selectedYearId,
        sectionId,
        teacherStaffId,
        allottedByStaffId: ownProfile?.id ?? null,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "attendance-allotments", selectedYearId],
      });
      toast.success("Attendance class teacher allotted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const clearMutation = useMutation({
    mutationFn: (sectionId: string) => clearAttendanceAllotment(sectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "attendance-allotments", selectedYearId],
      });
      toast.success("Allotment cleared.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (yearsLoading) return <AdminLoadingState label="Loading academic years…" />;

  return (
    <PortalPage>
      <AdminPageHeader
        title="Attendance allotment"
        description="Open a class, pick a section, and allot a teacher as the attendance class teacher for that section."
      />

      <PortalPanel contentClassName="mb-6">
        <div className="space-y-2">
          <Label>Academic year</Label>
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-full sm:w-[220px]">
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
      </PortalPanel>

      {structureError ? (
        <AdminErrorState
          message={
            structureErr instanceof Error
              ? structureErr.message
              : "Failed to load class structure."
          }
        />
      ) : structureLoading || allotmentsLoading ? (
        <AdminLoadingState label="Loading classes…" />
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <PortalPanel
            title="Classes"
            description="Select a class to see its sections."
            contentClassName="space-y-2"
          >
            {classYears.filter((cy) => cy.active).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active classes for this year.</p>
            ) : (
              classYears
                .filter((cy) => cy.active)
                .map((cy) => (
                  <Button
                    key={cy.id}
                    variant={selectedClassYearId === cy.id ? "default" : "outline"}
                    className="h-auto w-full justify-start py-2.5"
                    onClick={() => setSelectedClassYearId(cy.id)}
                  >
                    <span className="truncate">{cy.class.class_name}</span>
                    <Badge variant="secondary" className="ml-auto shrink-0">
                      {cy.sections.filter((s) => s.active).length} sec
                    </Badge>
                  </Button>
                ))
            )}
          </PortalPanel>

          <PortalPanel
            title={
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="size-4" />
                Sections
              </span>
            }
            description={
              selectedClassYearId
                ? "Allot one attendance teacher per section."
                : "Choose a class on the left."
            }
            contentClassName="space-y-4"
          >
            {!selectedClassYearId ? (
              <p className="text-sm text-muted-foreground">No class selected.</p>
            ) : sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sections in this class.</p>
            ) : (
              sections.map((section) => {
                const current = allotmentBySection.get(section.id);
                return (
                  <div
                    key={section.id}
                    className="flex min-w-0 flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-end"
                  >
                    <div className="min-w-0 sm:min-w-[120px]">
                      <p className="font-medium">Section {section.section_name}</p>
                      {current ? (
                        <p className="text-xs text-muted-foreground">
                          Current: {staffLabel(current.teacher)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not allotted</p>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label>Attendance teacher</Label>
                      <Select
                        value={teacherBySection[section.id] ?? ""}
                        onValueChange={(value) =>
                          setTeacherBySection((prev) => ({ ...prev, [section.id]: value }))
                        }
                      >
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {getStaffDisplayName(t)}
                              {t.assigned_class != null ? ` (Class ${t.assigned_class})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <Button
                        className="flex-1 sm:flex-none"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate(section.id)}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Allot
                      </Button>
                      {current ? (
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          disabled={clearMutation.isPending}
                          onClick={() => clearMutation.mutate(section.id)}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </PortalPanel>
        </div>
      )}

      {allotments.length > 0 ? (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Active allotments this year
          </h3>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allotments.map((row) => (
              <PortalPanel
                key={row.id}
                title={allotmentClassLabel(row)}
                description={staffLabel(row.teacher)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </PortalPage>
  );
}
