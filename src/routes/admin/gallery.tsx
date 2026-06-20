import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [{ title: "Gallery — Admin — Hyderabad School" }],
  }),
  component: lazyRouteComponent(() => import("@/components/admin/GalleryAdmin"), "GalleryAdmin"),
});
