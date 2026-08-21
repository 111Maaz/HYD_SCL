import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAcademicYears,
  fetchActiveAcademicYear,
} from "@/services/academic-years";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  isHolidayEventType,
  updateCalendarEvent,
} from "@/services/calendar-events";
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_TYPE_LABELS,
  type CalendarEvent,
  type CalendarEventInput,
  type CalendarEventType,
} from "@/types/attendance";

const emptyForm = (yearId: string): CalendarEventInput => ({
  academic_year_id: yearId,
  event_date: new Date().toISOString().slice(0, 10),
  event_type: "HOLIDAY",
  title: "",
  description: "",
  applies_to_all: true,
  is_attendance_day: false,
});

export function CalendarAdmin() {
  const queryClient = useQueryClient();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<CalendarEventInput>(emptyForm(""));
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

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
    data: events = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "calendar-events", selectedYearId],
    queryFn: () => fetchCalendarEvents(selectedYearId),
    enabled: Boolean(selectedYearId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return updateCalendarEvent(editing.id, form);
      return createCalendarEvent(form);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "calendar-events"] });
      toast.success(editing ? "Event updated." : "Event created.");
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "calendar-events"] });
      toast.success("Event deleted.");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(selectedYearId));
    setDialogOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setForm({
      academic_year_id: event.academic_year_id,
      event_date: event.event_date,
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      applies_to_all: event.applies_to_all,
      class_id: event.class_id,
      section_id: event.section_id,
      is_attendance_day: event.is_attendance_day,
    });
    setDialogOpen(true);
  };

  if (yearsLoading) return <AdminLoadingState label="Loading calendar…" />;

  return (
    <>
      <AdminPageHeader
        title="School calendar"
        description="Define holidays, exams, and special days for the academic year."
        action={
          <Button onClick={openCreate} disabled={!selectedYearId}>
            <Plus className="size-4" />
            Add event
          </Button>
        }
      />

      <div className="mb-4 space-y-2">
        <Label>Academic year</Label>
        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.name}
                {year.status === "ACTIVE" ? " (Active)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <AdminLoadingState label="Loading events…" />
      ) : isError ? (
        <AdminErrorState
          message={error instanceof Error ? error.message : "Failed to load calendar."}
        />
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <CalendarDays className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">No calendar events</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add holidays and special days for this academic year.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{format(new Date(`${event.event_date}T12:00:00`), "d MMM yyyy")}</TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <Badge variant={isHolidayEventType(event.event_type) ? "secondary" : "outline"}>
                      {CALENDAR_EVENT_TYPE_LABELS[event.event_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.applies_to_all ? "Whole school" : "Scoped"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(event)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "Add calendar event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((c) => ({ ...c, event_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.event_type}
                onValueChange={(value) =>
                  setForm((c) => ({ ...c, event_type: value as CalendarEventType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CALENDAR_EVENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="applies_to_all"
                checked={form.applies_to_all ?? true}
                onCheckedChange={(checked) =>
                  setForm((c) => ({ ...c, applies_to_all: checked === true }))
                }
              />
              <Label htmlFor="applies_to_all">Applies to whole school</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_attendance_day"
                checked={form.is_attendance_day ?? false}
                onCheckedChange={(checked) =>
                  setForm((c) => ({ ...c, is_attendance_day: checked === true }))
                }
              />
              <Label htmlFor="is_attendance_day">Attendance must be marked</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title.trim()}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `Remove "${deleteTarget.title}" from the calendar?` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
