import { cn } from "../../lib/utils";
import type { TimelineStatus, CompletionStatus } from "../../data/types";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "neutral";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "text-brand",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-secondary",
  };

  const bgVariants = {
    default: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    neutral: "bg-secondary",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", bgVariants[variant])} />
      {children}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: TimelineStatus | CompletionStatus; className?: string }) {
  let pillClass = "border-state-tbc/30 bg-state-tbc/15 text-secondary";
  let dotClass = "bg-state-tbc";
  
  switch (status) {
    case "On Track":
    case "In Progress":
      pillClass = "border-state-scheduled/30 bg-state-scheduled/15 text-state-scheduled";
      dotClass = "bg-state-scheduled";
      break;
    case "Due Soon":
      pillClass = "border-warning/30 bg-warning/15 text-warning";
      dotClass = "bg-warning";
      break;
    case "Completed":
      pillClass = "border-state-completed/30 bg-state-completed/15 text-state-completed";
      dotClass = "bg-state-completed";
      break;
    case "Immediate":
    case "Overdue":
    case "Delayed":
      pillClass = "border-state-risk/30 bg-state-risk/15 text-danger";
      dotClass = "bg-state-risk";
      break;
    case "To Be Confirmed":
    case "Not Started":
      pillClass = "border-state-tbc/30 bg-state-tbc/15 text-secondary";
      break;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold leading-none",
        pillClass,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
      {status}
    </div>
  );
}
