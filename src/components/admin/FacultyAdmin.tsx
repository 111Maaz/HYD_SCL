import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createFacultyMember,
  deleteFacultyMember,
  fetchAllFacultyMembers,
  removeFacultyPhoto,
  reorderFacultyMembers,
  updateFacultyMember,
  uploadFacultyPhoto,
  type FacultyMemberInput,
} from "@/services/faculty";
import { LEADERSHIP_ROLES } from "@/lib/site";
import {
  getStaffDisplayName,
  isStaffPubliclyVisible,
  type StaffProfile,
} from "@/types/database";

const ACCENT_OPTIONS = [
  { label: "Primary gradient", value: "bg-gradient-to-br from-primary to-primary-glow" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Sky", value: "bg-sky-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Rose", value: "bg-rose-500" },
];

const emptyForm: FacultyMemberInput = {
  name: "",
  role: "",
  bio: "",
  accent: ACCENT_OPTIONS[0].value,
  is_active: true,
};

export function FacultyAdmin() {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffProfile | null>(null);
  const [form, setForm] = useState<FacultyMemberInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<StaffProfile | null>(null);
  const [photoTarget, setPhotoTarget] = useState<StaffProfile | null>(null);

  const {
    data: members = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "faculty-members"],
    queryFn: fetchAllFacultyMembers,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-members"] });
    void queryClient.invalidateQueries({ queryKey: ["faculty-members"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateFacultyMember(editing.id, form);
      }
      return createFacultyMember(form);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Faculty member updated." : "Faculty member added.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFacultyMember(id),
    onSuccess: () => {
      invalidate();
      toast.success("Faculty member deleted.");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderFacultyMembers(orderedIds),
    onSuccess: () => {
      invalidate();
      toast.success("Faculty order updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadFacultyPhoto(id, file),
    onSuccess: () => {
      invalidate();
      toast.success("Photo uploaded.");
      setPhotoTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removePhotoMutation = useMutation({
    mutationFn: (id: string) => removeFacultyPhoto(id),
    onSuccess: () => {
      invalidate();
      toast.success("Photo removed.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (member: StaffProfile) => {
    setEditing(member);
    setForm({
      name: getStaffDisplayName(member),
      role: member.designation ?? "",
      bio: member.bio ?? "",
      accent: member.accent ?? ACCENT_OPTIONS[0].value,
      is_active: isStaffPubliclyVisible(member),
    });
    setDialogOpen(true);
  };

  const moveMember = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= members.length) return;
    const orderedIds = members.map((m) => m.id);
    [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];
    reorderMutation.mutate(orderedIds);
  };

  const handlePhotoSelect = (file: File | undefined) => {
    if (!photoTarget || !file) return;
    photoMutation.mutate({ id: photoTarget.id, file });
  };

  if (isLoading) return <AdminLoadingState label="Loading faculty…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load faculty."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Faculty"
        description="Manage faculty shown on the Academics page. There is no separate public Faculty page."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add faculty
          </Button>
        }
      />

      {members.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No faculty members yet.</p>
      ) : (
        <div className="space-y-3">
          {members.map((member, index) => {
            const name = getStaffDisplayName(member);
            return (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  {member.photo_url ? (
                    <AvatarImage src={member.photo_url} alt={name} />
                  ) : null}
                  <AvatarFallback className={member.accent ?? ""}>
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{name}</p>
                    {!isStaffPubliclyVisible(member) && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.designation}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={index === 0 || reorderMutation.isPending}
                  onClick={() => moveMember(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={index === members.length - 1 || reorderMutation.isPending}
                  onClick={() => moveMember(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoTarget(member);
                    photoInputRef.current?.click();
                  }}
                >
                  <Upload className="size-4" />
                  {member.photo_url ? "Replace photo" : "Upload photo"}
                </Button>
                {member.photo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={removePhotoMutation.isPending}
                    onClick={() => removePhotoMutation.mutate(member.id)}
                  >
                    <X className="size-4" />
                    Remove photo
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(member)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </div>
          );
          })}
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handlePhotoSelect(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit faculty member" : "Add faculty member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faculty-name">Name</Label>
              <Input
                id="faculty-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-role">Role</Label>
              <Input
                id="faculty-role"
                list="faculty-role-options"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              />
              <datalist id="faculty-role-options">
                {LEADERSHIP_ROLES.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-bio">Bio</Label>
              <Textarea
                id="faculty-bio"
                rows={3}
                value={form.bio ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar color</Label>
              <Select
                value={form.accent ?? ACCENT_OPTIONS[0].value}
                onValueChange={(value) => setForm((prev) => ({ ...prev, accent: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="faculty-active">Visible on Academics page</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive members are hidden publicly.
                </p>
              </div>
              <Switch
                id="faculty-active"
                checked={form.is_active ?? true}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim() || !form.role.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {editing ? "Save changes" : "Add faculty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete faculty member?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget ? getStaffDisplayName(deleteTarget) : ""} from the
              Academics page roster.
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
