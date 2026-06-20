import { jsx } from "react/jsx-runtime";
import { useRouterState, Outlet, lazyRouteComponent } from "@tanstack/react-router";
const LazyAdminShellLayout = lazyRouteComponent(() => import("./-admin-shell-layout-Ddc5xpuQ.js"), "AdminShellLayout");
function AdminLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const isLogin = pathname === "/admin/login";
  if (isLogin) {
    return /* @__PURE__ */ jsx(Outlet, {});
  }
  return /* @__PURE__ */ jsx(LazyAdminShellLayout, {});
}
export {
  AdminLayout as component
};
