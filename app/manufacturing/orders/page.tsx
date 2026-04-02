"use client";

import { useEffect, useState, useTransition } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Factory, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getManufacturingOrders,
  createManufacturingOrder,
  updateManufacturingOrder,
  deleteManufacturingOrder,
  getBOMs,
} from "@/app/actions";

interface ManufacturingOrder {
  id: string;
  reference: string;
  date: string;
  startDate: string;
  endDate: string;
  status: string;
  quantity: number;
  finishedQty: number;
  finishedProduct: string;
  bom: string;
}

interface BOM {
  id: string;
  name: string;
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

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function ManufacturingOrdersPage() {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ManufacturingOrder | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: toISODateString(new Date()),
    startDate: toISODateString(new Date()),
    endDate: toISODateString(new Date()),
    status: "Draft",
    quantity: 1,
    bomId: "",
  });

  const loadData = async () => {
    try {
      const [ordersData, bomsData] = await Promise.all([
        getManufacturingOrders(),
        getBOMs(),
      ]);
      setOrders(ordersData);
      setBOMs(bomsData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<ManufacturingOrder>[] = [
    { key: "reference", label: "MO Reference" },
    { key: "finishedProduct", label: "Product" },
    { key: "bom", label: "BOM" },
    {
      key: "date",
      label: "Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "quantity",
      label: "Qty to Produce",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
    {
      key: "finishedQty",
      label: "Finished Qty",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({
      date: toISODateString(new Date()),
      startDate: toISODateString(new Date()),
      endDate: toISODateString(new Date()),
      status: "Draft",
      quantity: 1,
      bomId: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (order: ManufacturingOrder) => {
    setEditingOrder(order);
    const bom = boms.find((b) => b.name === order.bom);
    setFormData({
      date: order.date ? order.date.split("T")[0] : toISODateString(new Date()),
      startDate: order.startDate ? order.startDate.split("T")[0] : toISODateString(new Date()),
      endDate: order.endDate ? order.endDate.split("T")[0] : toISODateString(new Date()),
      status: order.status || "Draft",
      quantity: order.quantity || 1,
      bomId: bom?.id || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (order: ManufacturingOrder) => {
    if (confirm(`Are you sure you want to delete ${order.reference}?`)) {
      startTransition(async () => {
        try {
          await deleteManufacturingOrder(order.id);
          await loadData();
          toast({
            title: "Success",
            description: "Manufacturing order deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete manufacturing order",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingOrder) {
          await updateManufacturingOrder(editingOrder.id, {
            date: formData.date,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            quantity: formData.quantity,
          });
          toast({
            title: "Success",
            description: "Manufacturing order updated successfully",
          });
        } else {
          await createManufacturingOrder({
            ...formData,
          });
          toast({
            title: "Success",
            description: "Manufacturing order created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save manufacturing order",
          variant: "destructive",
        });
      }
    });
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
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manufacturing Orders</h1>
            <p className="text-muted-foreground">
              Manage production orders and manufacturing plans
            </p>
          </div>
        </div>

        <DataTable
          data={orders}
          columns={columns}
          searchKey="reference"
          searchPlaceholder="Search manufacturing orders..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Create MO"
          pageSize={15}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Edit Manufacturing Order" : "Create Manufacturing Order"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingOrder && (
                <div className="grid gap-2">
                  <Label htmlFor="bom">Bill of Materials</Label>
                  <Select
                    value={formData.bomId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bomId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select BOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {boms.map((bom) => (
                        <SelectItem key={bom.id} value={bom.id}>
                          {bom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity to Produce</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Cancel">Cancel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingOrder ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
