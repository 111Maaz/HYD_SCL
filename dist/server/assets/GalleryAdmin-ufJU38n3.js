import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { a as AdminLoadingState, b as AdminErrorState, A as AdminPageHeader } from "./AdminPageHeader-VufH8NeX.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BPA36YW2.js";
import { B as Button } from "./button-Q0ssrFUP.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-BBC5P21c.js";
import { I as Input } from "./input-DPHz-dCO.js";
import { L as Label } from "./label-D4ow4ujt.js";
import { a as fetchAllGalleryImages, u as uploadGalleryImage, d as deleteGalleryImage, r as reorderGalleryImages, i as isGalleryVideoUrl } from "./gallery-ul5uf7Zm.js";
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
import "./storage-rV4HRCJm.js";
import "./supabase-pxAHMEVs.js";
function GalleryAdmin() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [spanClass, setSpanClass] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const {
    data: images = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["admin", "gallery-images"],
    queryFn: fetchAllGalleryImages
  });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "gallery-images"] });
    void queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
  };
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!pendingFile) throw new Error("Choose an image or video to upload.");
      return uploadGalleryImage(pendingFile, {
        caption,
        span_class: spanClass || null
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Gallery media uploaded.");
      setUploadOpen(false);
      setCaption("");
      setSpanClass("");
      setPendingFile(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteGalleryImage(id),
    onSuccess: () => {
      invalidate();
      toast.success("Gallery image deleted.");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message)
  });
  const reorderMutation = useMutation({
    mutationFn: (orderedIds) => reorderGalleryImages(orderedIds),
    onSuccess: () => {
      invalidate();
      toast.success("Gallery order updated.");
    },
    onError: (err) => toast.error(err.message)
  });
  const moveImage = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const orderedIds = images.map((image) => image.id);
    [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];
    reorderMutation.mutate(orderedIds);
  };
  const openUpload = () => {
    setCaption("");
    setSpanClass("");
    setPendingFile(null);
    setUploadOpen(true);
  };
  if (isLoading) return /* @__PURE__ */ jsx(AdminLoadingState, { label: "Loading gallery…" });
  if (isError) {
    return /* @__PURE__ */ jsx(
      AdminErrorState,
      {
        message: error instanceof Error ? error.message : "Failed to load gallery."
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AdminPageHeader,
      {
        title: "Gallery",
        description: "Upload, delete, and reorder images and videos on the public gallery page.",
        action: /* @__PURE__ */ jsxs(Button, { onClick: openUpload, children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          "Upload media"
        ] })
      }
    ),
    images.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-12 text-center text-sm text-muted-foreground", children: "No gallery images yet." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: images.map((image, index) => /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-lg border bg-card", children: [
      isGalleryVideoUrl(image.image_url) ? /* @__PURE__ */ jsx(
        "video",
        {
          src: image.image_url,
          className: "aspect-[4/3] w-full object-cover",
          controls: true,
          muted: true,
          playsInline: true,
          preload: "metadata"
        }
      ) : /* @__PURE__ */ jsx(
        "img",
        {
          src: image.image_url,
          alt: image.caption,
          className: "aspect-[4/3] w-full object-cover"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: image.caption }),
        image.span_class && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Span: ",
          image.span_class
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "icon",
              disabled: index === 0 || reorderMutation.isPending,
              onClick: () => moveImage(index, -1),
              "aria-label": "Move up",
              children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "icon",
              disabled: index === images.length - 1 || reorderMutation.isPending,
              onClick: () => moveImage(index, 1),
              "aria-label": "Move down",
              children: /* @__PURE__ */ jsx(ArrowDown, { className: "size-4" })
            }
          ),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setDeleteTarget(image), children: [
            /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
            "Delete"
          ] })
        ] })
      ] })
    ] }, image.id)) }),
    /* @__PURE__ */ jsx(Dialog, { open: uploadOpen, onOpenChange: setUploadOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Upload gallery media" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "gallery-file", children: "Image or video file" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "gallery-file",
              ref: fileInputRef,
              type: "file",
              accept: "image/*,video/*",
              className: "h-auto cursor-pointer py-2 file:mr-3 file:cursor-pointer",
              onChange: (e) => setPendingFile(e.target.files?.[0] ?? null)
            }
          ),
          pendingFile && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Selected: ",
            pendingFile.name
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "gallery-caption", children: "Caption" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "gallery-caption",
              value: caption,
              onChange: (e) => setCaption(e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setUploadOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            disabled: !pendingFile || !caption.trim() || uploadMutation.isPending,
            onClick: () => uploadMutation.mutate(),
            children: "Upload"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleteTarget, onOpenChange: (open) => !open && setDeleteTarget(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete gallery image?" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
          "This removes “",
          deleteTarget?.caption,
          "” from the public gallery."
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
  GalleryAdmin
};
