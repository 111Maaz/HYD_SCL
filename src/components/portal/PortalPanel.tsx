import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PortalPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

/** Reusable portal card — use instead of ad-hoc Card styling in admin/faculty screens. */
export function PortalPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  headerClassName,
}: PortalPanelProps) {
  const hasHeader = title || description || action;

  return (
    <Card
      className={cn(
        "min-w-0 border-border/70 bg-card/95 shadow-soft backdrop-blur-[1px]",
        className,
      )}
    >
      {hasHeader ? (
        <CardHeader
          className={cn(
            "flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-start sm:justify-between",
            headerClassName,
          )}
        >
          <div className="min-w-0 space-y-1">
            {title ? <CardTitle className="text-base font-semibold">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
      ) : null}
      {children != null ? (
        <CardContent className={cn("min-w-0", hasHeader ? "pt-4" : undefined, contentClassName)}>
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}

/** Standard portal page width + horizontal overflow guard for mobile. */
export function PortalPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-6xl space-y-1", className)}>{children}</div>
  );
}

/** Section heading inside portal pages (between panels). */
export function PortalSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mb-3 mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Compact stat chip for toolbars (attendance counts, etc.). */
export function PortalStatPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: "present" | "absent" | "neutral";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        tone === "present" &&
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        tone === "absent" && "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200",
        tone === "neutral" && "border-border/80 bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Dashed empty state inside a portal panel. */
export function PortalEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mx-auto mb-3 text-muted-foreground">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
