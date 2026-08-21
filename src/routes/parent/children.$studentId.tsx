import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ParentChildDetail } from "@/components/parent/ParentChildDetail";

export const Route = createFileRoute("/parent/children/$studentId")({
  params: {
    parse: (params) => z.object({ studentId: z.string().uuid() }).parse(params),
  },
  head: () => ({
    meta: [{ title: "Child details — Parent — Hyderabad School" }],
  }),
  component: ParentChildPage,
});

function ParentChildPage() {
  const { studentId } = Route.useParams();
  return <ParentChildDetail studentId={studentId} />;
}
