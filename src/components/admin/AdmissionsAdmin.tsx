import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
  fetchAdmissionLeads,
  updateAdmissionNotes,
  updateAdmissionStatus,
} from "@/services/admissions";
import { ADMISSION_STATUSES, type AdmissionEnquiry, type AdmissionStatus } from "@/types/database";

const STATUS_VARIANT: Record<AdmissionStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    New: "default",
    Contacted: "secondary",
    "Visit Scheduled": "outline",
    Enrolled: "default",
    Rejected: "destructive",
  };

export function AdmissionsAdmin() {
  const queryClient = useQueryClient();
  const [notesLead, setNotesLead] = useState<AdmissionEnquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "admission-leads"],
    queryFn: fetchAdmissionLeads,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdmissionStatus }) =>
      updateAdmissionStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "admission-leads"] });
      toast.success("Lead status updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      updateAdmissionNotes(id, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "admission-leads"] });
      toast.success("Notes saved.");
      setNotesLead(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openNotes = (lead: AdmissionEnquiry) => {
    setNotesLead(lead);
    setNotesDraft(lead.notes ?? "");
  };

  if (isLoading) return <AdminLoadingState label="Loading leads…" />;
  if (isError) {
    return (
      <AdminErrorState message={error instanceof Error ? error.message : "Failed to load leads."} />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Admissions"
        description="View enquiry leads, update status, and add internal notes."
      />

      {leads.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No admission leads yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.parent_name}</TableCell>
                  <TableCell>{lead.student_name}</TableCell>
                  <TableCell>{lead.grade}</TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.email}</div>
                    <div className="text-xs text-muted-foreground">{lead.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) =>
                        statusMutation.mutate({ id: lead.id, status: value as AdmissionStatus })
                      }
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue>
                          <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ADMISSION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openNotes(lead)}>
                      {lead.notes ? "Edit notes" : "Add notes"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!notesLead} onOpenChange={(open) => !open && setNotesLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead notes</DialogTitle>
          </DialogHeader>
          {notesLead && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {notesLead.parent_name} — {notesLead.student_name} ({notesLead.grade})
              </p>
              {notesLead.message && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <Label className="text-xs text-muted-foreground">Enquiry message</Label>
                  <p className="mt-1">{notesLead.message}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="lead-notes">Internal notes</Label>
                <Textarea
                  id="lead-notes"
                  rows={5}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Call back details, visit date, follow-up actions…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesLead(null)}>
              Cancel
            </Button>
            <Button
              disabled={notesMutation.isPending || !notesLead}
              onClick={() =>
                notesLead && notesMutation.mutate({ id: notesLead.id, notes: notesDraft || null })
              }
            >
              Save notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
