"use client";

import { useEffect, useState, useTransition } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
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
import { Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/app/actions";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  productCode: string;
  barcode: string;
  cost: number;
  salePrice: number;
  onhand: number;
  availableQty: number;
  reorderPoint: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    productCode: "",
    barcode: "",
    cost: 0,
    salePrice: 0,
    reorderPoint: 0,
  });

  const loadData = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Product>[] = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Product Name" },
    { key: "productCode", label: "Product Code" },
    { key: "barcode", label: "Barcode" },
    {
      key: "cost",
      label: "Cost",
      render: (value) => formatCurrency(value as number),
      className: "text-right",
    },
    {
      key: "salePrice",
      label: "Sale Price",
      render: (value) => formatCurrency(value as number),
      className: "text-right",
    },
    {
      key: "onhand",
      label: "On Hand",
      render: (value, row) => {
        const qty = value as number;
        const reorder = row.reorderPoint;
        return (
          <span
            className={cn(
              "font-medium",
              qty <= 0 ? "text-destructive" : qty <= reorder ? "text-warning" : "text-foreground"
            )}
          >
            {qty.toFixed(2)}
          </span>
        );
      },
      className: "text-right",
    },
    {
      key: "availableQty",
      label: "Available",
      render: (value) => (value as number).toFixed(2),
      className: "text-right",
    },
  ];

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: "",
      name: "",
      productCode: "",
      barcode: "",
      cost: 0,
      salePrice: 0,
      reorderPoint: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || "",
      name: product.name || "",
      productCode: product.productCode || "",
      barcode: product.barcode || "",
      cost: product.cost || 0,
      salePrice: product.salePrice || 0,
      reorderPoint: product.reorderPoint || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      startTransition(async () => {
        try {
          await deleteProduct(product.id);
          await loadData();
          toast({
            title: "Success",
            description: "Product deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete product",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, formData);
          toast({
            title: "Success",
            description: "Product updated successfully",
          });
        } else {
          await createProduct(formData);
          toast({
            title: "Success",
            description: "Product created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save product",
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
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">
              View and manage product inventory
            </p>
          </div>
        </div>

        <DataTable
          data={products}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search products..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Product"
          pageSize={15}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="Product SKU"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="Barcode"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productCode">Product Code</Label>
                <Input
                  id="productCode"
                  value={formData.productCode}
                  onChange={(e) =>
                    setFormData({ ...formData, productCode: e.target.value })
                  }
                  placeholder="Product code/description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Minimum stock level before reorder"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
