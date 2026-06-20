import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  createFacultyAccountFn,
  listFacultyProfilesFn,
  setFacultyAccountActiveFn,
  updateFacultyAccountFn,
  type CreateFacultyAccountInput,
  type UpdateFacultyAccountInput,
} from "@/lib/api/faculty-accounts.server";
import { CLASS_NUMBERS } from "@/lib/class-materials";
import type { FacultyProfile } from "@/types/database";

const emptyForm: CreateFacultyAccountInput = {
  email: "",
  password: "",
  name: "",
  role: "",
  bio: "",
  assignedClass: 1,
};

const emptyEditForm: Omit<UpdateFacultyAccountInput, "profileId"> = {
  name: "",
  role: "",
  bio: "",
  assignedClass: 1,
};

export function FacultyAccountsAdmin() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyProfile | null>(null);
  const [form, setForm] = useState<CreateFacultyAccountInput>(emptyForm);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "faculty-accounts"],
    queryFn: () => listFacultyProfilesFn(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateFacultyAccountInput) => createFacultyAccountFn({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success("Faculty account created. They can sign in at the staff login page.");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create faculty account.");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ profileId, isActive }: { profileId: string; isActive: boolean }) =>
      setFacultyAccountActiveFn({ data: { profileId, isActive } }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success(
        profile.is_active
          ? `${profile.name} can sign in to the faculty portal again.`
          : `${profile.name}'s portal access has been temporarily disabled.`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update faculty account status.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateFacultyAccountInput) => updateFacultyAccountFn({ data: input }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success(`Updated ${profile.name}'s faculty account.`);
      setEditDialogOpen(false);
      setEditing(null);
      setEditForm(emptyEditForm);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update faculty account.");
    },
  });

  const openEdit = (account: FacultyProfile) => {
    setEditing(account);
    setEditForm({
      name: account.name,
      role: account.role,
      bio: account.bio ?? "",
      assignedClass: account.assigned_class,
    });
    setEditDialogOpen(true);
  };

  if (isLoading) return <AdminLoadingState label="Loading faculty accounts…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load faculty accounts."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Faculty portal accounts"
        description="Create login credentials and assign each teacher to a class for the faculty portal."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="size-4" />
            Add faculty account
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role / subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Portal access</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
              <TableHead className="hidden lg:table-cell">User ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No faculty portal accounts yet. Create one to enable staff login.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {account.name}
                      {account.is_active === false && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{account.role}</TableCell>
                  <TableCell>Class {account.assigned_class}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={account.is_active !== false}
                        disabled={toggleActiveMutation.isPending}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({
                            profileId: account.id,
                            isActive: checked,
                          })
                        }
                        aria-label={`Portal access for ${account.name}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {account.is_active !== false ? "Active" : "Off"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(account)}
                      aria-label={`Edit ${account.name}`}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                    {account.user_id}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create faculty account</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="faculty-name">Full name</Label>
                <Input
                  id="faculty-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="faculty-email">Email (login)</Label>
                <Input
                  id="faculty-email"
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="faculty-password">Temporary password</Label>
                <Input
                  id="faculty-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty-role">Role / subject</Label>
                <Input
                  id="faculty-role"
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="e.g. Class Teacher — Mathematics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned class</Label>
                <Select
                  value={String(form.assignedClass)}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, assignedClass: Number(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_NUMBERS.map((classNumber) => (
                      <SelectItem key={classNumber} value={String(classNumber)}>
                        Class {classNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="faculty-bio">Bio (optional)</Label>
                <Textarea
                  id="faculty-bio"
                  rows={3}
                  value={form.bio ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditing(null);
            setEditForm(emptyEditForm);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit faculty account</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editing) return;
              updateMutation.mutate({
                profileId: editing.id,
                ...editForm,
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-faculty-name">Full name</Label>
                <Input
                  id="edit-faculty-name"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-faculty-role">Role / subject</Label>
                <Input
                  id="edit-faculty-role"
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, role: event.target.value }))
                  }
                  placeholder="e.g. Class Teacher — Mathematics"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned class</Label>
                <Select
                  value={String(editForm.assignedClass)}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, assignedClass: Number(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_NUMBERS.map((classNumber) => (
                      <SelectItem key={classNumber} value={String(classNumber)}>
                        Class {classNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-faculty-bio">Bio (optional)</Label>
                <Textarea
                  id="edit-faculty-bio"
                  rows={3}
                  value={editForm.bio ?? ""}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, bio: event.target.value }))
                  }
                />
              </div>
            </div>
            {editing && editForm.assignedClass !== editing.assigned_class && (
              <p className="text-xs text-muted-foreground">
                Changing class updates portal upload access. Materials already uploaded for the
                previous class stay on the Students page; only an admin can remove them from Class
                Materials.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
