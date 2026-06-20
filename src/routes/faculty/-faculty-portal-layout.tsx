import { Outlet } from "@tanstack/react-router";

import { FacultyShell } from "@/components/portal/FacultyShell";

export function FacultyShellLayout() {
  return (
    <FacultyShell>
      <Outlet />
    </FacultyShell>
  );
}
