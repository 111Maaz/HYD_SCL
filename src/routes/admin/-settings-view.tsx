import { Link } from "@tanstack/react-router";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { SITE } from "@/lib/site";

export function AdminSettingsView() {
  const { auth } = useAuth();

  return (
    <>
      <AdminPageHeader title="Settings" description="Account and portal preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed-in administrator details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {auth?.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Role:</span> {auth?.role ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">School:</span> {SITE.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faculty provisioning</CardTitle>
            <CardDescription>Create staff login accounts for the faculty portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/faculty-accounts"
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage faculty accounts →
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
