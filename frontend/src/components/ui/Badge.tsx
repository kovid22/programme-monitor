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
  let variant: BadgeProps["variant"] = "neutral";
  
  switch (status) {
    case "On Track":
    case "Completed":
      variant = "success";
      break;
    case "Due Soon":
    case "In Progress":
      variant = "warning";
      break;
    case "Immediate":
    case "Overdue":
    case "Delayed":
      variant = "danger";
      break;
    case "TBC":
    case "Not Started":
      variant = "neutral";
      break;
  }

  return <Badge variant={variant} className={className}>{status}</Badge>;
}
