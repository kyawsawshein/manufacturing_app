"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // General
  Active: "bg-success/20 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Draft: "bg-muted text-muted-foreground",
  Pending: "bg-warning/20 text-warning",

  // Orders
  Confirmed: "bg-info/20 text-info",
  Processing: "bg-info/20 text-info",
  Done: "bg-success/20 text-success",
  Cancelled: "bg-destructive/20 text-destructive",
  Cancel: "bg-destructive/20 text-destructive",
  Shipped: "bg-primary/20 text-primary",
  Invoiced: "bg-success/20 text-success",

  // Stock
  Available: "bg-success/20 text-success",
  Reserved: "bg-warning/20 text-warning",
  Quarantine: "bg-destructive/20 text-destructive",
  Expired: "bg-destructive/20 text-destructive",
  "On Hold": "bg-warning/20 text-warning",

  // BOM
  Obsolete: "bg-muted text-muted-foreground",

  // Default
  default: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || statusColors.default;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {status}
    </span>
  );
}
