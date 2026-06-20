import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import type { ClassMaterial } from "@/lib/class-materials";
import {
  deleteFacultyClassMaterial,
  fetchFacultyClassMaterials,
  fetchOwnFacultyProfile,
  uploadFacultyClassMaterial,
  type FacultyMaterialInput,
} from "@/services/faculty-portal";

const emptyForm: FacultyMaterialInput = {
  title: "",
  subject: "",
  description: "",
};

export function FacultyMaterialsView() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FacultyMaterialInput>(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassMaterial | null>(null);

  const profileQuery = useQuery({
    queryKey: ["faculty", "profile", auth?.userId],
    queryFn: () => fetchOwnFacultyProfile(auth!.userId),
    enabled: !!auth?.userId,
  });

  const assignedClass = profileQuery.data?.assigned_class;

  const materialsQuery = useQuery({
    queryKey: ["faculty", "materials", assignedClass],
    queryFn: () => fetchFacultyClassMaterials(assignedClass!),
    enabled: assignedClass != null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["faculty", "materials"] });
    void queryClient.invalidateQueries({ queryKey: ["class-materials"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "class-materials"] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!pendingFile) throw new Error("Choose a file to upload.");
      if (!auth?.userId || assignedClass == null) {
        throw new Error("Profile not loaded.");
      }
      return uploadFacultyClassMaterial(pendingFile, form, auth.userId, assignedClass);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Material uploaded.");
      setDialogOpen(false);
      setForm(emptyForm);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!auth?.userId) throw new Error("Not signed in.");
      return deleteFacultyClassMaterial(id, auth.userId);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Material deleted.");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (profileQuery.isLoading || materialsQuery.isLoading) {
    return <AdminLoadingState label="Loading class materials…" />;
  }

  if (profileQuery.isError) {
    return (
      <AdminErrorState
        message={
          profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Failed to load your profile."
        }
      />
    );
  }

  if (materialsQuery.isError) {
    return (
      <AdminErrorState
        message={
          materialsQuery.error instanceof Error
            ? materialsQuery.error.message
            : "Failed to load class materials."
        }
      />
    );
  }

  const materials = materialsQuery.data ?? [];

  return (
    <>
      <AdminPageHeader
        title="My Class Materials"
        description={`Upload and manage materials for Class ${assignedClass}. You can delete only materials you uploaded.`}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Upload material
          </Button>
        }
      />

      {materials.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No materials for Class {assignedClass} yet. Upload your first file above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Subject</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const isOwn = material.uploaded_by === auth?.userId;

                return (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{material.title}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {material.subject}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{material.subject}</TableCell>
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
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {format(new Date(material.updated_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {isOwn ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(material)}
                        >
                          <Trash2 className="size-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload class material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Materials will be published for <strong>Class {assignedClass}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="faculty-material-title">Title</Label>
              <Input
                id="faculty-material-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-material-subject">Subject</Label>
              <Input
                id="faculty-material-subject"
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-material-description">Description</Label>
              <Textarea
                id="faculty-material-description"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                className="cursor-pointer file:mr-3 file:cursor-pointer"
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              />
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
                !pendingFile ||
                uploadMutation.isPending
              }
              onClick={() => uploadMutation.mutate()}
            >
              Upload
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
