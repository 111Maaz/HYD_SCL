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
  type StaffAccountRow,
  type UpdateFacultyAccountInput,
} from "@/lib/api/faculty-accounts.server";
import { CLASS_NUMBERS } from "@/lib/class-materials";
import {
  getStaffDisplayName,
  isStaffPortalActive,
} from "@/types/database";
import {
  ASSIGNABLE_STAFF_ROLE_KEYS,
  INCHARGE_ROLE_KEYS,
  STAFF_ROLE_LABELS,
  isSchoolWideStaffRole,
  roleUsesAssignedClass,
  type StaffRoleKey,
} from "@/types/staff-roles";

const NONE_INCHARGE = "__none__";

const emptyForm: CreateFacultyAccountInput = {
  email: "",
  password: "",
  name: "",
  role: "",
  bio: "",
  assignedClass: 1,
  staffRoleKey: "TEACHER",
  alsoInchargeRoleKey: null,
};

const emptyEditForm: Omit<UpdateFacultyAccountInput, "profileId"> = {
  name: "",
  role: "",
  bio: "",
  assignedClass: 1,
  staffRoleKey: "TEACHER",
  alsoInchargeRoleKey: null,
};

function formatErpRoles(account: StaffAccountRow): string {
  const base = account.staff_role_key
    ? STAFF_ROLE_LABELS[account.staff_role_key]
    : "—";
  if (account.also_incharge_role_key) {
    return `${base} + ${STAFF_ROLE_LABELS[account.also_incharge_role_key]}`;
  }
  return base;
}

function formatClassCell(account: StaffAccountRow): string {
  if (account.assigned_class != null) return `Class ${account.assigned_class}`;
  if (isSchoolWideStaffRole(account.staff_role_key) || account.also_incharge_role_key) {
    return "School-wide";
  }
  return "—";
}

