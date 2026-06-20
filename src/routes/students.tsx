import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeader } from "@/components/site/SectionHeader";
import { ClassSelector } from "@/components/site/ClassSelector";
import { MaterialList } from "@/components/site/MaterialList";
import { getMaterialsByClass, type ClassNumber } from "@/lib/class-materials";
import { fetchClassMaterials } from "@/services/class-materials";
import { AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — Hyderabad School" },
      {
        name: "description",
        content:
          "Download class materials — worksheets, notes and study resources for Classes 1–10.",
      },
      { property: "og:title", content: "Student Resources — Hyderabad School" },
      {
        property: "og:description",
        content: "Browse and download learning materials by class. Public read-only access.",
      },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const [selectedClass, setSelectedClass] = useState<ClassNumber | null>(1);
  const {
    data: allMaterials,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["class-materials"],
    queryFn: fetchClassMaterials,
  });

  const materials =
    selectedClass && allMaterials ? getMaterialsByClass(selectedClass, allMaterials) : [];

  return (
    <>
      <PageHero eyebrow="Students" title="Class learning materials">
        Select your class to browse and download study resources shared by our faculty. No login
        required.
      </PageHero>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Your class"
            title="Choose a class"
            subtitle="Materials are organised by class level for easy access."
          />
          <div className="mt-14">
            <ClassSelector selected={selectedClass} onSelect={setSelectedClass} />
          </div>
        </div>
      </section>

      {selectedClass && (
        <section className="bg-secondary pb-20 pt-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              center={false}
              eyebrow="Downloads"
              title={`Class ${selectedClass} materials`}
              subtitle={
                !isLoading && materials.length > 0
                  ? `${materials.length} resource${materials.length === 1 ? "" : "s"} available for download.`
                  : undefined
              }
            />

            {isLoading && (
              <div className="mt-10 flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                <span>Loading materials…</span>
              </div>
            )}

            {isError && (
              <div
                role="alert"
                className="mt-10 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p>{error instanceof Error ? error.message : "Failed to load class materials."}</p>
              </div>
            )}

            {!isLoading && !isError && (
              <div className="mt-10">
                <MaterialList materials={materials} />
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
