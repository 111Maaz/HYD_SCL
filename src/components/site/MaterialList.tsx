import { motion } from "@/lib/motion";
import { Download, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMaterialPreviewUrl, type ClassMaterial } from "@/lib/class-materials";

type MaterialListProps = {
  materials: ClassMaterial[];
};

export function MaterialList({ materials }: MaterialListProps) {
  if (materials.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-16 text-center"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileText className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-5 text-base text-muted-foreground sm:text-lg">
          No materials uploaded yet for this class.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {materials.map((material, index) => {
        const previewUrl = getMaterialPreviewUrl(material.file_url, material.file_name);

        return (
          <motion.article
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            whileHover={{ y: -4 }}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant"
          >
            <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              {material.subject}
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
              {material.title}
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {material.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" aria-hidden />
                  Preview
                </a>
              </Button>
              <Button asChild className="flex-1 sm:flex-none">
                <a
                  href={material.file_url}
                  download={material.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </a>
              </Button>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
