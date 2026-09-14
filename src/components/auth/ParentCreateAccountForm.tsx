import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthStateFromSession, getDashboardPath } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/services/supabase";

export function ParentCreateAccountForm() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Add your environment variables first.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { role: "parent" },
          emailRedirectTo: `${window.location.origin}/parent/create-account`,
        },
      });
      if (error) throw error;

      // If email confirmation is disabled, Supabase returns a session now.
      // The auth trigger has already created/attached the guardian record.
      if (data.session) {
        const auth = await getAuthStateFromSession(supabase, data.session);
        if (!auth || auth.role !== "parent") {
          throw new Error(
            "Your parent profile could not be created. Please contact the school office.",
          );
        }
        await router.invalidate();
        await navigate({
          to: getDashboardPath(auth.role, auth.staffRoleKey, auth.alsoInchargeRoleKey),
          replace: true,
        });
        return;
      }

      setVerificationSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="portal-shell-bg flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-soft">
        <CardHeader className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {SITE.name}
          </p>
          <CardTitle className="text-2xl">Create Parent Account</CardTitle>
          <CardDescription>
            Create a parent portal login. The school will link your children after verifying your
            details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationSent ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-muted-foreground">
                Check <strong>{email.trim()}</strong> for a verification link. Once verified, you
                will be signed in to the Parent Portal. If no children appear, please contact the
                school office.
              </p>
              <Link to="/parent/login" className="text-sm font-medium text-primary hover:underline">
                Return to Parent Login
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="parent-create-email">Email</Label>
                <Input
                  id="parent-create-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-create-password">Password</Label>
                <Input
                  id="parent-create-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-create-confirm-password">Confirm password</Label>
                <Input
                  id="parent-create-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/parent/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
