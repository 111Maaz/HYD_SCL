import { jsx, jsxs } from "react/jsx-runtime";
import { Loader2, AlertCircle } from "lucide-react";
import * as React from "react";
import { cva } from "class-variance-authority";
import { c as cn } from "./router-RRLex1WM.js";
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, role: "alert", className: cn(alertVariants({ variant }), className), ...props }));
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "h5",
    {
      ref,
      className: cn("mb-1 font-medium leading-none tracking-tight", className),
      ...props
    }
  )
);
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props }));
AlertDescription.displayName = "AlertDescription";
function AdminPageHeader({ title, description, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
    ] }),
    action
  ] });
}
function AdminLoadingState({ label = "Loading…" }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 py-16 text-muted-foreground", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin", "aria-hidden": true }),
    /* @__PURE__ */ jsx("span", { children: label })
  ] });
}
function AdminErrorState({ message }) {
  return /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
    /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
    /* @__PURE__ */ jsx(AlertTitle, { children: "Something went wrong" }),
    /* @__PURE__ */ jsx(AlertDescription, { children: message })
  ] });
}
export {
  AdminPageHeader as A,
  AdminLoadingState as a,
  AdminErrorState as b
};
