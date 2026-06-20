import {
  Outlet,
  createFileRoute,
  lazyRouteComponent,
  useRouterState,
} from "@tanstack/react-router";

import { requireAdmin } from "@/lib/route-guards";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") {
      return;
    }

    await requireAdmin();
  },
  component: AdminLayout,
});

const LazyAdminShellLayout = lazyRouteComponent(
  () => import("@/routes/admin/-admin-shell-layout"),
  "AdminShellLayout",
);

function AdminLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <Outlet />;
  }

  return <LazyAdminShellLayout />;
}
