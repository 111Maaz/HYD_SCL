import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { LogOut, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { isPublicParentAuthPath, requireParent } from "@/lib/route-guards";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/parent")({
  beforeLoad: async ({ location }) => {
    if (isPublicParentAuthPath(location.pathname)) {
      return;
    }

    await requireParent();
  },
  component: ParentLayout,
});

function ParentLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (isPublicParentAuthPath(pathname)) {
    return <Outlet />;
  }

  return <ParentShell />;
}

function ParentShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen min-w-0 portal-shell-bg">
      <header className="border-b border-border/60 bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap">
          <div className="min-w-0 flex-1 sm:flex-none">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{SITE.name}</p>
            <p className="font-semibold">Parent portal</p>
          </div>
          <nav className="order-3 grid w-full grid-cols-2 gap-2 border-t border-border/50 pt-3 sm:order-2 sm:ml-auto sm:flex sm:w-auto sm:border-0 sm:pt-0" aria-label="Parent portal">
            <Link
              to="/parent/children"
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-primary hover:bg-muted/60 sm:py-1"
            >
              <Users className="size-4 shrink-0" />
              My Children
            </Link>
            <Link
              to="/parent/account"
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-primary hover:bg-muted/60 sm:py-1"
            >
              <User className="size-4 shrink-0" />
              Account
            </Link>
          </nav>
          <div className="order-2 shrink-0 sm:order-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void logout().then(() => navigate({ to: "/parent/login" }));
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
