import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Package,
  Factory,
  ShoppingCart,
  Receipt,
  TrendingUp,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  building: Building2,
  package: Package,
  factory: Factory,
  cart: ShoppingCart,
  receipt: Receipt,
  trending: TrendingUp,
  dollar: DollarSign,
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof iconMap;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  const Icon = iconMap[icon] || Package;
  
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                trend.value >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
