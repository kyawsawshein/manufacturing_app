"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Factory,
  Building2,
  ChevronDown,
  ChevronRight,
  Boxes,
  MapPin,
  ArrowRightLeft,
  Warehouse,
  FileText,
  Layers,
  Shield,
  UserCog,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Users", href: "/settings/users", icon: UserCog },
      { label: "Access Rights", href: "/settings/access-rights", icon: Shield },
    ],
  },
  {
    label: "Employees",
    icon: Users,
    children: [
      { label: "Employees", href: "/employees", icon: Users },
      { label: "Departments", href: "/employees/departments", icon: Building2 },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Products", href: "/inventory/products", icon: Package },
      { label: "Stock On Hand", href: "/inventory/stock", icon: Boxes },
      { label: "Stock Moves", href: "/inventory/moves", icon: ArrowRightLeft },
      { label: "Locations", href: "/inventory/locations", icon: MapPin },
      { label: "Warehouses", href: "/inventory/warehouses", icon: Warehouse },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    children: [
      { label: "Purchase Orders", href: "/purchase/orders", icon: FileText },
      { label: "Vendors", href: "/purchase/vendors", icon: Building2 },
    ],
  },
  {
    label: "Sales",
    icon: Receipt,
    children: [
      { label: "Sales Orders", href: "/sales/orders", icon: FileText },
      { label: "Customers", href: "/sales/customers", icon: Users },
    ],
  },
  {
    label: "Manufacturing",
    icon: Factory,
    children: [
      { label: "Manufacturing Orders", href: "/manufacturing/orders", icon: Factory },
      { label: "Bill of Materials", href: "/manufacturing/bom", icon: Layers },
    ],
  },
];

function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    if (item.children) {
      return item.children.some(child => pathname === child.href || pathname.startsWith(child.href + "/"));
    }
    return false;
  });

  const isActive = item.href ? pathname === item.href : false;
  const hasActiveChild = item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + "/"));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            hasActiveChild
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            {item.label}
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isChildActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <child.icon className="h-4 w-4" />
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Factory className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">ERP System</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavItemComponent key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}
