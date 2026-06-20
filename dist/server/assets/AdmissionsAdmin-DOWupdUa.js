import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { B as Badge } from "./badge-Haiyu0C5.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BBC5P21c.js";
import { L as Label } from "./label-D4ow4ujt.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DYqYGMvq.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-D2npA1Cz.js";
import { T as Textarea } from "./textarea-CcLaWU6l.js";
import { f as fetchAdmissionLeads, u as updateAdmissionStatus, a as updateAdmissionNotes } from "./admissions-DyzaJEll.js";
import "lucide-react";
import "class-variance-authority";
import "./router-RRLex1WM.js";
import "@tanstack/react-router";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
import "@radix-ui/react-slot";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "./supabase-pxAHMEVs.js";
const ADMISSION_STATUSES = [
  "New",
  "Contacted",
  "Visit Scheduled",
  "Enrolled",
  "Rejected"
];
const STATUS_VARIANT = {
  New: "default",
  Contacted: "secondary",
  "Visit Scheduled": "outline",
  Enrolled: "default",
  Rejected: "destructive"
};
function AdmissionsAdmin() {
  const queryClient = useQueryClient();
  const [notesLead, setNotesLead] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const {
    data: leads = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["admin", "admission-leads"],
    queryFn: fetchAdmissionLeads
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateAdmissionStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "admission-leads"] });
      toast.success("Lead status updated.");
    },
    onError: (err) => toast.error(err.message)
  });
  const notesMutation = useMutation({
    mutationFn: ({ id, notes }) => updateAdmissionNotes(id, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "admission-leads"] });
      toast.success("Notes saved.");
      setNotesLead(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const openNotes = (lead) => {
    setNotesLead(lead);
    setNotesDraft(lead.notes ?? "");
  };
  if (isLoading) return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading leads…" });
  if (isError) {
    return /* @__PURE__ */ jsx(AdminErrorState, { message: error instanceof Error ? error.message : "Failed to load leads." });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "Admissions",
        description: "View enquiry leads, update status, and add internal notes."
      }
    ),
    leads.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-12 text-center text-sm text-muted-foreground", children: "No admission leads yet." }) : /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Parent" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Student" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Grade" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Contact" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Submitted" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: leads.map((lead) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: lead.parent_name }),
        /* @__PURE__ */ jsx(TableCell, { children: lead.student_name }),
        /* @__PURE__ */ jsx(TableCell, { children: lead.grade }),
        /* @__PURE__ */ jsxs(TableCell, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm", children: lead.email }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: lead.phone })
        ] }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
          Select,
          {
            value: lead.status,
            onValueChange: (value) => statusMutation.mutate({ id: lead.id, status: value }),
            disabled: statusMutation.isPending,
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, { children: /* @__PURE__ */ jsx(Badge, { variant: STATUS_VARIANT[lead.status], children: lead.status }) }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ADMISSION_STATUSES.map((status) => /* @__PURE__ */ jsx(SelectItem, { value: status, children: status }, status)) })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground", children: format(new Date(lead.created_at), "dd MMM yyyy") }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => openNotes(lead), children: lead.notes ? "Edit notes" : "Add notes" }) })
      ] }, lead.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!notesLead, onOpenChange: (open) => !open && setNotesLead(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Lead notes" }) }),
      notesLead && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          notesLead.parent_name,
          " — ",
          notesLead.student_name,
          " (",
          notesLead.grade,
          ")"
        ] }),
        notesLead.message && /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-muted p-3 text-sm", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Enquiry message" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1", children: notesLead.message })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "lead-notes", children: "Internal notes" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "lead-notes",
              rows: 5,
              value: notesDraft,
              onChange: (e) => setNotesDraft(e.target.value),
              placeholder: "Call back details, visit date, follow-up actions…"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setNotesLead(null), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            disabled: notesMutation.isPending || !notesLead,
            onClick: () => notesLead && notesMutation.mutate({ id: notesLead.id, notes: notesDraft || null }),
            children: "Save notes"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  AdmissionsAdmin
};
