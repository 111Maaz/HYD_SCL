import { createFileRoute } from "@tanstack/react-router";
import { IslamicEducationShowcase } from "@/components/site/IslamicEducationShowcase";

export const Route = createFileRoute("/islamic-education")({
  head: () => ({
    meta: [
      { title: "Islamic Education — Hyderabad School" },
      {
        name: "description",
        content:
          "Quran, Salah, Akhlaq and Ilm — a complete Islamic curriculum alongside modern academics at Hyderabad School.",
      },
      { property: "og:title", content: "Islamic Education at Hyderabad School" },
      {
        property: "og:description",
        content: "Daily duas, character building and faith in practice for every student.",
      },
    ],
  }),
  component: IslamicEducationPage,
});

function IslamicEducationPage() {
  return <IslamicEducationShowcase />;
}
