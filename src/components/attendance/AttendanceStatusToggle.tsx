import { Check, X } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { AttendanceMarkStatus } from "@/lib/attendance-ui";

interface AttendanceStatusToggleProps {
  value: AttendanceMarkStatus | "";
  onChange: (value: AttendanceMarkStatus) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Icon-only P/A — for dense student lists */
  dense?: boolean;
}

/** Fast present/absent control — use remarks for late, leave, etc. */
export function AttendanceStatusToggle({
  value,
  onChange,
  disabled,
  className,
  compact,
  dense,
}: AttendanceStatusToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value || undefined}
      onValueChange={(next) => {
        if (next === "PRESENT" || next === "ABSENT") onChange(next);
      }}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 rounded-md border border-border/80 bg-muted/30 p-0.5 shadow-sm",
        dense ? "h-7" : compact ? "h-8" : "h-9",
        dense ? "w-[72px]" : compact ? "w-[168px]" : "w-[200px]",
        className,
      )}
    >
      <ToggleGroupItem
        value="PRESENT"
        aria-label="Present"
        className={cn(
          "min-w-0 flex-1 gap-0.5 rounded border-0 font-medium transition-all duration-150",
          dense ? "h-6 px-1.5 text-[10px]" : "gap-1 px-2.5 text-xs sm:px-3 sm:text-sm",
          "data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:shadow-sm",
          "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/80",
        )}
      >
        <Check className={cn("shrink-0", dense ? "size-3" : "size-3.5 sm:size-4")} />
        {dense ? <span>P</span> : <span>Present</span>}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="ABSENT"
        aria-label="Absent"
        className={cn(
          "min-w-0 flex-1 gap-0.5 rounded border-0 font-medium transition-all duration-150",
          dense ? "h-6 px-1.5 text-[10px]" : "gap-1 px-2.5 text-xs sm:px-3 sm:text-sm",
          "data-[state=on]:bg-rose-600 data-[state=on]:text-white data-[state=on]:shadow-sm",
          "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/80",
        )}
      >
        <X className={cn("shrink-0", dense ? "size-3" : "size-3.5 sm:size-4")} />
        {dense ? <span>A</span> : <span>Absent</span>}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
