import { useQuery } from "@tanstack/react-query";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { fetchOwnFacultyProfile } from "@/services/faculty-portal";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function FacultyProfileView() {
  const { auth } = useAuth();

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["faculty", "profile", auth?.userId],
    queryFn: () => fetchOwnFacultyProfile(auth!.userId),
    enabled: !!auth?.userId,
  });

  if (isLoading) return <AdminLoadingState label="Loading your profile…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load your profile."}
      />
    );
  }

  if (!profile) return null;

  const initials = getInitials(profile.name);

  return (
    <>
      <AdminPageHeader
        title="My Profile"
        description="Your faculty account and assigned class details."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center pt-8 pb-6">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-3xl font-bold text-primary-foreground">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <h2 className="mt-5 text-center font-display text-xl font-semibold">{profile.name}</h2>
            <p className="text-center text-sm font-medium text-primary">{profile.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Read-only view of your faculty record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{auth?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assigned class</p>
              <p className="font-medium">Class {profile.assigned_class}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role / subject</p>
              <p className="font-medium">{profile.role}</p>
            </div>
            {profile.bio && (
              <div>
                <p className="text-muted-foreground">Bio</p>
                <p className="leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
