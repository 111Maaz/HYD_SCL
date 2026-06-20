import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  deleteGalleryImage,
  fetchAllGalleryImages,
  isGalleryVideoUrl,
  reorderGalleryImages,
  uploadGalleryImage,
} from "@/services/gallery";
import type { GalleryImage } from "@/types/database";

export function GalleryAdmin() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [spanClass, setSpanClass] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);

  const {
    data: images = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "gallery-images"],
    queryFn: fetchAllGalleryImages,
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
        span_class: spanClass || null,
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
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGalleryImage(id),
    onSuccess: () => {
      invalidate();
      toast.success("Gallery image deleted.");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderGalleryImages(orderedIds),
    onSuccess: () => {
      invalidate();
      toast.success("Gallery order updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const moveImage = (index: number, direction: -1 | 1) => {
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

  if (isLoading) return <AdminLoadingState label="Loading gallery…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load gallery."}
      />
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Gallery"
        description="Upload, delete, and reorder images and videos on the public gallery page."
        action={
          <Button onClick={openUpload}>
            <Plus className="size-4" />
            Upload media
          </Button>
        }
      />

      {images.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No gallery images yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div key={image.id} className="overflow-hidden rounded-lg border bg-card">
              {isGalleryVideoUrl(image.image_url) ? (
                <video
                  src={image.image_url}
                  className="aspect-[4/3] w-full object-cover"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={image.image_url}
                  alt={image.caption}
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="space-y-3 p-4">
                <p className="text-sm font-medium">{image.caption}</p>
                {image.span_class && (
                  <p className="text-xs text-muted-foreground">Span: {image.span_class}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => moveImage(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={index === images.length - 1 || reorderMutation.isPending}
                    onClick={() => moveImage(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(image)}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload gallery media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-file">Image or video file</Label>
              <Input
                id="gallery-file"
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="h-auto cursor-pointer py-2 file:mr-3 file:cursor-pointer"
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              />
              {pendingFile && (
                <p className="text-xs text-muted-foreground">Selected: {pendingFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-caption">Caption</Label>
              <Input
                id="gallery-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="gallery-span">Grid span class (optional)</Label>
              <Input
                id="gallery-span"
                value={spanClass}
                onChange={(e) => setSpanClass(e.target.value)}
                placeholder="md:col-span-2 md:row-span-2"
              />
            </div> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pendingFile || !caption.trim() || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete gallery image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{deleteTarget?.caption}&rdquo; from the public gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
