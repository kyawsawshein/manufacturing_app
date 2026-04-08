"use client";

import { useEffect, useState, useTransition } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { BOMCreationForm } from "../components/bom-creation-form";
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
import { Layers, Loader2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  getBOMs,
  createBOM,
  updateBOM,
  deleteBOM,
  getBOMWithLines,
  calculateBOMTotalCost,
  checkBOMCircularReference,
} from "../app/actions";

interface BOM {
  id: string;
  Name: string;
  version: string;
  quantity: number;
  status: string;
  effectiveDate: string;
  reference: string;
  product: string;
}

interface BOMLine {
  id: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
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

export default function BOMPage() {
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [bomLines, setBOMLines] = useState<BOMLine[]>([]);
  const [bomCost, setBOMCost] = useState(0);
  const [circularRefCheck, setCircularRefCheck] = useState<{ hasCircular: boolean; path: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    version: "1.0",
    quantity: 1,
    status: "Draft",
    effectiveDate: toISODateString(new Date()),
    reference: "",
  });

  const loadData = async () => {
    try {
      const data = await getBOMs();
      setBOMs(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load BOMs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBOMDetails = async (bom: BOM) => {
    try {
      const [details, cost, circularCheck] = await Promise.all([
        getBOMWithLines(bom.id),
        calculateBOMTotalCost(bom.id),
        checkBOMCircularReference(bom.id),
      ]);
      setSelectedBOM(bom);
      setBOMLines(details.lines);
      setBOMCost(cost);
      setCircularRefCheck(circularCheck);
      setShowDetailsDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load BOM details",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<BOM>[] = [
    { key: "Name", label: "BOM Name" },
    { key: "product", label: "Product" },
    { key: "version", label: "Version" },
    { key: "reference", label: "Reference" },
    {
      key: "quantity",
      label: "Quantity",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
    {
      key: "effectiveDate",
      label: "Effective Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const handleAdd = () => {
    setIsFormDialogOpen(true);
  };

  const handleEdit = (bom: BOM) => {
    setEditingBOM(bom);
    setFormData({
      version: bom.version || "1.0",
      quantity: bom.quantity || 1,
      status: bom.status || "Draft",
      effectiveDate: bom.effectiveDate ? bom.effectiveDate.split("T")[0] : toISODateString(new Date()),
      reference: bom.reference || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (bom: BOM) => {
    if (confirm(`Are you sure you want to delete ${bom.Name}?`)) {
      startTransition(async () => {
        try {
          await deleteBOM(bom.id);
          await loadData();
          toast({
            title: "Success",
            description: "BOM deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete BOM",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingBOM) {
          await updateBOM(editingBOM.id, formData);
          toast({
            title: "Success",
            description: "BOM updated successfully",
          });
        } else {
          await createBOM(formData);
          toast({
            title: "Success",
            description: "BOM created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save BOM",
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
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bill of Materials</h1>
            <p className="text-muted-foreground">
              Manage product structures and component lists
            </p>
          </div>
        </div>

        {boms.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total BOMs</p>
                  <p className="text-2xl font-bold">{boms.length}</p>
                </div>
                <Layers className="h-8 w-8 opacity-50" />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active BOMs</p>
                  <p className="text-2xl font-bold">
                    {boms.filter(b => b.status === "Active").length}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 opacity-50" />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Version</p>
                  <p className="text-2xl font-bold">
                    {(boms.reduce((sum, b) => sum + parseFloat(b.version || "0"), 0) / boms.length).toFixed(1)}
                  </p>
                </div>
                <Layers className="h-8 w-8 opacity-50" />
              </div>
            </div>
          </div>
        )}

        <DataTable
          data={boms}
          columns={columns}
          searchKey="Name"
          searchPlaceholder="Search BOMs..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Create BOM"
          pageSize={15}
          onRowClick={(bom) => loadBOMDetails(bom)}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingBOM ? "Edit BOM" : "Create BOM"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="BOM reference code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  placeholder="e.g., 1.0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
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
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: e.target.value })
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
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Obsolete">Obsolete</SelectItem>
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
                {editingBOM ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* BOM Creation Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create BOM</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <BOMCreationForm />
            </div>
          </DialogContent>
        </Dialog>

        {/* BOM Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBOM ? `BOM - ${selectedBOM.Name}` : "BOM Details"}
              </DialogTitle>
            </DialogHeader>

            {selectedBOM && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="lines">Components</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">BOM Name</Label>
                      <p className="text-lg font-semibold">{selectedBOM.Name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Version</Label>
                        <p className="text-lg font-semibold">{selectedBOM.version}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                        <p className="text-lg font-semibold">{selectedBOM.product || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <StatusBadge status={selectedBOM.status} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Effective Date</Label>
                        <p className="text-lg font-semibold">{formatDate(selectedBOM.effectiveDate)}</p>
                      </div>
                    </div>
                    {bomCost > 0 && (
                      <div className="rounded-lg bg-primary/10 p-4">
                        <p className="text-sm text-muted-foreground">Total Material Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(bomCost)}</p>
                      </div>
                    )}
                    {circularRefCheck && (
                      <div className={`rounded-lg p-4 ${circularRefCheck.hasCircular ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'}`}>
                        <p className="text-sm font-medium">
                          {circularRefCheck.hasCircular ? "⚠️ Circular Reference Detected" : "✓ No Circular References"}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="lines" className="space-y-4">
                  {bomLines.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {bomLines.map((line) => (
                        <div
                          key={line.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex justify-between mb-2">
                            <p className="font-medium">{line.productName}</p>
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(line.totalCost)}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>Qty: {line.quantity.toFixed(2)}</div>
                            <div>Unit Cost: {formatCurrency(line.unitCost)}</div>
                            <div>Line Total: {formatCurrency(line.totalCost)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No components in this BOM.
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
