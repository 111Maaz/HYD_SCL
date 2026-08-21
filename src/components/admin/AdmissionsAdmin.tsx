import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { matchClassYearForGrade } from "@/lib/admission-grade";
import {
  convertAdmissionEnquiryToStudent,
} from "@/services/admission-conversion";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import { fetchActiveAcademicYear } from "@/services/academic-years";
import {
  fetchAdmissionLeads,
  updateAdmissionNotes,
  updateAdmissionStatus,
} from "@/services/admissions";
import { suggestNextRollNumber } from "@/services/enrollments";
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
  const [convertLead, setConvertLead] = useState<AdmissionEnquiry | null>(null);
  const [convertClassYearId, setConvertClassYearId] = useState("");
  const [convertSectionId, setConvertSectionId] = useState("");
  const [convertRollNumber, setConvertRollNumber] = useState("");
  const [convertAdmissionDate, setConvertAdmissionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [convertDateOfBirth, setConvertDateOfBirth] = useState("");
  const [convertGender, setConvertGender] = useState("");

  const { data: activeYear } = useQuery({
    queryKey: ["admin", "active-academic-year"],
    queryFn: fetchActiveAcademicYear,
  });

  const { data: classYears = [] } = useQuery({
    queryKey: ["admin", "class-years", activeYear?.id],
    queryFn: () => fetchClassYearsWithDetails(activeYear!.id),
    enabled: Boolean(activeYear?.id) && Boolean(convertLead),
  });

  const convertSections = useMemo(() => {
    if (!convertClassYearId) return [];
    const classYear = classYears.find((row) => row.id === convertClassYearId);
    return classYear?.sections.filter((section) => section.active) ?? [];
  }, [classYears, convertClassYearId]);

  useEffect(() => {
    if (!convertLead || classYears.length === 0) return;
    const match = matchClassYearForGrade(convertLead.grade, classYears);
    setConvertClassYearId(match?.id ?? "");
  }, [classYears, convertLead]);

  useEffect(() => {
    if (!convertLead || !activeYear?.id || !convertSectionId) return;

    let cancelled = false;
    void suggestNextRollNumber(activeYear.id, convertSectionId).then((roll) => {
      if (!cancelled) {
        setConvertRollNumber((current) => current || String(roll));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeYear?.id, convertLead, convertSectionId]);

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

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!convertLead || !activeYear?.id) {
        throw new Error("Active academic year is required.");
      }

      return convertAdmissionEnquiryToStudent({
        enquiryId: convertLead.id,
        academicYearId: activeYear.id,
        classYearId: convertClassYearId,
        sectionId: convertSectionId,
        rollNumber: convertRollNumber.trim() ? Number(convertRollNumber) : null,
        admissionDate: convertAdmissionDate,
        dateOfBirth: convertDateOfBirth || null,
        gender: convertGender || null,
      });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "admission-leads"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "enrollments"] });
      toast.success(`Student ${result.student.student_number} created and enrolled.`);
      setConvertLead(null);
      setConvertClassYearId("");
      setConvertSectionId("");
      setConvertRollNumber("");
      setConvertDateOfBirth("");
      setConvertGender("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openNotes = (lead: AdmissionEnquiry) => {
    setNotesLead(lead);
    setNotesDraft(lead.notes ?? "");
  };

  const openConvert = (lead: AdmissionEnquiry) => {
    setConvertLead(lead);
    setConvertClassYearId("");
    setConvertSectionId("");
    setConvertRollNumber("");
    setConvertAdmissionDate(new Date().toISOString().slice(0, 10));
    setConvertDateOfBirth("");
    setConvertGender("");
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
        description="View enquiry leads, convert to students, update status, and add internal notes."
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
                    <div className="flex justify-end gap-2">
                      {lead.status !== "Enrolled" && lead.status !== "Rejected" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openConvert(lead)}
                          disabled={!activeYear}
                        >
                          <UserPlus className="size-4" />
                          Convert
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openNotes(lead)}>
                        {lead.notes ? "Edit notes" : "Add notes"}
                      </Button>
                    </div>
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

      <Dialog open={!!convertLead} onOpenChange={(open) => !open && setConvertLead(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Convert to student</DialogTitle>
          </DialogHeader>
          {convertLead && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">{convertLead.student_name}</p>
                <p className="text-muted-foreground">
                  Parent: {convertLead.parent_name} · Grade: {convertLead.grade}
                </p>
                <p className="text-muted-foreground">
                  {convertLead.email} · {convertLead.phone}
                </p>
              </div>

              {!activeYear ? (
                <p className="text-sm text-destructive">
                  No active academic year. Set one under Academic Years before converting.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Academic year</Label>
                    <Input value={`${activeYear.name} (Active)`} disabled />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select
                        value={convertClassYearId || "unset"}
                        onValueChange={(value) => {
                          setConvertClassYearId(value === "unset" ? "" : value);
                          setConvertSectionId("");
                          setConvertRollNumber("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classYears.map((classYear) => (
                            <SelectItem key={classYear.id} value={classYear.id}>
                              {classYear.class.class_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select
                        value={convertSectionId || "unset"}
                        onValueChange={(value) => {
                          setConvertSectionId(value === "unset" ? "" : value);
                          setConvertRollNumber("");
                        }}
                        disabled={!convertClassYearId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {convertSections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.section_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convert-roll">Roll number</Label>
                      <Input
                        id="convert-roll"
                        type="number"
                        min={1}
                        value={convertRollNumber}
                        onChange={(event) => setConvertRollNumber(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convert-admission-date">Admission date</Label>
                      <Input
                        id="convert-admission-date"
                        type="date"
                        value={convertAdmissionDate}
                        onChange={(event) => setConvertAdmissionDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convert-dob">Date of birth</Label>
                      <Input
                        id="convert-dob"
                        type="date"
                        value={convertDateOfBirth}
                        onChange={(event) => setConvertDateOfBirth(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={convertGender || "unset"}
                        onValueChange={(value) =>
                          setConvertGender(value === "unset" ? "" : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Not specified</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertLead(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                convertMutation.isPending ||
                !convertLead ||
                !activeYear ||
                !convertClassYearId ||
                !convertSectionId
              }
              onClick={() => convertMutation.mutate()}
            >
              {convertMutation.isPending ? "Converting…" : "Create student & enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
