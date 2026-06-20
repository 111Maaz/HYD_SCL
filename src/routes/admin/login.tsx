import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { AuthError, getDashboardPath } from "@/lib/auth";
import { redirectIfAuthenticated } from "@/lib/route-guards";
import { isSupabaseConfigured } from "@/services/supabase";
import type { UserRole } from "@/types/database";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
  head: () => ({
    meta: [{ title: "Staff Login — Hyderabad School" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Add your environment variables first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = await login(email.trim(), password, role);
      toast.success("Signed in successfully.");
      await navigate({ to: getDashboardPath(auth.role) });
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {SITE.name}
          </p>
          <CardTitle className="text-2xl">Staff Login</CardTitle>
          <CardDescription>Sign in as an administrator or faculty member.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-3">
              <Label>Role</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="role-admin"
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="admin" id="role-admin" />
                  <span className="text-sm font-medium">Admin</span>
                </label>
                <label
                  htmlFor="role-faculty"
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="faculty" id="role-faculty" />
                  <span className="text-sm font-medium">Faculty</span>
                </label>
              </RadioGroup>
            </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
