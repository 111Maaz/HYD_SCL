import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { CLASS_NUMBERS, type ClassMaterial } from "@/lib/class-materials";
import {
  deleteClassMaterial,
  fetchAllClassMaterials,
  replaceClassMaterialFile,
  updateClassMaterial,
  uploadClassMaterial,
  type ClassMaterialInput,
} from "@/services/class-materials";

const emptyForm: ClassMaterialInput = {
  class_number: 1,
  title: "",
  subject: "",
  description: "",
};

export function ClassMaterialsAdmin() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassMaterial | null>(null);
  const [form, setForm] = useState<ClassMaterialInput>(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassMaterial | null>(null);

  const {
    data: materials = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "class-materials"],
    queryFn: fetchAllClassMaterials,
  });

  const filtered =
    classFilter === "all"
      ? materials
      : materials.filter((m) => m.class_number === Number(classFilter));

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "class-materials"] });
    void queryClient.invalidateQueries({ queryKey: ["class-materials"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const updated = await updateClassMaterial(editing.id, form);
        if (pendingFile) {
          return replaceClassMaterialFile(editing.id, pendingFile);
        }
        return updated;
      }
      if (!pendingFile) throw new Error("Choose a file to upload.");
      return uploadClassMaterial(pendingFile, form);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Material updated." : "Material uploaded.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setPendingFile(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClassMaterial(id),
    onSuccess: () => {
      invalidate();
      toast.success("Material deleted.");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      class_number: classFilter === "all" ? 1 : Number(classFilter),
    });
    setPendingFile(null);
    setDialogOpen(true);
  };

  const openEdit = (material: ClassMaterial) => {
    setEditing(material);
    setForm({
      class_number: material.class_number,
      title: material.title,
      subject: material.subject,
      description: material.description,
    });
    setPendingFile(null);
    setDialogOpen(true);
  };

  if (isLoading) return <AdminLoadingState label="Loading class materials…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load class materials."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Class Materials"
        description="Upload, edit, and delete materials for the Students page."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Upload material
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <Label htmlFor="class-filter">Filter by class</Label>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger id="class-filter" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {CLASS_NUMBERS.map((num) => (
              <SelectItem key={num} value={String(num)}>
                Class {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No materials{classFilter !== "all" ? ` for class ${classFilter}` : ""}.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>Class {material.class_number}</TableCell>
                  <TableCell className="font-medium">{material.title}</TableCell>
                  <TableCell>{material.subject}</TableCell>
                  <TableCell>
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {material.file_name}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(material.updated_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(material)}>
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(material)}>
                        <Trash2 className="size-4" />
                        Delete
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
            <DialogTitle>{editing ? "Edit class material" : "Upload class material"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={String(form.class_number)}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, class_number: Number(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_NUMBERS.map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      Class {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-title">Title</Label>
              <Input
                id="material-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-subject">Subject</Label>
              <Input
                id="material-subject"
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-description">Description</Label>
              <Textarea
                id="material-description"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>File {editing ? "(optional — replace existing)" : ""}</Label>
              <Input
                ref={fileInputRef}
                type="file"
                className="cursor-pointer file:mr-3 file:cursor-pointer"
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              />
              {editing && (
                <p className="text-xs text-muted-foreground">Current: {editing.file_name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !form.title.trim() ||
                !form.subject.trim() ||
                (!editing && !pendingFile) ||
                saveMutation.isPending
              }
              onClick={() => saveMutation.mutate()}
            >
              {editing ? "Save changes" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class material?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{deleteTarget?.title}&rdquo; from the Students page.
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
