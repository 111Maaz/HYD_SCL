import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Mail } from "lucide-react";
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
  fetchContactEnquiries,
  updateContactNotes,
  updateContactStatus,
} from "@/services/contact";
import { CONTACT_STATUSES, type ContactEnquiry, type ContactStatus } from "@/types/contact";

const STATUS_VARIANT: Record<ContactStatus, "default" | "secondary" | "outline"> = {
  New: "default",
  Contacted: "secondary",
  Resolved: "outline",
};

export function ContactEnquiriesAdmin() {
  const queryClient = useQueryClient();
  const [notesEnquiry, setNotesEnquiry] = useState<ContactEnquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const {
    data: enquiries = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "contact-enquiries"],
    queryFn: fetchContactEnquiries,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      updateContactStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "contact-enquiries"] });
      toast.success("Contact status updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      updateContactNotes(id, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "contact-enquiries"] });
      toast.success("Notes saved.");
      setNotesEnquiry(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openNotes = (enquiry: ContactEnquiry) => {
    setNotesEnquiry(enquiry);
    setNotesDraft(enquiry.notes ?? "");
  };

  if (isLoading) return <AdminLoadingState label="Loading contact messages…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load contact messages."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Contact messages"
        description="Messages submitted from the public contact form."
      />

      {enquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <Mail className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium">No contact messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submissions from the website contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((enquiry) => (
                <TableRow key={enquiry.id}>
                  <TableCell>
                    <div className="font-medium">{enquiry.name}</div>
                    <div className="text-xs text-muted-foreground">{enquiry.email}</div>
                  </TableCell>
                  <TableCell>{enquiry.subject}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {enquiry.message}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={enquiry.status}
                      onValueChange={(value) =>
                        statusMutation.mutate({ id: enquiry.id, status: value as ContactStatus })
                      }
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue>
                          <Badge variant={STATUS_VARIANT[enquiry.status]}>{enquiry.status}</Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(enquiry.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openNotes(enquiry)}>
                      {enquiry.notes ? "Edit notes" : "Add notes"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!notesEnquiry} onOpenChange={(open) => !open && setNotesEnquiry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact notes</DialogTitle>
          </DialogHeader>
          {notesEnquiry && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {notesEnquiry.name} — {notesEnquiry.subject}
              </p>
              <div className="rounded-md bg-muted p-3 text-sm">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <p className="mt-1 whitespace-pre-wrap">{notesEnquiry.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-notes">Internal notes</Label>
                <Textarea
                  id="contact-notes"
                  rows={5}
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  placeholder="Follow-up actions, reply sent, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesEnquiry(null)}>
              Cancel
            </Button>
            <Button
              disabled={notesMutation.isPending || !notesEnquiry}
              onClick={() =>
                notesEnquiry &&
                notesMutation.mutate({ id: notesEnquiry.id, notes: notesDraft || null })
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
