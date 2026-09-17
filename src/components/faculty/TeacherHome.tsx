import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, UserCheck, UserPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import {
  PortalEmptyState,
  PortalPage,
  PortalPanel,
  PortalSectionTitle,
} from "@/components/portal/PortalPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { schoolTodayIso } from "@/lib/school-date";
import { fetchCompletedAttendanceSectionIds } from "@/services/attendance";
import {
  allotmentClassLabel,
  createSecondaryAllotment,
  endSecondaryAllotment,
  fetchMyAttendanceAllotments,
  fetchMySecondaryAllotments,
  fetchOwnStaffProfile,
  fetchSecondaryCoverForMe,
  listActiveTeachersAndStaff,
  staffLabel,
} from "@/services/allotments";
import { getStaffDisplayName } from "@/types/database";

export function TeacherHome() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [today, setToday] = useState(schoolTodayIso);
  const [secondaryId, setSecondaryId] = useState("");
  const [startsOn, setStartsOn] = useState(schoolTodayIso);
  const [endsOn, setEndsOn] = useState(schoolTodayIso);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const updateDay = () => setToday(schoolTodayIso());
    const timer = window.setInterval(updateDay, 15_000);
    document.addEventListener("visibilitychange", updateDay);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateDay);
    };
  }, []);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErr,
  } = useQuery({
    queryKey: ["account-centre", auth?.userId],
    queryFn: () => fetchOwnStaffProfile(auth!.userId),
    enabled: !!auth?.userId,
  });

  const staffId = profile?.id;

  const { data: coverForMe = [] } = useQuery({
    queryKey: ["teacher", "secondary-cover", staffId, today],
    queryFn: () => fetchSecondaryCoverForMe(staffId!),
    enabled: !!staffId,
  });

  const { data: mySecondaries = [] } = useQuery({
    queryKey: ["teacher", "my-secondaries", staffId, today],
    queryFn: () => fetchMySecondaryAllotments(staffId!),
    enabled: !!staffId,
  });

  const {
    data: attendanceClasses = [],
    isLoading: classesLoading,
  } = useQuery({
    queryKey: ["teacher", "attendance-classes", staffId, today],
    queryFn: () => fetchMyAttendanceAllotments(staffId!),
    enabled: !!staffId,
  });

  const { data: completedSections = [], isFetching: completionChecking, isError: completionError } = useQuery({
    queryKey: ["teacher", "attendance-completion", staffId, today, attendanceClasses.map((row) => row.section_id).join(",")],
    queryFn: () => fetchCompletedAttendanceSectionIds(attendanceClasses.map((row) => row.section_id), today),
    enabled: !!staffId && attendanceClasses.length > 0,
  });
  const completedSectionIds = new Set(completedSections);

  const { data: peers = [] } = useQuery({
    queryKey: ["teacher", "peers"],
    queryFn: listActiveTeachersAndStaff,
  });

  const peerOptions = useMemo(
    () => peers.filter((p) => p.id !== staffId),
    [peers, staffId],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createSecondaryAllotment({
        primaryStaffId: staffId!,
        secondaryStaffId: secondaryId,
        startsOn,
        endsOn,
        notes,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher", "my-secondaries"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher", "secondary-cover"] });
      toast.success("Secondary teacher allotted for the selected period.");
      setDialogOpen(false);
      setSecondaryId("");
      setNotes("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => endSecondaryAllotment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher", "my-secondaries"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher", "secondary-cover"] });
      toast.success("Secondary allotment ended.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (profileLoading) return <AdminLoadingState label="Loading your home…" />;
  if (profileError) {
    return (
      <AdminErrorState
        message={profileErr instanceof Error ? profileErr.message : "Failed to load profile."}
      />
    );
  }

  const activeSecondaries = mySecondaries.filter(
    (row) => row.active && row.starts_on <= today && row.ends_on >= today,
  );
  const activeCoverForMe = coverForMe.filter(
    (row) => row.active && row.starts_on <= today && row.ends_on >= today,
  );

  return (
    <PortalPage>
      <AdminPageHeader
        title="Teacher home"
        description="Cover assignments, attendance classes, and your substitute setup."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="size-4" />
            Set secondary teacher
          </Button>
        }
      />

      <section className="mb-6">
        <PortalSectionTitle>Colleagues who selected you as secondary</PortalSectionTitle>
        {activeCoverForMe.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No colleague has currently chosen you as their secondary teacher.
          </p>
        ) : (
          <PortalPanel contentClassName="p-0 sm:p-0">
            <ul className="divide-y divide-border/60">
              {activeCoverForMe.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-l-primary/60 bg-primary/[0.04] px-3 py-2.5 sm:px-4"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <UserCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {staffLabel(row.primary)} chose you as secondary
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.starts_on} → {row.ends_on}
                        {row.notes ? ` · ${row.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can mark attendance for their classes in this period.
                  </p>
                </li>
              ))}
            </ul>
          </PortalPanel>
        )}
      </section>

      <section className="mb-6">
        <PortalSectionTitle>Your secondary teachers (you assigned)</PortalSectionTitle>
        {activeSecondaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have not set a secondary teacher for an active period.
          </p>
        ) : (
          <PortalPanel contentClassName="p-0 sm:p-0">
            <ul className="divide-y divide-border/60">
              {activeSecondaries.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{staffLabel(row.secondary)}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.starts_on} → {row.ends_on}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    disabled={endMutation.isPending}
                    onClick={() => endMutation.mutate(row.id)}
                  >
                    End early
                  </Button>
                </li>
              ))}
            </ul>
          </PortalPanel>
        )}
      </section>

      <section className="mb-2">
        <PortalSectionTitle>Attendance classes allotted to you</PortalSectionTitle>
        {completionError ? (
          <p role="alert" className="mb-3 text-sm text-destructive">
            Unable to check today's attendance status. Refresh the page to try again.
          </p>
        ) : null}
        {classesLoading ? (
          <AdminLoadingState label="Loading classes…" />
        ) : attendanceClasses.length === 0 ? (
          <PortalEmptyState
            icon={<ClipboardCheck className="mx-auto size-10" />}
            title="No attendance classes yet"
            description="When an Attendance Incharge allots you a section, it will appear here."
          />
        ) : (
          <PortalPanel contentClassName="p-0 sm:p-0">
            <ul className="divide-y divide-border/60">
              {attendanceClasses.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <ClipboardCheck className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{allotmentClassLabel(row)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.teacher_staff_id === staffId
                          ? "Primary attendance teacher"
                          : `Covering for ${staffLabel(row.teacher)}`}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-8 shrink-0">
                    <Link
                      to="/faculty/portal/attendance"
                      search={{ sectionId: row.section_id, yearId: row.academic_year_id }}
                      aria-disabled={completionChecking || completionError}
                      tabIndex={completionChecking || completionError ? -1 : undefined}
                      className={completionChecking || completionError ? "pointer-events-none opacity-50" : undefined}
                    >
                      {completionChecking
                        ? "Checking…"
                        : completionError
                          ? "Status unavailable"
                          : completedSectionIds.has(row.section_id)
                            ? "Edit attendance"
                            : "Take attendance"}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </PortalPanel>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allot secondary teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You remain the primary. The secondary can take attendance for your allotted classes
              during the selected days.
            </p>
            <div className="space-y-2">
              <Label>Secondary (from staff)</Label>
              <Select value={secondaryId} onValueChange={setSecondaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {peerOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {getStaffDisplayName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>From</Label>
                <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!secondaryId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save allotment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  );
}
