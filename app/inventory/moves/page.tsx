"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStockMoves } from "@/app/actions";

interface StockMove {
  id: string;
  name: string;
  date: string;
  status: string;
  batchNumber: string;
  sourceLocation: string;
  destinationLocation: string;
  operationType: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StockMovesPage() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getStockMoves();
      setMoves(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load stock moves",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<StockMove>[] = [
    { key: "name", label: "Reference" },
    {
      key: "date",
      label: "Date",
      render: (value) => formatDate(value as string),
    },
    { key: "operationType", label: "Operation Type" },
    { key: "sourceLocation", label: "Source" },
    { key: "destinationLocation", label: "Destination" },
    { key: "batchNumber", label: "Batch" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({
      orderDate: toISODateString(new Date()),
      deliveryDate: toISODateString(new Date()),
      status: "Draft",
      customerId: "",
    });
    setIsDialogOpen(true);

    // Redirect to Haipter link for creating sale order
    // window.open("https://teable-zervi-u34072.vm.elestio.app/base/bseTIY0IrZr61kt6u5E/app/appzewSTJbezZbqoNoi", "_blank");
  };

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
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stock Moves</h1>
            <p className="text-muted-foreground">
              Track inventory movements between locations
            </p>
          </div>
        </div>

        <DataTable
          data={moves}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search stock moves..."
          onAdd={handleAdd}
          addLabel="Create Stock Move"
          pageSize={15}
        />
      </div>
    </DashboardLayout>
  );
}
