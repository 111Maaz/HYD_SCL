import {
  Outlet,
  createFileRoute,
  lazyRouteComponent,
  useRouterState,
} from "@tanstack/react-router";

import { isPublicAdminAuthPath, requireAdminPath } from "@/lib/route-guards";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (isPublicAdminAuthPath(location.pathname)) {
      return;
    }

    await requireAdminPath(location.pathname);
  },
  component: AdminLayout,
});

const LazyAdminShellLayout = lazyRouteComponent(
  () => import("@/routes/admin/-admin-shell-layout"),
  "AdminShellLayout",
);

function AdminLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (isPublicAdminAuthPath(pathname)) {
    return <Outlet />;
  }

  return <LazyAdminShellLayout />;
}
