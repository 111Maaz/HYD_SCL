import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";
import { useState } from "react";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
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
import { fetchAuditLogs } from "@/services/audit";
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, type AuditAction } from "@/types/audit";

const AUDITED_TABLES = [
  "students",
  "enrollments",
  "attendance_records",
  "fee_charges",
  "fee_payments",
  "staff_profiles",
];

export function AuditAdmin() {
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const {
    data: logs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "audit-logs", tableFilter, actionFilter],
    queryFn: () =>
      fetchAuditLogs({
        tableName: tableFilter || undefined,
        action: (actionFilter as AuditAction) || undefined,
        limit: 200,
      }),
  });

  if (isLoading) return <AdminLoadingState label="Loading audit logs…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load audit logs."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Audit centre"
        description="Read-only trail of sensitive changes across students, fees, attendance, and staff."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label>Table</Label>
          <Select value={tableFilter || "all"} onValueChange={(v) => setTableFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {AUDITED_TABLES.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Action</Label>
          <Select
            value={actionFilter || "all"}
            onValueChange={(v) => setActionFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <ScrollText className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">No audit entries</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes to protected tables will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{AUDIT_ACTION_LABELS[log.action]}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.table_name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.record_id ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
