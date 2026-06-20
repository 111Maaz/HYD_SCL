import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BPA36YW2.js";
import { B as Badge } from "./badge-Haiyu0C5.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BBC5P21c.js";
import { I as Input } from "./input-DPHz-dCO.js";
import { L as Label } from "./label-D4ow4ujt.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-D2npA1Cz.js";
import { T as Textarea } from "./textarea-CcLaWU6l.js";
import { u as useAuth } from "./router-RRLex1WM.js";
import { fetchOwnFacultyProfile, fetchFacultyClassMaterials, uploadFacultyClassMaterial, deleteFacultyClassMaterial } from "./faculty-portal-DwDCZHH7.js";
import "class-variance-authority";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@tanstack/react-router";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "./auth-D8LBsNTn.js";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "zod";
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
const emptyForm = {
  title: "",
  subject: "",
  description: ""
};
function FacultyMaterialsView() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pendingFile, setPendingFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const profileQuery = useQuery({
    queryKey: ["faculty", "profile", auth?.userId],
    queryFn: () => fetchOwnFacultyProfile(auth.userId),
    enabled: !!auth?.userId
  });
  const assignedClass = profileQuery.data?.assigned_class;
  const materialsQuery = useQuery({
    queryKey: ["faculty", "materials", assignedClass],
    queryFn: () => fetchFacultyClassMaterials(assignedClass),
    enabled: assignedClass != null
  });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["faculty", "materials"] });
    void queryClient.invalidateQueries({ queryKey: ["class-materials"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "class-materials"] });
  };
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!pendingFile) throw new Error("Choose a file to upload.");
      if (!auth?.userId || assignedClass == null) {
        throw new Error("Profile not loaded.");
      }
      return uploadFacultyClassMaterial(pendingFile, form, auth.userId, assignedClass);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Material uploaded.");
      setDialogOpen(false);
      setForm(emptyForm);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => toast.error(err.message)
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (!auth?.userId) throw new Error("Not signed in.");
      return deleteFacultyClassMaterial(id, auth.userId);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Material deleted.");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message)
  });
  if (profileQuery.isLoading || materialsQuery.isLoading) {
    return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading class materials…" });
  }
  if (profileQuery.isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: profileQuery.error instanceof Error ? profileQuery.error.message : "Failed to load your profile."
      }
    );
  }
  if (materialsQuery.isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: materialsQuery.error instanceof Error ? materialsQuery.error.message : "Failed to load class materials."
      }
    );
  }
  const materials = materialsQuery.data ?? [];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "My Class Materials",
        description: `Upload and manage materials for Class ${assignedClass}. You can delete only materials you uploaded.`,
        action: /* @__PURE__ */ jsxs(Button, { onClick: () => setDialogOpen(true), children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          "Upload material"
        ] })
      }
    ),
    materials.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "py-12 text-center text-sm text-muted-foreground", children: [
      "No materials for Class ",
      assignedClass,
      " yet. Upload your first file above."
    ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Title" }),
        /* @__PURE__ */ jsx(TableHead, { className: "hidden sm:table-cell", children: "Subject" }),
        /* @__PURE__ */ jsx(TableHead, { children: "File" }),
        /* @__PURE__ */ jsx(TableHead, { className: "hidden md:table-cell", children: "Updated" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: materials.map((material) => {
        const isOwn = material.uploaded_by === auth?.userId;
        return /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsx("span", { children: material.title }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground sm:hidden", children: material.subject })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "hidden sm:table-cell", children: material.subject }),
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
          /* @__PURE__ */ jsx(TableCell, { className: "hidden text-sm text-muted-foreground md:table-cell", children: format(new Date(material.updated_at), "dd MMM yyyy") }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: isOwn ? /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setDeleteTarget(material),
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Delete" })
              ]
            }
          ) : /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: "Admin" }) })
        ] }, material.id);
      }) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Upload class material" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Materials will be published for ",
          /* @__PURE__ */ jsxs("strong", { children: [
            "Class ",
            assignedClass
          ] }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-material-title", children: "Title" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "faculty-material-title",
              value: form.title,
              onChange: (e) => setForm((prev) => ({ ...prev, title: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-material-subject", children: "Subject" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "faculty-material-subject",
              value: form.subject,
              onChange: (e) => setForm((prev) => ({ ...prev, subject: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-material-description", children: "Description" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "faculty-material-description",
              rows: 3,
              value: form.description ?? "",
              onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "File" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              ref: fileInputRef,
              type: "file",
              className: "cursor-pointer file:mr-3 file:cursor-pointer",
              onChange: (e) => setPendingFile(e.target.files?.[0] ?? null)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            disabled: !form.title.trim() || !form.subject.trim() || !pendingFile || uploadMutation.isPending,
            onClick: () => uploadMutation.mutate(),
            children: "Upload"
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
  FacultyMaterialsView
};
