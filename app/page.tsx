import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardStats } from "./actions";
import {
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Factory,
  TrendingUp,
  PackageCheck,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome to your ERP system. Here is a summary of your business.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Active Employees"
            value={stats.employees}
            icon="users"
          />
          <StatCard
            title="Departments"
            value={stats.departments}
            icon="building"
          />
          <StatCard
            title="Products"
            value={stats.products}
            icon="package"
          />
          <StatCard
            title="Active MO"
            value={stats.manufacturingOrders}
            subtitle="Manufacturing orders in progress"
            icon="factory"
          />
          <StatCard
            title="Stock Moves"
            value={stats.stockMoves || 0}
            subtitle="Total inventory movements"
            icon="packageCheck"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Purchase Orders</h2>
              <Link
                href="/purchase/orders"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-info/10 p-2">
                    <ShoppingCart className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats.purchaseOrders}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/10 p-2">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {formatCurrency(stats.purchaseTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Sales Orders</h2>
              <Link
                href="/sales/orders"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats.salesOrders}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/10 p-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {formatCurrency(stats.salesTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/employees"
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Employees</h3>
                <p className="text-sm text-muted-foreground">Manage employees and departments</p>
              </div>
            </div>
          </Link>

          <Link
            href="/inventory/products"
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Inventory</h3>
                <p className="text-sm text-muted-foreground">Track products and stock levels</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manufacturing/orders"
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <Factory className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Manufacturing</h3>
                <p className="text-sm text-muted-foreground">Manage production orders and BOMs</p>
              </div>
            </div>
          </Link>

          <Link
            href="/stock_management/app"
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <PackageCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Stock Management</h3>
                <p className="text-sm text-muted-foreground">Manage receipts and deliveries</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
