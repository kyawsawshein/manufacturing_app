"use client";

import { useEffect, useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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
import { SearchableSelect } from "@/components/searchable-select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBOMs, updateBOM, getProducts } from "../../../app/actions";

interface BOM {
  id: string;
  Name: string;
  version: string;
  quantity: number;
  status: string;
  effectiveDate: string;
  reference: string;
  product: string;
  productId?: string;
}

interface BOMEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function BOMEditPage({ params }: BOMEditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [bom, setBOM] = useState<BOM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    productId: "",
    version: "1.0",
    quantity: 1,
    status: "Draft",
    effectiveDate: toISODateString(new Date()),
    reference: "",
    product: "", // Keep for fallback/display
  });

  useEffect(() => {
    async function loadBOM() {
      try {
        // Fetch both BOMs and Products in parallel
        const [boms, productsData] = await Promise.all([
          getBOMs(),
          getProducts()
        ]);

        setProducts(productsData);

        const productOptions = productsData.map((p: any) => ({
          value: p.id,
          label: `${p.sku}${p.Name ? ` - ${p.Name}` : ""}`,
        }));

        const found = boms.find((item) => item.id === id);
        if (!found) {
          toast({
            title: "Not found",
            description: "BOM does not exist.",
            variant: "destructive",
          });
          router.push("/manufacturing/bom");
          return;
        }

        setBOM(found);
        setFormData({
          productId: found.productId || "",
          version: found.version || "1.0",
          quantity: found.quantity || 1,
          status: found.status || "Draft",
          effectiveDate: found.effectiveDate ? found.effectiveDate.split("T")[0] : toISODateString(new Date()),
          reference: found.reference || "",
          product: found.product || "",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load BOM data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadBOM();
  }, [id, router, toast]);

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await updateBOM(id, {
          productId: formData.productId,
          version: formData.version,
          quantity: formData.quantity,
          status: formData.status,
          effectiveDate: formData.effectiveDate,
          reference: formData.reference,
        });

        toast({
          title: "Success",
          description: "BOM updated successfully.",
        });

        router.push("/manufacturing/bom");
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update BOM.",
          variant: "destructive",
        });
      }
    });
  };

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.sku}${p.Name ? ` - ${p.Name}` : ""}`,
  }));

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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-3">
              <span className="text-primary text-xl">✎</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Edit BOM
              </h1>
              <p className="text-muted-foreground">
                Update BOM metadata and save changes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 max-w-4xl">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="Product name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="BOM reference code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
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

            <div className="flex items-center gap-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/manufacturing/bom")}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Updating..." : "Update BOM"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
