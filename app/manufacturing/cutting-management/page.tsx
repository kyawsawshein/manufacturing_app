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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, Loader2, DollarSign, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  getAllCuttings,
  getCuttingLines,
  updateCutting,
  deleteCutting,
} from "../app/actions";

interface Cutting {
  id: string;
  Name: string;
  reference: string | null;
  status: string | null;
}

interface CuttingLine {
  id: string;
  productId: string | null;
  productName: string | null;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function CuttingManagementPage() {
  const router = useRouter();
  const [cuttings, setCuttings] = useState<Cutting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCutting, setSelectedCutting] = useState<Cutting | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [cuttingLines, setCuttingLines] = useState<CuttingLine[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getAllCuttings();
      setCuttings(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load cuttings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    router.push("/manufacturing/cutting-management/create");
  };

  const handleViewDetails = async (cutting: Cutting) => {
    setSelectedCutting(cutting);
    try {
      const lines = await getCuttingLines(cutting.id);
      setCuttingLines(lines);
      setShowDetailsDialog(true);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load cutting lines",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (cutting: Cutting) => {
    if (!confirm("Are you sure you want to delete this cutting?")) return;

    startTransition(async () => {
      try {
        await deleteCutting(cutting.id);
        toast({
          title: "Success",
          description: "Cutting deleted successfully",
        });
        loadData();
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete cutting",
          variant: "destructive",
        });
      }
    });
  };

  const columns: Column<Cutting>[] = [
    {
      key: "Name",
      label: "Name",
      render: (value, row) => row.Name,
    },
    {
      key: "reference",
      label: "Reference",
      render: (value, row) => row.reference || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (value, row) => <StatusBadge status={row.status || "Draft"} />,
    },
  ];

  const handleEdit = (cutting: Cutting) => {
    // For now, just show details. Could be expanded to edit functionality
    handleViewDetails(cutting);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cutting Management</h1>
            <p className="text-muted-foreground">
              Manage cutting patterns and their material requirements.
            </p>
          </div>
          {/* <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cutting
          </Button> */}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <DataTable
              data={cuttings}
              columns={columns}
              searchKey="Name"
              searchPlaceholder="Search cuttings..."
              onAdd={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              addLabel="Create Cutting"
            />
          </div>
        </div>

        {/* Cutting Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                {selectedCutting?.Name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="lines" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lines">Cutting Lines</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="lines" className="space-y-4">
                <div className="rounded-lg border">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Material Requirements</h3>
                    {cuttingLines.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Product</th>
                              <th className="text-right p-2">Quantity</th>
                              <th className="text-right p-2">Unit Cost</th>
                              <th className="text-right p-2">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cuttingLines.map((line) => (
                              <tr key={line.id} className="border-b">
                                <td className="p-2">{line.productName || "Unknown"}</td>
                                <td className="text-right p-2">
                                  {line.quantity?.toFixed(2) || "0.00"}
                                </td>
                                <td className="text-right p-2">
                                  {formatCurrency(line.unitCost || 0)}
                                </td>
                                <td className="text-right p-2">
                                  {formatCurrency(line.totalCost || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No cutting lines found
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Total Cost</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        cuttingLines.reduce((sum, line) => sum + (line.totalCost || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="h-4 w-4" />
                      <span className="font-medium">Total Items</span>
                    </div>
                    <p className="text-2xl font-bold">{cuttingLines.length}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}