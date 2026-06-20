import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { UserPlus, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { B as Badge } from "./badge-Haiyu0C5.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BBC5P21c.js";
import { I as Input } from "./input-DPHz-dCO.js";
import { L as Label } from "./label-D4ow4ujt.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DYqYGMvq.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-D2npA1Cz.js";
import { T as Textarea } from "./textarea-CcLaWU6l.js";
import { S as Switch } from "./switch-B7Xw3ffh.js";
import { T as TSS_SERVER_FUNCTION, b as getServerFnById, a as createServerFn } from "./server-CTgP5hRF.js";
import { z } from "zod";
import { C as CLASS_NUMBERS } from "./class-materials-DdBz_lhb.js";
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
import "@radix-ui/react-slot";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "@radix-ui/react-switch";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const createFacultyAccountSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(1e3).optional(),
  assignedClass: z.number().int().min(1).max(10)
});
const updateFacultyAccountSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(1e3).optional(),
  assignedClass: z.number().int().min(1).max(10)
});
const createFacultyAccountFn = createServerFn({
  method: "POST"
}).validator(createFacultyAccountSchema).handler(createSsrRpc("33b996b78531eefef8ec57723034c1a97c5aa086a7830a59161b7409824c2f0c"));
const listFacultyProfilesFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("b86643597b5a0294163b92bbc87d868831b3f7ce1807f17d35cffa90c12daf72"));
const updateFacultyAccountFn = createServerFn({
  method: "POST"
}).validator(updateFacultyAccountSchema).handler(createSsrRpc("69ae95ec14be7f2ae1c1c73f62e03de987970a0bb9e933871d7e4b425d3be20d"));
const setFacultyAccountActiveSchema = z.object({
  profileId: z.string().uuid(),
  isActive: z.boolean()
});
const setFacultyAccountActiveFn = createServerFn({
  method: "POST"
}).validator(setFacultyAccountActiveSchema).handler(createSsrRpc("82d6c29553d24ad7ed16aba161b29fbaf1d5ce58f395bab1cb92b38cfb8f9da4"));
const emptyForm = {
  email: "",
  password: "",
  name: "",
  role: "",
  bio: "",
  assignedClass: 1
};
const emptyEditForm = {
  name: "",
  role: "",
  bio: "",
  assignedClass: 1
};
function FacultyAccountsAdmin() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const {
    data: accounts = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["admin", "faculty-accounts"],
    queryFn: () => listFacultyProfilesFn()
  });
  const createMutation = useMutation({
    mutationFn: (input) => createFacultyAccountFn({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success("Faculty account created. They can sign in at the staff login page.");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create faculty account.");
    }
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({ profileId, isActive }) => setFacultyAccountActiveFn({ data: { profileId, isActive } }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success(
        profile.is_active ? `${profile.name} can sign in to the faculty portal again.` : `${profile.name}'s portal access has been temporarily disabled.`
      );
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update faculty account status.");
    }
  });
  const updateMutation = useMutation({
    mutationFn: (input) => updateFacultyAccountFn({ data: input }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "faculty-accounts"] });
      toast.success(`Updated ${profile.name}'s faculty account.`);
      setEditDialogOpen(false);
      setEditing(null);
      setEditForm(emptyEditForm);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update faculty account.");
    }
  });
  const openEdit = (account) => {
    setEditing(account);
    setEditForm({
      name: account.name,
      role: account.role,
      bio: account.bio ?? "",
      assignedClass: account.assigned_class
    });
    setEditDialogOpen(true);
  };
  if (isLoading) return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading faculty accounts…" });
  if (isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: error instanceof Error ? error.message : "Failed to load faculty accounts."
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "Faculty portal accounts",
        description: "Create login credentials and assign each teacher to a class for the faculty portal.",
        action: /* @__PURE__ */ jsxs(Button, { onClick: () => setDialogOpen(true), children: [
          /* @__PURE__ */ jsx(UserPlus, { className: "size-4" }),
          "Add faculty account"
        ] })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "rounded-xl border bg-card", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Role / subject" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Class" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Portal access" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-[100px]", children: "Actions" }),
        /* @__PURE__ */ jsx(TableHead, { className: "hidden lg:table-cell", children: "User ID" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: accounts.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "py-10 text-center text-muted-foreground", children: "No faculty portal accounts yet. Create one to enable staff login." }) }) : accounts.map((account) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          account.name,
          account.is_active === false && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "Disabled" })
        ] }) }),
        /* @__PURE__ */ jsx(TableCell, { children: account.role }),
        /* @__PURE__ */ jsxs(TableCell, { children: [
          "Class ",
          account.assigned_class
        ] }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: account.is_active !== false,
              disabled: toggleActiveMutation.isPending,
              onCheckedChange: (checked) => toggleActiveMutation.mutate({
                profileId: account.id,
                isActive: checked
              }),
              "aria-label": `Portal access for ${account.name}`
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: account.is_active !== false ? "Active" : "Off" })
        ] }) }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => openEdit(account),
            "aria-label": `Edit ${account.name}`,
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
              "Edit"
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(TableCell, { className: "hidden font-mono text-xs text-muted-foreground lg:table-cell", children: account.user_id })
      ] }, account.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Create faculty account" }) }),
      /* @__PURE__ */ jsxs(
        "form",
        {
          className: "space-y-4",
          onSubmit: (event) => {
            event.preventDefault();
            createMutation.mutate(form);
          },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-name", children: "Full name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "faculty-name",
                    value: form.name,
                    onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })),
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-email", children: "Email (login)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "faculty-email",
                    type: "email",
                    autoComplete: "off",
                    value: form.email,
                    onChange: (event) => setForm((prev) => ({ ...prev, email: event.target.value })),
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-password", children: "Temporary password" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "faculty-password",
                    type: "password",
                    autoComplete: "new-password",
                    value: form.password,
                    onChange: (event) => setForm((prev) => ({ ...prev, password: event.target.value })),
                    required: true,
                    minLength: 6
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-role", children: "Role / subject" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "faculty-role",
                    value: form.role,
                    onChange: (event) => setForm((prev) => ({ ...prev, role: event.target.value })),
                    placeholder: "e.g. Class Teacher — Mathematics",
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Assigned class" }),
                /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: String(form.assignedClass),
                    onValueChange: (value) => setForm((prev) => ({ ...prev, assignedClass: Number(value) })),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsx(SelectContent, { children: CLASS_NUMBERS.map((classNumber) => /* @__PURE__ */ jsxs(SelectItem, { value: String(classNumber), children: [
                        "Class ",
                        classNumber
                      ] }, classNumber)) })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "faculty-bio", children: "Bio (optional)" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    id: "faculty-bio",
                    rows: 3,
                    value: form.bio ?? "",
                    onChange: (event) => setForm((prev) => ({ ...prev, bio: event.target.value }))
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setDialogOpen(false), children: "Cancel" }),
              /* @__PURE__ */ jsx(Button, { type: "submit", disabled: createMutation.isPending, children: createMutation.isPending ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }),
                "Creating…"
              ] }) : "Create account" })
            ] })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(
      Dialog,
      {
        open: editDialogOpen,
        onOpenChange: (open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditing(null);
            setEditForm(emptyEditForm);
          }
        },
        children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Edit faculty account" }) }),
          /* @__PURE__ */ jsxs(
            "form",
            {
              className: "space-y-4",
              onSubmit: (event) => {
                event.preventDefault();
                if (!editing) return;
                updateMutation.mutate({
                  profileId: editing.id,
                  ...editForm
                });
              },
              children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "edit-faculty-name", children: "Full name" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "edit-faculty-name",
                        value: editForm.name,
                        onChange: (event) => setEditForm((prev) => ({ ...prev, name: event.target.value })),
                        required: true
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "edit-faculty-role", children: "Role / subject" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "edit-faculty-role",
                        value: editForm.role,
                        onChange: (event) => setEditForm((prev) => ({ ...prev, role: event.target.value })),
                        placeholder: "e.g. Class Teacher — Mathematics",
                        required: true
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { children: "Assigned class" }),
                    /* @__PURE__ */ jsxs(
                      Select,
                      {
                        value: String(editForm.assignedClass),
                        onValueChange: (value) => setEditForm((prev) => ({ ...prev, assignedClass: Number(value) })),
                        children: [
                          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                          /* @__PURE__ */ jsx(SelectContent, { children: CLASS_NUMBERS.map((classNumber) => /* @__PURE__ */ jsxs(SelectItem, { value: String(classNumber), children: [
                            "Class ",
                            classNumber
                          ] }, classNumber)) })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "edit-faculty-bio", children: "Bio (optional)" }),
                    /* @__PURE__ */ jsx(
                      Textarea,
                      {
                        id: "edit-faculty-bio",
                        rows: 3,
                        value: editForm.bio ?? "",
                        onChange: (event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))
                      }
                    )
                  ] })
                ] }),
                editing && editForm.assignedClass !== editing.assigned_class && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Changing class updates portal upload access. Materials already uploaded for the previous class stay on the Students page; only an admin can remove them from Class Materials." }),
                /* @__PURE__ */ jsxs(DialogFooter, { children: [
                  /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setEditDialogOpen(false), children: "Cancel" }),
                  /* @__PURE__ */ jsx(Button, { type: "submit", disabled: updateMutation.isPending, children: updateMutation.isPending ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }),
                    "Saving…"
                  ] }) : "Save changes" })
                ] })
              ]
            }
          )
        ] })
      }
    )
  ] });
}
export {
  FacultyAccountsAdmin
};
