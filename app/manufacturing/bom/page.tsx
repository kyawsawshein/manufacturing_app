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
import { Layers, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getBOMs,
  createBOM,
  updateBOM,
  deleteBOM,
} from "@/app/actions";

interface BOM {
  id: string;
  name: string;
  version: string;
  quantity: number;
  status: string;
  effectiveDate: string;
  reference: string;
  product: string;
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

export default function BOMPage() {
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);
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

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<BOM>[] = [
    { key: "name", label: "BOM Name" },
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
    setEditingBOM(null);
    setFormData({
      version: "1.0",
      quantity: 1,
      status: "Draft",
      effectiveDate: toISODateString(new Date()),
      reference: "",
    });
    setIsDialogOpen(true);
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
    if (confirm(`Are you sure you want to delete ${bom.name}?`)) {
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

        <DataTable
          data={boms}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search BOMs..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Create BOM"
          pageSize={15}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
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
      </div>
    </DashboardLayout>
  );
}
