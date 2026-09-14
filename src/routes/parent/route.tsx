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
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen portal-shell-bg">
      <header className="border-b border-border/60 bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{SITE.name}</p>
            <p className="font-semibold">Parent portal</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/parent/children"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Users className="size-4" />
              My Children
            </Link>
            <Link
              to="/parent/account"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <User className="size-4" />
              Account
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">{auth?.email}</span>
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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
