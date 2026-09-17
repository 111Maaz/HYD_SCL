import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Pencil, Plus, Search, Unlink, UserPlus } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { inviteParentAccountFn } from "@/lib/api/parent-invite.server";
import {
  createGuardian,
  getGuardianDisplayName,
  linkStudentToGuardian,
  fetchGuardians,
  setGuardianActive,
  unlinkStudentFromGuardian,
  updateGuardian,
  updateStudentGuardianAccess,
} from "@/services/guardians";
import { fetchStudents } from "@/services/students";
import {
  GUARDIAN_RELATIONSHIPS,
  type GuardianInput,
  type GuardianWithLinks,
  type LinkedStudentSummary,
} from "@/types/guardians";
import { getStudentDisplayName } from "@/types/students";

const emptyGuardianForm = (): GuardianInput => ({
  first_name: "",
  last_name: "",
  relationship: "Father",
  phone: "",
  email: "",
  address: "",
  active: true,
});

export function GuardiansAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuardianWithLinks | null>(null);
  const [form, setForm] = useState<GuardianInput>(emptyGuardianForm());

  const [linkTarget, setLinkTarget] = useState<GuardianWithLinks | null>(null);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkPrimary, setLinkPrimary] = useState(false);
  const [linkAttendance, setLinkAttendance] = useState(true);
  const [linkFees, setLinkFees] = useState(true);
  const [linkAcademic, setLinkAcademic] = useState(true);

  const [inviteTarget, setInviteTarget] = useState<GuardianWithLinks | null>(null);
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    password: string;
    createdNew: boolean;
  } | null>(null);

  const [unlinkTarget, setUnlinkTarget] = useState<LinkedStudentSummary | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 600);
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data: guardians = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "guardians", debouncedSearch],
    queryFn: () => fetchGuardians(debouncedSearch),
    placeholderData: keepPreviousData,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["admin", "students", ""],
    queryFn: () => fetchStudents(),
    enabled: Boolean(linkTarget),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "guardians"] });
  };

  const saveGuardianMutation = useMutation({
    mutationFn: async () => {
      if (editing) return updateGuardian(editing.id, form);
      return createGuardian(form);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Guardian updated." : "Guardian created.");
      setGuardianDialogOpen(false);
      setEditing(null);
      setForm(emptyGuardianForm());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setGuardianActive(id, active),
    onSuccess: () => {
      invalidate();
      toast.success("Guardian status updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!linkTarget) throw new Error("No guardian selected.");
      return linkStudentToGuardian({
        guardian_id: linkTarget.id,
        student_id: linkStudentId,
        is_primary: linkPrimary,
        can_view_attendance: linkAttendance,
        can_view_fees: linkFees,
        can_view_academic_data: linkAcademic,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Student linked to guardian.");
      setLinkTarget(null);
      setLinkStudentId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => unlinkStudentFromGuardian(linkId),
    onSuccess: () => {
      invalidate();
      toast.success("Student unlinked.");
      setUnlinkTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const accessMutation = useMutation({
    mutationFn: ({
      linkId,
      field,
      value,
    }: {
      linkId: string;
      field: "can_view_attendance" | "can_view_fees" | "can_view_academic_data" | "is_primary";
      value: boolean;
    }) => updateStudentGuardianAccess(linkId, { [field]: value }),
    onSuccess: () => invalidate(),
    onError: (err: Error) => toast.error(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!inviteTarget) throw new Error("No guardian selected.");
      return inviteParentAccountFn({
        data: { guardianId: inviteTarget.id, password: invitePassword },
      });
    },
    onSuccess: (result) => {
      invalidate();
      setInviteResult({
        email: result.email,
        password: result.temporaryPassword,
        createdNew: result.createdNewAuthUser,
      });
      toast.success(
        result.createdNewAuthUser
          ? "Parent login created. Share the temporary password securely."
          : "Parent password updated. Share it securely.",
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyGuardianForm());
    setGuardianDialogOpen(true);
  };

  const openEdit = (guardian: GuardianWithLinks) => {
    setEditing(guardian);
    setForm({
      first_name: guardian.first_name,
      last_name: guardian.last_name ?? "",
      relationship: guardian.relationship ?? "",
      phone: guardian.phone ?? "",
      email: guardian.email ?? "",
      address: guardian.address ?? "",
      active: guardian.active,
    });
    setGuardianDialogOpen(true);
  };

  const openLink = (guardian: GuardianWithLinks) => {
    setLinkTarget(guardian);
    setLinkStudentId("");
    setLinkPrimary(false);
    setLinkAttendance(true);
    setLinkFees(true);
    setLinkAcademic(true);
  };

  const openInvite = (guardian: GuardianWithLinks) => {
    setInviteTarget(guardian);
    setInvitePassword("");
    setInviteResult(null);
  };

  if (isLoading) return <AdminLoadingState label="Loading guardians…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load guardians."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Guardians"
        description="School-controlled parent/guardian records. Link children here; parents never create students."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add guardian
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isFetching && !isLoading ? (
          <p className="mt-1 text-xs text-muted-foreground" role="status">Searching guardians…</p>
        ) : null}
      </div>

      {guardians.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <UserPlus className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">No guardians yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a guardian, link students, then invite them to log in as a parent.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {guardians.map((guardian) => (
            <div key={guardian.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{getGuardianDisplayName(guardian)}</h2>
                    {guardian.relationship && (
                      <Badge variant="outline">{guardian.relationship}</Badge>
                    )}
                    {!guardian.active && <Badge variant="secondary">Inactive</Badge>}
                    {guardian.has_login ? (
                      <Badge>Login ready</Badge>
                    ) : (
                      <Badge variant="secondary">No login</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[guardian.phone, guardian.email].filter(Boolean).join(" · ") || "No contact"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                    <Switch
                      checked={guardian.active}
                      onCheckedChange={(checked) =>
                        activeMutation.mutate({ id: guardian.id, active: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(guardian)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openLink(guardian)}>
                    <Link2 className="size-4" />
                    Link student
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openInvite(guardian)}
                    disabled={!guardian.email}
                    title={!guardian.email ? "Email required to invite" : undefined}
                  >
                    <UserPlus className="size-4" />
                    {guardian.has_login ? "Reset invite" : "Invite parent"}
                  </Button>
                </div>
              </div>

              {guardian.linked_students.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No linked students yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Primary</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Fees</TableHead>
                        <TableHead>Academic</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guardian.linked_students.map((child) => (
                        <TableRow key={child.link_id}>
                          <TableCell>
                            <div className="font-medium">{getStudentDisplayName(child)}</div>
                            <div className="text-xs text-muted-foreground">
                              {child.student_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={child.is_primary}
                              onCheckedChange={(checked) =>
                                accessMutation.mutate({
                                  linkId: child.link_id,
                                  field: "is_primary",
                                  value: checked === true,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={child.can_view_attendance}
                              onCheckedChange={(checked) =>
                                accessMutation.mutate({
                                  linkId: child.link_id,
                                  field: "can_view_attendance",
                                  value: checked === true,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={child.can_view_fees}
                              onCheckedChange={(checked) =>
                                accessMutation.mutate({
                                  linkId: child.link_id,
                                  field: "can_view_fees",
                                  value: checked === true,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={child.can_view_academic_data}
                              onCheckedChange={(checked) =>
                                accessMutation.mutate({
                                  linkId: child.link_id,
                                  field: "can_view_academic_data",
                                  value: checked === true,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUnlinkTarget(child)}
                            >
                              <Unlink className="size-4" />
                              Unlink
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={guardianDialogOpen} onOpenChange={setGuardianDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit guardian" : "Add guardian"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First name *</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm((c) => ({ ...c, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                value={form.last_name ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, last_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={form.relationship || "Other"}
                onValueChange={(value) => setForm((c) => ({ ...c, relationship: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUARDIAN_RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Email (required for parent invite)</Label>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={form.address ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Creating a second guardian with the same phone/email is blocked so siblings share one
            parent login.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuardianDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveGuardianMutation.mutate()}
              disabled={saveGuardianMutation.isPending || !form.first_name.trim()}
            >
              {saveGuardianMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(linkTarget)} onOpenChange={(open) => !open && setLinkTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Link student
              {linkTarget ? ` — ${getGuardianDisplayName(linkTarget)}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={linkStudentId || undefined} onValueChange={setLinkStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(
                      (s) =>
                        !linkTarget?.linked_students.some((linked) => linked.student_id === s.id),
                    )
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {getStudentDisplayName(student)} ({student.student_number})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="link-primary"
                checked={linkPrimary}
                onCheckedChange={(c) => setLinkPrimary(c === true)}
              />
              <Label htmlFor="link-primary">Primary guardian for this student</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="link-att"
                checked={linkAttendance}
                onCheckedChange={(c) => setLinkAttendance(c === true)}
              />
              <Label htmlFor="link-att">Can view attendance</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="link-fees"
                checked={linkFees}
                onCheckedChange={(c) => setLinkFees(c === true)}
              />
              <Label htmlFor="link-fees">Can view fees</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="link-acad"
                checked={linkAcademic}
                onCheckedChange={(c) => setLinkAcademic(c === true)}
              />
              <Label htmlFor="link-acad">Can view academic data</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending || !linkStudentId}
            >
              Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(inviteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setInviteTarget(null);
            setInviteResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite parent login</DialogTitle>
          </DialogHeader>
          {inviteResult ? (
            <div className="space-y-3 py-2 text-sm">
              <p>
                Share these credentials securely with{" "}
                <strong>{inviteTarget ? getGuardianDisplayName(inviteTarget) : "the parent"}</strong>
                . They sign in at <strong>/parent/login</strong> and land on{" "}
                <strong>My Children</strong>.
              </p>
              <div className="rounded-md bg-muted p-3 font-mono text-xs">
                <div>Email: {inviteResult.email}</div>
                <div>Password: {inviteResult.password}</div>
              </div>
              <p className="text-muted-foreground">
                {inviteResult.createdNew
                  ? "New auth account created."
                  : "Existing account password was reset."}
              </p>
              <DialogFooter>
                <Button onClick={() => setInviteTarget(null)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Creates a login for {inviteTarget?.email}. Parent will only see linked children.
                </p>
                <div className="space-y-2">
                  <Label>Temporary password</Label>
                  <Input
                    type="text"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    minLength={6}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending || invitePassword.length < 6}
                >
                  {inviteMutation.isPending ? "Creating…" : "Create / reset login"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(unlinkTarget)}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink student?</AlertDialogTitle>
            <AlertDialogDescription>
              {unlinkTarget
                ? `Remove link to ${getStudentDisplayName(unlinkTarget)} (${unlinkTarget.student_number})? The parent will no longer see this child.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkTarget && unlinkMutation.mutate(unlinkTarget.link_id)}
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
