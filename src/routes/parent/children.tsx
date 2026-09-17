import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, School, ShieldAlert } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PortalEmptyState, PortalPage, PortalPanel } from "@/components/portal/PortalPanel";
import { Badge } from "@/components/ui/badge";
import {
  fetchLinkedChildrenForCurrentParent,
  getStudentDisplayName,
} from "@/services/guardians";

export const Route = createFileRoute("/parent/children")({
  head: () => ({
    meta: [{ title: "My Children — Hyderabad School" }],
  }),
  component: ParentChildrenRoute,
});

function ParentChildrenRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/parent/children" || pathname === "/parent/children/"
    ? <ParentChildrenPage />
    : <Outlet />;
}

function ParentChildrenPage() {
  const {
    data: children = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: fetchLinkedChildrenForCurrentParent,
  });

  if (isLoading) {
    return (
      <PortalPage>
        <p className="text-sm text-muted-foreground">Loading your children…</p>
      </PortalPage>
    );
  }

  if (isError) {
    return (
      <PortalPage>
        <PortalPanel className="border-destructive/30">
          <div className="flex gap-3 text-sm text-destructive">
            <ShieldAlert className="size-5 shrink-0" />
            {error instanceof Error ? error.message : "Unable to load children."}
          </div>
        </PortalPanel>
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <AdminPageHeader
        title="My Children"
        description="You can only see students the school has linked to your account."
      />

      {children.length === 0 ? (
        <PortalEmptyState
          icon={<School className="mx-auto size-10" />}
          title="No children linked yet"
          description="Please contact the school office if you expected to see a student here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <PortalPanel
              key={child.id}
              className="overflow-hidden transition-shadow hover:shadow-md"
              title={<span className="break-words">{getStudentDisplayName(child)}</span>}
              description={<span className="break-all font-mono text-xs">{child.student_number}</span>}
            >
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  {child.link.is_primary && <Badge>Primary contact</Badge>}
                  <Badge variant="outline">{child.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center">
                  <div><p className="text-xs text-muted-foreground">Attendance</p><p className="font-medium">{child.link.can_view_attendance ? "Available" : "Hidden"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Fees</p><p className="font-medium">{child.link.can_view_fees ? "Available" : "Hidden"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Academic</p><p className="font-medium">{child.link.can_view_academic_data ? "Available" : "Hidden"}</p></div>
                </div>
                <Link
                  to="/parent/children/$studentId"
                  params={{ studentId: child.id }}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/15 sm:w-auto"
                >
                  View details
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </PortalPanel>
          ))}
        </div>
      )}
    </PortalPage>
  );
}

