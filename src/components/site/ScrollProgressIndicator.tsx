import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ScrollSection {
  id: string;
  label: string;
}

export function ScrollProgressIndicator({ sections }: { sections: ScrollSection[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }

        let bestIndex = 0;
        let bestRatio = -1;

        sections.forEach((section, index) => {
          const ratio = ratios.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });

        setActiveIndex(bestIndex);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: "-20% 0px -20% 0px" },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center lg:flex"
      aria-label="Page sections"
    >
      <div className="flex flex-col items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-1.5 py-3 shadow-soft backdrop-blur-sm">
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollTo(section.id)}
            className="group flex items-center justify-center p-0.5"
            aria-label={section.label}
            aria-current={activeIndex === index ? "true" : undefined}
          >
            <span
              className={cn(
                "block w-px rounded-full transition-all duration-300",
                activeIndex === index
                  ? "h-8 bg-gold shadow-gold"
                  : "h-5 bg-muted-foreground/30 group-hover:bg-muted-foreground/50",
              )}
            />
          </button>
        ))}
      </div>
    </nav>
  );
}
