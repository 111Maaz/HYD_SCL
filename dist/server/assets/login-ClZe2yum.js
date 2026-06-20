import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { Circle, Loader2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { B as Button } from "./button-Q0ssrFUP.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-B3TlI1iy.js";
import { I as Input } from "./input-DPHz-dCO.js";
import { L as Label } from "./label-D4ow4ujt.js";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { c as cn, u as useAuth, S as SITE } from "./router-RRLex1WM.js";
import { b as getDashboardPath, A as AuthError } from "./auth-D8LBsNTn.js";
import { i as isSupabaseConfigured } from "./env-6VBUsO0V.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "@radix-ui/react-label";
import "@tanstack/react-query";
import "framer-motion";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "zod";
import "@supabase/ssr";
const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(RadioGroupPrimitive.Root, { className: cn("grid gap-2", className), ...props, ref });
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Item,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(Circle, { className: "h-3.5 w-3.5 fill-primary" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
function AdminLoginPage() {
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.error("Supabase is not configured. Add your environment variables first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const auth = await login(email.trim(), password, role);
      toast.success("Signed in successfully.");
      await navigate({
        to: getDashboardPath(auth.role)
      });
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "Unable to sign in. Check your credentials and try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: SITE.name }),
      /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: "Staff Login" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Sign in as an administrator or faculty member." })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: (event) => void handleSubmit(event), children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Label, { children: "Role" }),
        /* @__PURE__ */ jsxs(RadioGroup, { value: role, onValueChange: (value) => setRole(value), className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("label", { htmlFor: "role-admin", className: "flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5", children: [
            /* @__PURE__ */ jsx(RadioGroupItem, { value: "admin", id: "role-admin" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Admin" })
          ] }),
          /* @__PURE__ */ jsxs("label", { htmlFor: "role-faculty", className: "flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5", children: [
            /* @__PURE__ */ jsx(RadioGroupItem, { value: "faculty", id: "role-faculty" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Faculty" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
        /* @__PURE__ */ jsx(Input, { id: "email", type: "email", autoComplete: "email", value: email, onChange: (event) => setEmail(event.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
        /* @__PURE__ */ jsx(Input, { id: "password", type: "password", autoComplete: "current-password", value: password, onChange: (event) => setPassword(event.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }),
        "Signing in..."
      ] }) : "Login" })
    ] }) })
  ] }) });
}
export {
  AdminLoginPage as component
};
