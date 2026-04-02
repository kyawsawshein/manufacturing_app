"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Boxes, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStockOnHand } from "@/app/actions";

interface StockOnHand {
  id: string;
  name: string;
  qty: number;
  availableQty: number;
  reservedQty: number;
  status: string;
  product: string;
  location: string;
}

export default function StockOnHandPage() {
  const [stock, setStock] = useState<StockOnHand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getStockOnHand();
      setStock(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load stock data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<StockOnHand>[] = [
    { key: "name", label: "Reference" },
    { key: "product", label: "Product" },
    { key: "location", label: "Location" },
    {
      key: "qty",
      label: "Quantity",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
    {
      key: "availableQty",
      label: "Available",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
    {
      key: "reservedQty",
      label: "Reserved",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
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
            <Boxes className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stock On Hand</h1>
            <p className="text-muted-foreground">
              View current inventory quantities by location
            </p>
          </div>
        </div>

        <DataTable
          data={stock}
          columns={columns}
          searchKey="product"
          searchPlaceholder="Search by product..."
          pageSize={15}
        />
      </div>
    </DashboardLayout>
  );
}
