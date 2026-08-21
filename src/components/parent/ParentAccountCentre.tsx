import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { AuthError } from "@/lib/auth";
import {
  changePasswordWithCurrent,
  sendPasswordResetEmail,
} from "@/services/account-centre";
import {
  fetchOwnGuardianProfile,
  updateOwnGuardianProfile,
} from "@/services/parent-portal";

export function ParentAccountCentre() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["parent", "account"],
    queryFn: fetchOwnGuardianProfile,
  });

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setPhone(profile.phone ?? "");
    setEmail(profile.email ?? "");
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOwnGuardianProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parent", "account"] });
      toast.success("Profile updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!auth?.email) throw new AuthError("No email on account.");
      if (newPassword.length < 6) throw new AuthError("Password must be at least 6 characters.");
      if (newPassword !== confirmPassword) throw new AuthError("Passwords do not match.");
      await changePasswordWithCurrent(auth.email, currentPassword, newPassword);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading || !profile) {
    return <p className="text-sm text-muted-foreground">Loading account…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account centre</h1>
        <p className="text-sm text-muted-foreground">Update your contact details and password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Contact information visible to the school.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parent-first-name">First name</Label>
            <Input
              id="parent-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-last-name">Last name</Label>
            <Input
              id="parent-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-phone">Phone</Label>
            <Input id="parent-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-email">Email</Label>
            <Input id="parent-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button
            className="sm:col-span-2 w-fit"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-md gap-4">
          <div className="space-y-2">
            <Label htmlFor="parent-current-password">Current password</Label>
            <Input
              id="parent-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-new-password">New password</Label>
            <Input
              id="parent-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-confirm-password">Confirm new password</Label>
            <Input
              id="parent-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => passwordMutation.mutate()}
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Change password
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                if (!auth?.email) return;
                void sendPasswordResetEmail(auth.email, "/parent/login").then(() =>
                  toast.success("Reset email sent."),
                );
              }}
            >
              Email reset link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
