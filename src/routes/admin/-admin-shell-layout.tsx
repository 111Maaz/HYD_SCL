import { Outlet } from "@tanstack/react-router";

import { AdminShell } from "@/components/portal/AdminShell";

export function AdminShellLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
