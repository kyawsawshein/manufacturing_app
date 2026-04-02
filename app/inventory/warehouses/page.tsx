"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Warehouse, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWarehouses } from "@/app/actions";

interface WarehouseData {
  id: string;
  name: string;
  company: string;
  status: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load warehouses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<WarehouseData>[] = [
    { key: "name", label: "Warehouse Name" },
    { key: "company", label: "Company" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Warehouse className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
            <p className="text-muted-foreground">
              Manage warehouse facilities
            </p>
          </div>
        </div>

        <DataTable
          data={warehouses}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search warehouses..."
          pageSize={15}
        />
      </div>
    </DashboardLayout>
  );
}
