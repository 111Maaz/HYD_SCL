import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { FacultyAttendanceView } from "@/components/faculty/FacultyAttendanceView";

const searchSchema = z.object({
  sectionId: z.string().uuid(),
  yearId: z.string().uuid(),
});

export const Route = createFileRoute("/faculty/portal/attendance")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Take attendance — Hyderabad School" }],
  }),
  component: FacultyAttendancePage,
});

function FacultyAttendancePage() {
  const { sectionId, yearId } = Route.useSearch();
  return <FacultyAttendanceView sectionId={sectionId} yearId={yearId} />;
}
