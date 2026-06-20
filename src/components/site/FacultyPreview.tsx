import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { PersonCard } from "@/components/site/PersonCard";
import { fetchFacultyMembers, pickHomeFacultyPreview } from "@/services/faculty";

const PREVIEW_COUNT = 4;

export function FacultyPreview() {
  const {
    data: faculty = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["faculty-members"],
    queryFn: fetchFacultyMembers,
  });

  const preview = pickHomeFacultyPreview(faculty, PREVIEW_COUNT);

  return (
    <section id="faculty-preview" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our Faculty"
          title="Educators who inspire every day"
          subtitle="Passionate, qualified and deeply committed to every student's success."
        />

        {isLoading && (
          <div className="mt-14 flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span>Loading faculty…</span>
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="mt-14 flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
            <span>Faculty profiles are temporarily unavailable.</span>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((person, i) => (
              <PersonCard key={`${person.role}-${i}`} person={person} index={i} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/academics"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            Meet the full faculty
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
