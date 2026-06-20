import { SITE } from "@/lib/site";

export function GoogleMap() {
  if (!SITE.mapsQuery) {
    return (
      <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-border shadow-soft">
        <p className="text-sm text-muted-foreground">Map location coming soon.</p>
      </div>
    );
  }

  const src = SITE.mapsUrl
    ? SITE.mapsUrl
    : `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed`;
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
      <iframe
        title="Hyderabad School location"
        src={src}
        width="100%"
        height="420"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