export function FacultyAccountsAdmin() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffAccountRow | null>(null);
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
      toast.success("Staff account created. They can sign in at /admin/login.");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create staff account.");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ profileId, isActive }: { profileId: string; isActive: boolean }) =>
      setFacultyAccountActiveFn({ data: { profileId, isActive } }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      const name = getStaffDisplayName(profile);
      toast.success(
        isStaffPortalActive(profile)
          ? `${name} can sign in again.`
          : `${name}'s portal access has been temporarily disabled.`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update staff account status.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateFacultyAccountInput) => updateFacultyAccountFn({ data: input }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success(`Updated ${getStaffDisplayName(profile)}'s staff account.`);
      setEditDialogOpen(false);
      setEditing(null);
      setEditForm(emptyEditForm);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update staff account.");
    },
  });

  const setCreateSystemRole = (value: StaffRoleKey) => {
    setForm((prev) => ({
      ...prev,
      staffRoleKey: value,
      assignedClass: roleUsesAssignedClass(value) ? (prev.assignedClass ?? 1) : null,
      alsoInchargeRoleKey: roleUsesAssignedClass(value) ? prev.alsoInchargeRoleKey : null,
    }));
  };

  const setEditSystemRole = (value: StaffRoleKey) => {
    setEditForm((prev) => ({
      ...prev,
      staffRoleKey: value,
      assignedClass: roleUsesAssignedClass(value) ? (prev.assignedClass ?? 1) : null,
      alsoInchargeRoleKey: roleUsesAssignedClass(value) ? prev.alsoInchargeRoleKey : null,
    }));
  };

  const openEdit = (account: StaffAccountRow) => {
    setEditing(account);
    const systemRole = account.staff_role_key ?? "TEACHER";
    setEditForm({
      name: getStaffDisplayName(account),
      role: account.designation ?? "",
      bio: account.bio ?? "",
      assignedClass: roleUsesAssignedClass(systemRole)
        ? (account.assigned_class ?? 1)
        : null,
      staffRoleKey: systemRole,
      alsoInchargeRoleKey: account.also_incharge_role_key,
    });
    setEditDialogOpen(true);
  };

  if (isLoading) return <AdminLoadingState label="Loading staff accounts…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load staff accounts."}
      />
    );
  }

  const createShowsClass = roleUsesAssignedClass(form.staffRoleKey);
  const editShowsClass = roleUsesAssignedClass(editForm.staffRoleKey ?? "TEACHER");

  return (
    <>
      <AdminPageHeader
        title="Staff accounts"
        description="Create login accounts and assign ERP roles. Incharges are school-wide; teachers can also hold an incharge duty."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="size-4" />
            Add staff account
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ERP role</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Portal access</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No staff portal accounts yet. Create one to enable staff login.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => {
                const name = getStaffDisplayName(account);
                const portalActive = isStaffPortalActive(account);
                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {name}
                        {!portalActive && <Badge variant="secondary">Disabled</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{account.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatErpRoles(account)}</Badge>
                    </TableCell>
                    <TableCell>{account.designation}</TableCell>
                    <TableCell>{formatClassCell(account)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={portalActive}
                          disabled={toggleActiveMutation.isPending}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({
                              profileId: account.id,
                              isActive: checked,
                            })
                          }
                          aria-label={`Portal access for ${name}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {portalActive ? "Active" : "Off"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(account)}
                        aria-label={`Edit ${name}`}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create staff account</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate({
                ...form,
                assignedClass: createShowsClass ? form.assignedClass : null,
                alsoInchargeRoleKey: createShowsClass ? form.alsoInchargeRoleKey : null,
              });
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
              <div className={`space-y-2 ${createShowsClass ? "" : "sm:col-span-2"}`}>
                <Label>System role</Label>
                <Select
                  value={form.staffRoleKey}
                  onValueChange={(value) => setCreateSystemRole(value as StaffRoleKey)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_STAFF_ROLE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {STAFF_ROLE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {createShowsClass ? (
                <div className="space-y-2">
                  <Label>Assigned class</Label>
                  <Select
                    value={String(form.assignedClass ?? 1)}
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
              ) : (
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  This role is school-wide — no class assignment.
                </p>
              )}
              {createShowsClass ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Also school-wide incharge (optional)</Label>
                  <Select
                    value={form.alsoInchargeRoleKey ?? NONE_INCHARGE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        alsoInchargeRoleKey:
                          value === NONE_INCHARGE ? null : (value as StaffRoleKey),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_INCHARGE}>None</SelectItem>
                      {INCHARGE_ROLE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {STAFF_ROLE_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Lets a class teacher keep their class and also act as an incharge for the whole
                    school (Principal / Vice Principal can change this later).
                  </p>
                </div>
              ) : null}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="faculty-role">Display title</Label>
                <Input
                  id="faculty-role"
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="e.g. Class Teacher — Mathematics"
                  required
                />
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
            <p className="text-xs text-muted-foreground">
              Teachers open the faculty portal. Incharges and Vice Principal open the admin portal.
              A teacher who is also an incharge opens the admin portal.
            </p>
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
            <DialogTitle>Edit staff account</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editing) return;
              updateMutation.mutate({
                profileId: editing.id,
                ...editForm,
                assignedClass: editShowsClass ? editForm.assignedClass : null,
                alsoInchargeRoleKey: editShowsClass ? editForm.alsoInchargeRoleKey : null,
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
              <div className={`space-y-2 ${editShowsClass ? "" : "sm:col-span-2"}`}>
                <Label>System role</Label>
                <Select
                  value={editForm.staffRoleKey ?? "TEACHER"}
                  onValueChange={(value) => setEditSystemRole(value as StaffRoleKey)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_STAFF_ROLE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {STAFF_ROLE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editShowsClass ? (
                <div className="space-y-2">
                  <Label>Assigned class</Label>
                  <Select
                    value={String(editForm.assignedClass ?? 1)}
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
              ) : (
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  This role is school-wide — no class assignment.
                </p>
              )}
              {editShowsClass ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Also school-wide incharge (optional)</Label>
                  <Select
                    value={editForm.alsoInchargeRoleKey ?? NONE_INCHARGE}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        alsoInchargeRoleKey:
                          value === NONE_INCHARGE ? null : (value as StaffRoleKey),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_INCHARGE}>None</SelectItem>
                      {INCHARGE_ROLE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {STAFF_ROLE_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-faculty-role">Display title</Label>
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
            {editing &&
              editShowsClass &&
              editForm.assignedClass !== (editing.assigned_class ?? 1) && (
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
