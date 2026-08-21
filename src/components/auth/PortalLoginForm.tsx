import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { AuthError, getDashboardPath, getStaffRoleLabel, type LoginPortal } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { isSupabaseConfigured } from "@/services/supabase";

interface PortalLoginFormProps {
  portal: LoginPortal;
}

export function PortalLoginForm({ portal }: PortalLoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isParent = portal === "parent";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Add your environment variables first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = await login(email.trim(), password, portal);
      const roleLabel =
        auth.role === "parent" ? "Parent" : getStaffRoleLabel(auth.staffRoleKey);
      toast.success(`Signed in as ${roleLabel}.`);
      await router.invalidate();
      await navigate({
        to: getDashboardPath(auth.role, auth.staffRoleKey, auth.alsoInchargeRoleKey),
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof AuthError
          ? error.message
          : "Unable to sign in. Check your credentials and try again.";
      toast.error(message);
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
          <CardTitle className="text-2xl">{isParent ? "Parent Login" : "Staff Login"}</CardTitle>
          <CardDescription>
            {isParent
              ? "Sign in with the email the school linked to your guardian record. You will only see children already linked to you."
              : "Sign in with your school staff email. Your ERP role decides which portal you land in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isParent ? (
              <>
                Staff member?{" "}
                <Link to="/admin/login" className="font-medium text-primary hover:underline">
                  Staff Login
                </Link>
              </>
            ) : (
              <>
                Parent?{" "}
                <Link to="/parent/login" className="font-medium text-primary hover:underline">
                  Parent Login
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
