import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BPA36YW2.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BBC5P21c.js";
import { I as Input } from "./input-DPHz-dCO.js";
import { L as Label } from "./label-D4ow4ujt.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DYqYGMvq.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-D2npA1Cz.js";
import { T as Textarea } from "./textarea-CcLaWU6l.js";
import { C as CLASS_NUMBERS } from "./class-materials-DdBz_lhb.js";
import { a as fetchAllClassMaterials, u as updateClassMaterial, r as replaceClassMaterialFile, b as uploadClassMaterial, d as deleteClassMaterial } from "./class-materials-D0EwlyBb.js";
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
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
const emptyForm = {
  class_number: 1,
  title: "",
  subject: "",
  description: ""
};
function ClassMaterialsAdmin() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [classFilter, setClassFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingFile, setPendingFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const {
    data: materials = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["admin", "class-materials"],
    queryFn: fetchAllClassMaterials
  });
  const filtered = classFilter === "all" ? materials : materials.filter((m) => m.class_number === Number(classFilter));
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "class-materials"] });
    void queryClient.invalidateQueries({ queryKey: ["class-materials"] });
  };
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const updated = await updateClassMaterial(editing.id, form);
        if (pendingFile) {
          return replaceClassMaterialFile(editing.id, pendingFile);
        }
        return updated;
      }
      if (!pendingFile) throw new Error("Choose a file to upload.");
      return uploadClassMaterial(pendingFile, form);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Material updated." : "Material uploaded.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setPendingFile(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteClassMaterial(id),
    onSuccess: () => {
      invalidate();
      toast.success("Material deleted.");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      class_number: classFilter === "all" ? 1 : Number(classFilter)
    });
    setPendingFile(null);
    setDialogOpen(true);
  };
  const openEdit = (material) => {
    setEditing(material);
    setForm({
      class_number: material.class_number,
      title: material.title,
      subject: material.subject,
      description: material.description
    });
    setPendingFile(null);
    setDialogOpen(true);
  };
  if (isLoading) return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading class materials…" });
  if (isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: error instanceof Error ? error.message : "Failed to load class materials."
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "Class Materials",
        description: "Upload, edit, and delete materials for the Students page.",
        action: /* @__PURE__ */ jsxs(Button, { onClick: openCreate, children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          "Upload material"
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "class-filter", children: "Filter by class" }),
      /* @__PURE__ */ jsxs(Select, { value: classFilter, onValueChange: setClassFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { id: "class-filter", className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All classes" }),
          CLASS_NUMBERS.map((num) => /* @__PURE__ */ jsxs(SelectItem, { value: String(num), children: [
            "Class ",
            num
          ] }, num))
        ] })
      ] })
    ] }),
    filtered.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "py-12 text-center text-sm text-muted-foreground", children: [
      "No materials",
      classFilter !== "all" ? ` for class ${classFilter}` : "",
      "."
    ] }) : /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Class" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Title" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Subject" }),
        /* @__PURE__ */ jsx(TableHead, { children: "File" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Updated" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: filtered.map((material) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxs(TableCell, { children: [
          "Class ",
          material.class_number
        ] }),
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: material.title }),
        /* @__PURE__ */ jsx(TableCell, { children: material.subject }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
          "a",
          {
            href: material.file_url,
            target: "_blank",
            rel: "noreferrer",
            className: "text-sm text-primary hover:underline",
            children: material.file_name
          }
        ) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground", children: format(new Date(material.updated_at), "dd MMM yyyy") }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => openEdit(material), children: [
            /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
            "Edit"
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setDeleteTarget(material), children: [
            /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
            "Delete"
          ] })
        ] }) })
      ] }, material.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editing ? "Edit class material" : "Upload class material" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Class" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: String(form.class_number),
              onValueChange: (value) => setForm((prev) => ({ ...prev, class_number: Number(value) })),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: CLASS_NUMBERS.map((num) => /* @__PURE__ */ jsxs(SelectItem, { value: String(num), children: [
                  "Class ",
                  num
                ] }, num)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "material-title", children: "Title" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "material-title",
              value: form.title,
              onChange: (e) => setForm((prev) => ({ ...prev, title: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "material-subject", children: "Subject" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "material-subject",
              value: form.subject,
              onChange: (e) => setForm((prev) => ({ ...prev, subject: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "material-description", children: "Description" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "material-description",
              rows: 3,
              value: form.description ?? "",
              onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { children: [
            "File ",
            editing ? "(optional — replace existing)" : ""
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              ref: fileInputRef,
              type: "file",
              className: "cursor-pointer file:mr-3 file:cursor-pointer",
              onChange: (e) => setPendingFile(e.target.files?.[0] ?? null)
            }
          ),
          editing && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Current: ",
            editing.file_name
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            disabled: !form.title.trim() || !form.subject.trim() || !editing && !pendingFile || saveMutation.isPending,
            onClick: () => saveMutation.mutate(),
            children: editing ? "Save changes" : "Upload"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete class material?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
          "This removes “",
          deleteTarget?.title,
          "” from the Students page."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            onClick: () => deleteTarget && deleteMutation.mutate(deleteTarget.id),
            children: "Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  ClassMaterialsAdmin
};
