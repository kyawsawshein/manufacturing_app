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
  getSalesOrders,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getPartners,
  getCustomerPO,
  getLocations,
  getProducts,
  getUnitsOfMeasure,
} from "../app/actions";

interface SalesOrder {
  id: string;
  Name: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  customer: string;
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

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    orderDate: toISODateString(new Date()),
    deliveryDate: toISODateString(new Date()),
    status: "Draft",
    customerId: "",
  });

  const loadData = async () => {
    try {
      const [ordersData, customersData] = await Promise.all([
        getSalesOrders(),
        getPartners("Customer"),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
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

  const columns: Column<SalesOrder>[] = [
    { key: "Name", label: "SO Reference" },
    { key: "customer", label: "Customer" },
    {
      key: "orderDate",
      label: "Order Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "deliveryDate",
      label: "Delivery Date",
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
    router.push("/sales/orders/create");
  };

  const handleEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    const customer = customers.find((c) => c.Name === order.customer);
    setFormData({
      orderDate: order.orderDate ? order.orderDate.split("T")[0] : toISODateString(new Date()),
      deliveryDate: order.deliveryDate ? order.deliveryDate.split("T")[0] : toISODateString(new Date()),
      status: order.status || "Draft",
      customerId: customer?.id || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (order: SalesOrder) => {
    if (confirm(`Are you sure you want to delete ${order.Name}?`)) {
      startTransition(async () => {
        try {
          await deleteSalesOrder(order.id);
          await loadData();
          toast({
            title: "Success",
            description: "Sales order deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete sales order",
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
          await updateSalesOrder(editingOrder.id, {
            orderDate: formData.orderDate,
            deliveryDate: formData.deliveryDate,
            status: formData.status,
          });
          toast({
            title: "Success",
            description: "Sales order updated successfully",
          });
        } else {
          await createSalesOrder(formData);
          toast({
            title: "Success",
            description: "Sales order created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save sales order",
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
            <h1 className="text-2xl font-bold text-foreground">Sales Orders</h1>
            <p className="text-muted-foreground">
              Manage sales orders and customer transactions
            </p>
          </div>
        </div>

        <DataTable
          data={orders}
          columns={columns}
          searchKey="Name"
          searchPlaceholder="Search sales orders..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Create SO"
          pageSize={15}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Edit Sales Order" : "Create Sales Order"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingOrder && (
                <div className="grid gap-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.Name}
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
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDate: e.target.value })
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
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Invoiced">Invoiced</SelectItem>
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
