import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, KeyRound, Loader2, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { AuthError, getStaffRoleLabel } from "@/lib/auth";
import {
  changePasswordWithCurrent,
  updateOwnAccountProfile,
  uploadOwnStaffPhoto,
} from "@/services/account-centre";
import { fetchOwnStaffProfile } from "@/services/allotments";
import { getStaffDisplayName } from "@/types/database";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AccountCentre() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["account-centre", auth?.userId],
    queryFn: () => fetchOwnStaffProfile(auth!.userId),
    enabled: !!auth?.userId,
  });

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setPhone(profile.phone ?? "");
    setDesignation(profile.designation ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOwnAccountProfile(auth!.userId, {
        firstName,
        lastName,
        phone,
        designation,
        bio,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account-centre"] });
      toast.success("Account details saved.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) =>
      uploadOwnStaffPhoto(auth!.userId, file, profile?.photo_url),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account-centre"] });
      toast.success("Profile photo updated. It will appear across the platform.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      changePasswordWithCurrent(auth!.email, currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    },
    onError: (err: Error) =>
      toast.error(err instanceof AuthError ? err.message : err.message),
  });

  if (isLoading) return <AdminLoadingState label="Loading account centre…" />;
  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load account."}
      />
    );
  }
  if (!profile || !auth) return null;

  const name = getStaffDisplayName(profile);
  const roleLabel = getStaffRoleLabel(auth.staffRoleKey);

  return (
    <>
      <AdminPageHeader
        title="Account centre"
        description="Edit your details, photo, and password. Your photo is used across the platform."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center pt-8 pb-6">
            <div className="relative">
              <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-muted font-display text-3xl font-bold">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  initials(name)
                )}
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 size-9 rounded-full"
                disabled={photoMutation.isPending}
                onClick={() => fileRef.current?.click()}
                aria-label="Upload photo"
              >
                {photoMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) photoMutation.mutate(file);
                  event.target.value = "";
                }}
              />
            </div>
            <h2 className="mt-5 text-center font-display text-xl font-semibold">{name}</h2>
            <p className="text-center text-sm text-muted-foreground">{roleLabel}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">{auth.email}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>These details appear on staff cards and portals.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="ac-first">First name</Label>
                  <Input
                    id="ac-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac-last">Last name</Label>
                  <Input
                    id="ac-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac-phone">Mobile</Label>
                  <Input
                    id="ac-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Used for contact / future OTP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac-title">Display title</Label>
                  <Input
                    id="ac-title"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ac-bio">Bio</Label>
                  <Textarea
                    id="ac-bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5" />
                Password
              </CardTitle>
              <CardDescription>
                Enter your current password, then choose a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (newPassword.length < 6) {
                    toast.error("New password must be at least 6 characters.");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    toast.error("New password and confirmation do not match.");
                    return;
                  }
                  passwordMutation.mutate();
                }}
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ac-current-pw">Current password</Label>
                  <Input
                    id="ac-current-pw"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac-new-pw">New password</Label>
                  <Input
                    id="ac-new-pw"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac-confirm-pw">Confirm new password</Label>
                  <Input
                    id="ac-confirm-pw"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Update password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
