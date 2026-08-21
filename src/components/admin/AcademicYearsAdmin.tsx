import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarRange, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bootstrapClassYearsForAcademicYear,
  createAcademicYear,
  deleteAcademicYear,
  fetchAcademicYears,
  fetchClassYearsForAcademicYear,
  setAcademicYearStatus,
  updateAcademicYear,
} from "@/services/academic-years";
import {
  ACADEMIC_YEAR_STATUSES,
  ACADEMIC_YEAR_STATUS_LABELS,
  type AcademicYear,
  type AcademicYearInput,
  type AcademicYearStatus,
} from "@/types/academic";

type FormState = AcademicYearInput & { bootstrapClasses: boolean };

const emptyForm = (): FormState => ({
  name: "",
  start_date: "",
  end_date: "",
  status: "PLANNING",
  bootstrapClasses: true,
});

function formatDate(value: string) {
  try {
    return format(new Date(value + "T12:00:00"), "d MMM yyyy");
  } catch {
    return value;
  }
}

export function AcademicYearsAdmin() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);

  const {
    data: years = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: fetchAcademicYears,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "academic-years"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "class-years"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { bootstrapClasses, ...input } = form;
      if (editing) {
        return updateAcademicYear(editing.id, input);
      }
      return createAcademicYear(input, { bootstrapClasses });
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Academic year updated." : "Academic year created.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AcademicYearStatus }) =>
      setAcademicYearStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Academic year status updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bootstrapMutation = useMutation({
    mutationFn: (academicYearId: string) => bootstrapClassYearsForAcademicYear(academicYearId),
    onSuccess: (rows) => {
      invalidate();
      toast.success(
        rows.length
          ? `Class structure ready (${rows.length} class-year rows).`
          : "Class structure initialized.",
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAcademicYear(id),
    onSuccess: () => {
      invalidate();
      toast.success("Academic year deleted.");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (year: AcademicYear) => {
    setEditing(year);
    setForm({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
      status: year.status,
      bootstrapClasses: false,
    });
    setDialogOpen(true);
  };

  if (isLoading) return <AdminLoadingState label="Loading academic years…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load academic years."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Academic years"
        description="Define the school's academic calendar. Only one year can be Active at a time."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add academic year
          </Button>
        }
      />

      {years.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <CalendarRange className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">No academic years yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first year (e.g. 2026–27) to begin class and enrollment setup.
          </p>
          <Button className="mt-6" onClick={openCreate}>
            <Plus className="size-4" />
            Add academic year
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <AcademicYearRow
                  key={year.id}
                  year={year}
                  onEdit={() => openEdit(year)}
                  onDelete={() => setDeleteTarget(year)}
                  onStatusChange={(status) => statusMutation.mutate({ id: year.id, status })}
                  onBootstrap={() => bootstrapMutation.mutate(year.id)}
                  statusPending={statusMutation.isPending}
                  bootstrapPending={bootstrapMutation.isPending}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit academic year" : "Add academic year"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year-name">Name</Label>
              <Input
                id="year-name"
                placeholder="e.g. 2026–27"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year-start">Start date</Label>
                <Input
                  id="year-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-end">End date</Label>
                <Input
                  id="year-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: AcademicYearStatus) =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEAR_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ACADEMIC_YEAR_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.status === "ACTIVE" && (
                <p className="text-xs text-muted-foreground">
                  Setting Active will close any other currently active year.
                </p>
              )}
            </div>
            {!editing && (
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id="bootstrap-classes"
                  checked={form.bootstrapClasses}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, bootstrapClasses: checked === true }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="bootstrap-classes" className="cursor-pointer font-normal">
                    Initialize class structure
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Creates class-year rows for Class 1–10 from the master class list.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !form.name.trim() ||
                !form.start_date ||
                !form.end_date ||
                saveMutation.isPending
              }
              onClick={() => saveMutation.mutate()}
            >
              {editing ? "Save changes" : "Create year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete academic year?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteTarget?.name}. Only planning years with no linked
              structure can be deleted.
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

function AcademicYearRow({
  year,
  onEdit,
  onDelete,
  onStatusChange,
  onBootstrap,
  statusPending,
  bootstrapPending,
}: {
  year: AcademicYear;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: AcademicYearStatus) => void;
  onBootstrap: () => void;
  statusPending: boolean;
  bootstrapPending: boolean;
}) {
  const { data: classYears = [] } = useQuery({
    queryKey: ["admin", "class-years", year.id],
    queryFn: () => fetchClassYearsForAcademicYear(year.id),
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{year.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(year.start_date)} – {formatDate(year.end_date)}
      </TableCell>
      <TableCell>
        <Select
          value={year.status}
          disabled={statusPending}
          onValueChange={(value: AcademicYearStatus) => onStatusChange(value)}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue>{ACADEMIC_YEAR_STATUS_LABELS[year.status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_YEAR_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ACADEMIC_YEAR_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
          {classYears.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={bootstrapPending}
              onClick={onBootstrap}
            >
              <Layers className="size-4" />
              Init classes
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          {year.status === "PLANNING" && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
