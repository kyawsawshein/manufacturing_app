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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Loader2, Zap, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getManufacturingOrders,
  createManufacturingOrder,
  updateManufacturingOrder,
  deleteManufacturingOrder,
  getBOMs,
  createMORawMaterialsFromBOM,
  getMORawMaterials,
  calculateMORawMaterialCost,
  getManufacturingOrderWithCosts,
  exploseBOM,
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

interface RawMaterial {
  id: string;
  quantity: number;
  consumeQty: number;
  productName: string;
  productCost: number;
}

interface BOMExplosionItem {
  id: string;
  name: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  level: number;
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
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
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
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [explosionItems, setExplosionItems] = useState<BOMExplosionItem[]>([]);
  const [moRawMaterialCost, setMORawMaterialCost] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isExploding, setIsExploding] = useTransition();
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

  const loadOrderDetails = async (order: ManufacturingOrder) => {
    try {
      const [materials, cost] = await Promise.all([
        getMORawMaterials(order.id),
        calculateMORawMaterialCost(order.id),
      ]);
      setRawMaterials(materials);
      setMORawMaterialCost(cost);
      setSelectedOrder(order);
      setShowDetailsDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  const handleBOMExplosion = async (order: ManufacturingOrder) => {
    const selectedBom = boms.find(b => b.name === order.bom);
    if (!selectedBom) {
      toast({
        title: "Error",
        description: "No BOM found for this order",
        variant: "destructive",
      });
      return;
    }

    startExplosionTransition(async () => {
      try {
        const items = await exploseBOM(selectedBom.id, order.quantity);
        setExplosionItems(items);
        setSelectedOrder(order);
        setShowDetailsDialog(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to explode BOM",
          variant: "destructive",
        });
      }
    });
  };

  const handleCreateRawMaterials = async (order: ManufacturingOrder) => {
    const selectedBom = boms.find(b => b.name === order.bom);
    if (!selectedBom) {
      toast({
        title: "Error",
        description: "No BOM found for this order",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createMORawMaterialsFromBOM(order.id, selectedBom.id, order.quantity);
        if (result.success) {
          toast({
            title: "Success",
            description: `Created ${result.count} raw material lines from BOM`,
          });
          await loadOrderDetails(order);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create raw materials",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create raw materials",
          variant: "destructive",
        });
      }
    });
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

        {orders.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <Factory className="h-8 w-8 opacity-50" />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === "Processing").length}
                  </p>
                </div>
                <Zap className="h-8 w-8 opacity-50" />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {orders.reduce((sum, o) => sum + o.quantity, 0).toFixed(0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 opacity-50" />
              </div>
            </div>
          </div>
        )}

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
          onRowClick={(order) => loadOrderDetails(order)}
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

        {/* Order Details Dialog with Cost and BOM Explosion */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedOrder ? `Manufacturing Order - ${selectedOrder.reference}` : "Order Details"}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="materials">Raw Materials</TabsTrigger>
                  <TabsTrigger value="explosion">BOM Explosion</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                      <p className="text-lg font-semibold">{selectedOrder.finishedProduct}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">BOM</Label>
                      <p className="text-lg font-semibold">{selectedOrder.bom}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Qty to Produce</Label>
                        <p className="text-lg font-semibold">{selectedOrder.quantity.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Finished Qty</Label>
                        <p className="text-lg font-semibold">{selectedOrder.finishedQty.toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    {moRawMaterialCost > 0 && (
                      <div className="rounded-lg bg-primary/10 p-4">
                        <p className="text-sm text-muted-foreground">Total Raw Material Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(moRawMaterialCost)}</p>
                        <p className="text-sm text-muted-foreground">
                          Per Unit: {formatCurrency(moRawMaterialCost / selectedOrder.quantity)}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCreateRawMaterials(selectedOrder)}
                      disabled={isPending}
                      className="w-full"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Populate from BOM
                        </>
                      )}
                    </Button>
                  </div>
                  {rawMaterials.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {rawMaterials.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flexjustify-between mb-2">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(item.quantity * item.productCost)}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>Qty: {item.quantity.toFixed(2)}</div>
                            <div>Unit Cost: {formatCurrency(item.productCost)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No raw materials. Click "Populate from BOM" to create them.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="explosion" className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBOMExplosion(selectedOrder)}
                      disabled={isExploding}
                      className="w-full"
                    >
                      {isExploding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exploding...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Explode BOM
                        </>
                      )}
                    </Button>
                  </div>
                  {explosionItems.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {explosionItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border p-3"
                          style={{ marginLeft: `${item.level * 16}px` }}
                        >
                          <div className="flex justify-between mb-2">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">{item.name}</p>
                            </div>
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(item.totalCost)}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>Qty: {item.quantity.toFixed(2)}</div>
                            <div>Unit Cost: {formatCurrency(item.unitCost)}</div>
                            <div>Level: {item.level}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click "Explode BOM" to see all materials in flat view.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
