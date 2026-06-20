import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Plus, ArrowUp, ArrowDown, Upload, X, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BPA36YW2.js";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { c as cn, b as LEADERSHIP_ROLES } from "./router-RRLex1WM.js";
import { B as Badge } from "./badge-Haiyu0C5.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BBC5P21c.js";
import { I as Input } from "./input-DPHz-dCO.js";
import { L as Label } from "./label-D4ow4ujt.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DYqYGMvq.js";
import { S as Switch } from "./switch-B7Xw3ffh.js";
import { T as Textarea } from "./textarea-CcLaWU6l.js";
import { a as fetchAllFacultyMembers, u as updateFacultyMember, c as createFacultyMember, d as deleteFacultyMember, r as reorderFacultyMembers, b as uploadFacultyPhoto, e as removeFacultyPhoto } from "./faculty-Ck1rXykD.js";
import "class-variance-authority";
import "@radix-ui/react-alert-dialog";
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
import "@radix-ui/react-switch";
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
const Avatar = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Fallback,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
const ACCENT_OPTIONS = [
  { label: "Primary gradient", value: "bg-gradient-to-br from-primary to-primary-glow" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Sky", value: "bg-sky-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Rose", value: "bg-rose-500" }
];
const emptyForm = {
  name: "",
  role: "",
  bio: "",
  accent: ACCENT_OPTIONS[0].value,
  is_active: true
};
function FacultyAdmin() {
  const queryClient = useQueryClient();
  const photoInputRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [photoTarget, setPhotoTarget] = useState(null);
  const {
    data: members = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["admin", "faculty-members"],
    queryFn: fetchAllFacultyMembers
  });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-members"] });
    void queryClient.invalidateQueries({ queryKey: ["faculty-members"] });
  };
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateFacultyMember(editing.id, form);
      }
      return createFacultyMember(form);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Faculty member updated." : "Faculty member added.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message)
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFacultyMember(id),
    onSuccess: () => {
      invalidate();
      toast.success("Faculty member deleted.");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const reorderMutation = useMutation({
    mutationFn: (orderedIds) => reorderFacultyMembers(orderedIds),
    onSuccess: () => {
      invalidate();
      toast.success("Faculty order updated.");
    },
    onError: (err) => toast.error(err.message)
  });
  const photoMutation = useMutation({
    mutationFn: ({ id, file }) => uploadFacultyPhoto(id, file),
    onSuccess: () => {
      invalidate();
      toast.success("Photo uploaded.");
      setPhotoTarget(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const removePhotoMutation = useMutation({
    mutationFn: (id) => removeFacultyPhoto(id),
    onSuccess: () => {
      invalidate();
      toast.success("Photo removed.");
    },
    onError: (err) => toast.error(err.message)
  });
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name,
      role: member.role,
      bio: member.bio ?? "",
      accent: member.accent ?? ACCENT_OPTIONS[0].value,
      is_active: member.is_active
    });
    setDialogOpen(true);
  };
  const moveMember = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= members.length) return;
    const orderedIds = members.map((m) => m.id);
    [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];
    reorderMutation.mutate(orderedIds);
  };
  const handlePhotoSelect = (file) => {
    if (!photoTarget || !file) return;
    photoMutation.mutate({ id: photoTarget.id, file });
  };
  if (isLoading) return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading faculty…" });
  if (isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: error instanceof Error ? error.message : "Failed to load faculty."
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "Faculty",
        description: "Manage faculty shown on the Academics page. There is no separate public Faculty page.",
        action: /* @__PURE__ */ jsxs(Button, { onClick: openCreate, children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          "Add faculty"
        ] })
      }
    ),
    members.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-12 text-center text-sm text-muted-foreground", children: "No faculty members yet." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: members.map((member, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs(Avatar, { className: "h-14 w-14", children: [
              member.photo_url ? /* @__PURE__ */ jsx(AvatarImage, { src: member.photo_url, alt: member.name }) : null,
              /* @__PURE__ */ jsx(AvatarFallback, { className: member.accent ?? "", children: member.name.slice(0, 2).toUpperCase() })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: member.name }),
                !member.is_active && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "Hidden" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: member.role })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                disabled: index === 0 || reorderMutation.isPending,
                onClick: () => moveMember(index, -1),
                "aria-label": "Move up",
                children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "icon",
                disabled: index === members.length - 1 || reorderMutation.isPending,
                onClick: () => moveMember(index, 1),
                "aria-label": "Move down",
                children: /* @__PURE__ */ jsx(ArrowDown, { className: "size-4" })
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setPhotoTarget(member);
                  photoInputRef.current?.click();
                },
                children: [
                  /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
                  member.photo_url ? "Replace photo" : "Upload photo"
                ]
              }
            ),
            member.photo_url && /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                disabled: removePhotoMutation.isPending,
                onClick: () => removePhotoMutation.mutate(member.id),
                children: [
                  /* @__PURE__ */ jsx(X, { className: "size-4" }),
                  "Remove photo"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => openEdit(member), children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
              "Edit"
            ] }),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setDeleteTarget(member), children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
              "Delete"
            ] })
          ] })
        ]
      },
      member.id
    )) }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: photoInputRef,
        type: "file",
        accept: "image/*",
        className: "hidden",
        onChange: (e) => {
          handlePhotoSelect(e.target.files?.[0]);
          e.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editing ? "Edit faculty member" : "Add faculty member" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-name", children: "Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "faculty-name",
              value: form.name,
              onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-role", children: "Role" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "faculty-role",
              list: "faculty-role-options",
              value: form.role,
              onChange: (e) => setForm((prev) => ({ ...prev, role: e.target.value }))
            }
          ),
          /* @__PURE__ */ jsx("datalist", { id: "faculty-role-options", children: LEADERSHIP_ROLES.map((role) => /* @__PURE__ */ jsx("option", { value: role }, role)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-bio", children: "Bio" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              id: "faculty-bio",
              rows: 3,
              value: form.bio ?? "",
              onChange: (e) => setForm((prev) => ({ ...prev, bio: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Avatar color" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: form.accent ?? ACCENT_OPTIONS[0].value,
              onValueChange: (value) => setForm((prev) => ({ ...prev, accent: value })),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: ACCENT_OPTIONS.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md border p-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-active", children: "Visible on Academics page" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Inactive members are hidden publicly." })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "faculty-active",
              checked: form.is_active ?? true,
              onCheckedChange: (checked) => setForm((prev) => ({ ...prev, is_active: checked }))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            disabled: !form.name.trim() || !form.role.trim() || saveMutation.isPending,
            onClick: () => saveMutation.mutate(),
            children: editing ? "Save changes" : "Add faculty"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete faculty member?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
          "This removes ",
          deleteTarget?.name,
          " from the Academics page roster."
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
  FacultyAdmin
};
