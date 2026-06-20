import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/site/PageHero";
import { motion } from "@/lib/motion";
import { AlertCircle, Loader2 } from "lucide-react";
import classroom from "@/assets/students-classroom.jpg";
import library from "@/assets/library.jpg";
import lab from "@/assets/science-lab.jpg";
import sports from "@/assets/sports.jpg";
import prayer from "@/assets/prayer-hall.jpg";
import graduation from "@/assets/graduation.jpg";
import art from "@/assets/art-class.jpg";
import hero from "@/assets/hero.webp";
import { fetchGalleryImages, isGalleryVideoUrl, type GalleryPhoto } from "@/services/gallery";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Hyderabad School" },
      {
        name: "description",
        content:
          "Glimpses from campus — classrooms, library, labs, prayer hall, sports and celebrations.",
      },
      { property: "og:title", content: "Gallery — Hyderabad School" },
      { property: "og:description", content: "A visual tour of our campus and student life." },
    ],
  }),
  component: GalleryPage,
});

const fallbackPhotos: GalleryPhoto[] = [
  { id: "fallback-hero", src: hero, caption: "Our campus", span: "md:col-span-2 md:row-span-2" },
  { id: "fallback-classroom", src: classroom, caption: "Modern classrooms" },
  { id: "fallback-library", src: library, caption: "Library & study halls" },
  { id: "fallback-lab", src: lab, caption: "Science laboratories" },
  { id: "fallback-prayer", src: prayer, caption: "Prayer hall" },
  { id: "fallback-sports", src: sports, caption: "Sports day" },
  { id: "fallback-art", src: art, caption: "Art & creativity" },
  { id: "fallback-graduation", src: graduation, caption: "Graduation", span: "md:col-span-2" },
];

function GalleryPage() {
  const {
    data: photos = fallbackPhotos,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: () => fetchGalleryImages(fallbackPhotos),
  });

  return (
    <>
      <PageHero eyebrow="Gallery" title="Moments from our campus">
        A glimpse of the spaces, people and celebrations that make Hyderabad School home.
      </PageHero>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Loading gallery…</span>
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="mb-8 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>{error instanceof Error ? error.message : "Failed to load gallery images."}</p>
            </div>
          )}

          {!isLoading && (
            <div className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {photos.map((p, i) => (
                <motion.figure
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`group relative overflow-hidden rounded-2xl border border-border shadow-soft ${p.span ?? ""}`}
                >
                  {isGalleryVideoUrl(p.src) ? (
                    <video
                      src={p.src}
                      className="h-full w-full object-cover"
                      controls
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={p.src}
                      alt={p.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  )}
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {p.caption}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
