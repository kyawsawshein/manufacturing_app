"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPartners,
  getLocations,
  getProducts,
} from "@/app/actions";

interface PurchaseOrder {
  id: string;
  reference: string;
  orderDate: string;
  expectedDelivery: string;
  status: string;
  totalAmount: number;
  vendor: string;
}

interface Partner {
  id: string;
  Name: string;
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    orderDate: toISODateString(new Date()),
    expectedDelivery: toISODateString(new Date()),
    status: "Draft",
    vendorId: "",
  });

  const loadData = async () => {
    try {
      const [ordersData, vendorsData] = await Promise.all([
        getPurchaseOrders(),
        getPartners("Vendor"),
      ]);
      setOrders(ordersData);
      setVendors(vendorsData);
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

  const columns: Column<PurchaseOrder>[] = [
    { key: "reference", label: "PO Reference" },
    { key: "vendor", label: "Vendor" },
    {
      key: "orderDate",
      label: "Order Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "expectedDelivery",
      label: "Expected Delivery",
      render: (value) => formatDate(value as string),
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      render: (value) => formatCurrency(value as number),
      className: "text-right",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const handleAdd = () => {
    router.push("/purchase/orders/create");
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    const vendor = vendors.find((v) => v.Name === order.vendor);
    setFormData({
      orderDate: order.orderDate ? order.orderDate.split("T")[0] : toISODateString(new Date()),
      expectedDelivery: order.expectedDelivery ? order.expectedDelivery.split("T")[0] : toISODateString(new Date()),
      status: order.status || "Draft",
      vendorId: vendor?.id || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (order: PurchaseOrder) => {
    if (confirm(`Are you sure you want to delete ${order.reference}?`)) {
      startTransition(async () => {
        try {
          await deletePurchaseOrder(order.id);
          await loadData();
          toast({
            title: "Success",
            description: "Purchase order deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete purchase order",
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
          await updatePurchaseOrder(editingOrder.id, {
            orderDate: formData.orderDate,
            expectedDelivery: formData.expectedDelivery,
            status: formData.status,
          });
          toast({
            title: "Success",
            description: "Purchase order updated successfully",
          });
        } else {
          await createPurchaseOrder(formData);
          toast({
            title: "Success",
            description: "Purchase order created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save purchase order",
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
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
            <p className="text-muted-foreground">
              Manage purchase orders and vendor transactions
            </p>
          </div>
        </div>

        <DataTable
          data={orders}
          columns={columns}
          searchKey="reference"
          searchPlaceholder="Search purchase orders..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Create PO"
          pageSize={15}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Edit Purchase Order" : "Create Purchase Order"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingOrder && (
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vendorId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  value={formData.expectedDelivery}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedDelivery: e.target.value })
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
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
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
