import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/lib/auth";
import { SITE } from "@/lib/site";
import {
  completePasswordRecovery,
  sendPasswordResetEmail,
  verifyPasswordResetOtp,
  type PasswordResetPortal,
} from "@/services/account-centre";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import { isSupabaseConfigured } from "@/services/supabase";

type Step = "email" | "otp" | "password";

interface ForgotPasswordFormProps {
  portal: PasswordResetPortal;
  /** When true, skip to new password if a recovery session is already present (email link). */
  startOnRecovery?: boolean;
}

export function ForgotPasswordForm({
  portal,
  startOnRecovery = false,
}: ForgotPasswordFormProps) {
  const navigate = useNavigate();
  const loginTo = portal === "parent" ? "/parent/login" : "/admin/login";
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!startOnRecovery || !isSupabaseConfigured()) return;

    let cancelled = false;
    void createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (data.session) {
          setStep("password");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [startOnRecovery]);

  const sendCode = async () => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Add your environment variables first.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(email.trim(), portal);
      toast.success("If that email is registered, a reset code is on its way.");
      setStep("otp");
    } catch (error) {
      toast.error(error instanceof AuthError ? error.message : "Unable to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCode = async () => {
    setIsSubmitting(true);
    try {
      await verifyPasswordResetOtp(email, otp);
      toast.success("Code confirmed. Choose a new password.");
      setStep("password");
    } catch (error) {
      toast.error(error instanceof AuthError ? error.message : "That code did not work.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await completePasswordRecovery(newPassword);
      toast.success("Password updated. Sign in with your new password.");
      await navigate({ to: loginTo, replace: true });
    } catch (error) {
      toast.error(error instanceof AuthError ? error.message : "Unable to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = portal === "parent" ? "Parent password reset" : "Staff password reset";

  return (
    <div className="portal-shell-bg flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-soft">
        <CardHeader className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {SITE.name}
          </p>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your login email. We will send a one-time code so you can set a new password."
              : step === "otp"
                ? "Enter the 6-digit code from your email. If you opened the reset link instead, you can skip this step."
                : "Choose a new password, then sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" ? (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void sendCode();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Send reset code
              </Button>
            </form>
          ) : null}

          {step === "otp" ? (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void confirmCode();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="reset-otp">Email code</Label>
                <Input
                  id="reset-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Verify code
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => setStep("email")}
              >
                Use a different email
              </Button>
            </form>
          ) : null}

          {step === "password" ? (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void savePassword();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="reset-new-password">New password</Label>
                <Input
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password">Confirm new password</Label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Save new password
              </Button>
            </form>
          ) : null}

          <p className="text-center text-sm text-muted-foreground">
            <Link to={loginTo} className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
