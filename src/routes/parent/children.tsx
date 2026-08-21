import { Link, createFileRoute } from "@tanstack/react-router";
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
  component: ParentChildrenPage,
});

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
              title={getStudentDisplayName(child)}
              description={<span className="font-mono text-xs">{child.student_number}</span>}
            >
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  {child.link.is_primary && <Badge>Primary contact</Badge>}
                  <Badge variant="outline">{child.status}</Badge>
                </div>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li>Attendance: {child.link.can_view_attendance ? "Allowed" : "Hidden"}</li>
                  <li>Fees: {child.link.can_view_fees ? "Allowed" : "Hidden"}</li>
                  <li>Academic: {child.link.can_view_academic_data ? "Allowed" : "Hidden"}</li>
                </ul>
                <Link
                  to="/parent/children/$studentId"
                  params={{ studentId: child.id }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
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
