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
  let colorClass = "text-secondary";
  let bgClass = "bg-secondary";
  
  switch (status) {
    case "On Track":
    case "Due Soon":
    case "In Progress":
      bgClass = "bg-state-scheduled";
      break;
    case "Completed":
      bgClass = "bg-state-completed";
      break;
    case "Immediate":
    case "Overdue":
    case "Delayed":
      colorClass = "text-danger"; // Preserve explicit risk warning for readability
      bgClass = "bg-state-risk";
      break;
    case "To Be Confirmed":
    case "Not Started":
      bgClass = "bg-state-tbc shadow-glow-tbc";
      break;
  }

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs font-medium", colorClass, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", bgClass)} />
      {status}
    </div>
  );
}
