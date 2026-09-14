import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, UserCog, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  listFacultyProfilesFn,
  setFacultyAccountActiveFn,
  updateFacultyAccountFn,
  type StaffAccountRow,
} from "@/lib/api/faculty-accounts.server";
import {
  INCHARGE_ROLE_KEYS,
  STAFF_ROLE_LABELS,
  isAboveVicePrincipalAuthority,
  isInchargeRole,
  type StaffRoleKey,
} from "@/types/staff-roles";
import { getStaffDisplayName, isStaffPortalActive } from "@/types/database";

function isInchargeAccount(row: StaffAccountRow): boolean {
  return isInchargeRole(row.staff_role_key) || isInchargeRole(row.also_incharge_role_key);
}

export function LeadershipConsole({ mode }: { mode: "principal" | "vice_principal" }) {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [assignVpOpen, setAssignVpOpen] = useState(false);
  const [assignVpStaffId, setAssignVpStaffId] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assignRole, setAssignRole] = useState<StaffRoleKey>("ATTENDANCE_INCHARGE");
  const [inchargesOpen, setInchargesOpen] = useState(mode === "vice_principal");
  const [staffOpen, setStaffOpen] = useState(mode === "vice_principal");

  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "faculty-accounts"],
    queryFn: () => listFacultyProfilesFn(),
  });

  const vicePrincipals = useMemo(
    () => accounts.filter((a) => a.staff_role_key === "VICE_PRINCIPAL"),
    [accounts],
  );
  const incharges = useMemo(
    () => accounts.filter((a) => isInchargeAccount(a)),
    [accounts],
  );
  const otherStaff = useMemo(
    () =>
      accounts.filter(
        (a) =>
          !isAboveVicePrincipalAuthority(a.staff_role_key) && !isInchargeAccount(a),
      ),
    [accounts],
  );

  const toggleMutation = useMutation({
    mutationFn: ({ profileId, isActive }: { profileId: string; isActive: boolean }) =>
      setFacultyAccountActiveFn({ data: { profileId, isActive } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success("Access updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const assignVpMutation = useMutation({
    mutationFn: async () => {
      const row = accounts.find((a) => a.id === assignVpStaffId);
      if (!row) throw new Error("Select a staff member.");
      return updateFacultyAccountFn({
        data: {
          profileId: row.id,
          name: getStaffDisplayName(row),
          role: "Vice Principal",
          bio: row.bio ?? undefined,
          assignedClass: null,
          staffRoleKey: "VICE_PRINCIPAL",
          alsoInchargeRoleKey: null,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success("Vice Principal role granted.");
      setAssignVpOpen(false);
      setAssignVpStaffId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const row = accounts.find((a) => a.id === assignStaffId);
      if (!row) throw new Error("Select a staff member.");
      return updateFacultyAccountFn({
        data: {
          profileId: row.id,
          name: getStaffDisplayName(row),
          role: row.designation || STAFF_ROLE_LABELS[assignRole],
          bio: row.bio ?? undefined,
          assignedClass: null,
          staffRoleKey: assignRole,
          alsoInchargeRoleKey: null,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success("Incharge role granted.");
      setAssignOpen(false);
      setAssignStaffId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeInchargeMutation = useMutation({
    mutationFn: (row: StaffAccountRow) =>
      updateFacultyAccountFn({
        data: {
          profileId: row.id,
          name: getStaffDisplayName(row),
          role: row.designation || "Teacher",
          bio: row.bio ?? undefined,
          assignedClass: row.assigned_class ?? 1,
          staffRoleKey: "TEACHER",
          alsoInchargeRoleKey: null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success("Incharge role revoked — set back to Teacher.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <AdminLoadingState label="Loading leadership console…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load staff."}
      />
    );
  }

  const title =
    mode === "principal" ? "Principal console" : "Vice Principal console";
  const description =
    mode === "principal"
      ? "Manage your Vice Principal grant, incharges, and staff from here."
      : "Grant or revoke incharge access. You cannot change the Principal or other Vice Principals.";

  return (
    <>
      <AdminPageHeader title={title} description={description} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mode === "principal" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="size-5" />
                Vice Principal
              </CardTitle>
              <CardDescription>Grants you have given for school-wide leadership.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mode === "principal" ? (
                <Button size="sm" variant="outline" onClick={() => setAssignVpOpen(true)}>
                  Grant Vice Principal
                </Button>
              ) : null}
              {vicePrincipals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Vice Principal assigned yet.</p>
              ) : (
                vicePrincipals.map((vp) => (
                  <StaffAccessRow
                    key={vp.id}
                    row={vp}
                    busy={toggleMutation.isPending}
                    onToggle={(isActive) =>
                      toggleMutation.mutate({ profileId: vp.id, isActive })
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="size-5" />
              Incharges
            </CardTitle>
            <CardDescription>
              Category incharges for attendance, fees, academics, and operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInchargesOpen((v) => !v)}
            >
              {inchargesOpen ? "Hide list" : `View ${incharges.length} incharges`}
            </Button>
            {inchargesOpen ? (
              incharges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incharges assigned.</p>
              ) : (
                incharges.map((row) => (
                  <div key={row.id} className="space-y-2 rounded-lg border p-3">
                    <StaffAccessRow
                      row={row}
                      busy={toggleMutation.isPending || revokeInchargeMutation.isPending}
                      onToggle={(isActive) =>
                        toggleMutation.mutate({ profileId: row.id, isActive })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={revokeInchargeMutation.isPending}
                      onClick={() => revokeInchargeMutation.mutate(row)}
                    >
                      Revoke incharge → Teacher
                    </Button>
                  </div>
                ))
              )
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5" />
              Staff pool
            </CardTitle>
            <CardDescription>
              Remaining teachers and staff — assign as an incharge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setStaffOpen((v) => !v)}>
                {staffOpen ? "Hide staff" : `View ${otherStaff.length} staff`}
              </Button>
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                Assign incharge
              </Button>
            </div>
            {staffOpen ? (
              otherStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No other staff accounts.</p>
              ) : (
                otherStaff.map((row) => (
                  <StaffAccessRow
                    key={row.id}
                    row={row}
                    busy={toggleMutation.isPending}
                    onToggle={(isActive) =>
                      toggleMutation.mutate({ profileId: row.id, isActive })
                    }
                  />
                ))
              )
            ) : null}
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Signed in as {auth?.email}.{" "}
        <Link
          to="/admin/faculty-accounts"
          className="text-primary underline-offset-2 hover:underline"
        >
          Open Staff Accounts
        </Link>{" "}
        to create new logins when needed.
      </p>

      <Dialog open={assignVpOpen} onOpenChange={setAssignVpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Vice Principal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Staff member</Label>
            <Select value={assignVpStaffId} onValueChange={setAssignVpStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {otherStaff.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {getStaffDisplayName(row)} ({row.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignVpOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!assignVpStaffId || assignVpMutation.isPending}
              onClick={() => assignVpMutation.mutate()}
            >
              {assignVpMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Grant VP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign school-wide incharge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Staff member</Label>
              <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {otherStaff.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {getStaffDisplayName(row)} ({row.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Incharge role</Label>
              <Select
                value={assignRole}
                onValueChange={(value) => setAssignRole(value as StaffRoleKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCHARGE_ROLE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {STAFF_ROLE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!assignStaffId || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              {assignMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Grant role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StaffAccessRow({
  row,
  busy,
  onToggle,
}: {
  row: StaffAccountRow;
  busy: boolean;
  onToggle: (isActive: boolean) => void;
}) {
  const active = isStaffPortalActive(row);
  const role =
    row.also_incharge_role_key && row.staff_role_key
      ? `${STAFF_ROLE_LABELS[row.staff_role_key]} + ${STAFF_ROLE_LABELS[row.also_incharge_role_key]}`
      : row.staff_role_key
        ? STAFF_ROLE_LABELS[row.staff_role_key]
        : "—";

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{getStaffDisplayName(row)}</p>
        <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        <Badge variant="outline" className="mt-1">
          {role}
        </Badge>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Switch
          checked={active}
          disabled={busy}
          onCheckedChange={onToggle}
          aria-label={`Portal access for ${getStaffDisplayName(row)}`}
        />
        <span className="text-xs text-muted-foreground">{active ? "Granted" : "Revoked"}</span>
      </div>
    </div>
  );
}
