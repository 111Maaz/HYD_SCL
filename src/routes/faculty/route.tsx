import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireFaculty } from "@/lib/require-faculty";

export const Route = createFileRoute("/faculty")({
  beforeLoad: async () => {
    await requireFaculty();
  },
  component: FacultyLayout,
});

function FacultyLayout() {
  return <Outlet />;
}
