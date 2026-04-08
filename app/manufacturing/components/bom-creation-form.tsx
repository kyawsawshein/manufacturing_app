"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type Option } from "@/components/searchable-select";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getProducts,
  getUnitsOfMeasure,
  getHookLoopItems,
  createBOMWithLines,
  type HookLoopItem,
} from "../../actions";

interface BOMLine {
  id: string;
  productId: string;
  qty: number;
  quantity: number;
  unitId: string;
  hookLoopItemIds: string[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function BOMCreationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Header fields
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState("");

  // BOM lines
  const [lines, setLines] = useState<BOMLine[]>([
    {
      id: generateId(),
      productId: "",
      qty: 1,
      quantity: 1,
      unitId: "",
      hookLoopItemIds: [],
    },
  ]);

  // Data for dropdowns
  const [products, setProducts] = useState<any[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<any[]>([]);
  const [hookLoopItems, setHookLoopItems] = useState<HookLoopItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, unitsData, hookLoopItemsData] = await Promise.all([
          getProducts(),
          getUnitsOfMeasure(),
          getHookLoopItems(),
        ]);
        setProducts(productsData);
        setUnitsOfMeasure(unitsData);
        setHookLoopItems(hookLoopItemsData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [toast]);

  // Convert data to options
  const productOptions: Option[] = products.map((p) => ({
    value: p.id,
    label: `${p.sku}${p.Name ? ` - ${p.Name}` : ""}`,
  }));

  const unitOptions: Option[] = unitsOfMeasure.map((u) => ({
    value: u.id,
    label: u.Name,
  }));

  const hookLoopOptions: Option[] = hookLoopItems.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: generateId(),
        productId: "",
        qty: 1,
        quantity: 1,
        unitId: "",
        hookLoopItemIds: [],
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof BOMLine, value: string | number) => {
    setLines(
      lines.map((line) => {
        if (line.id !== id) return line;
        return { ...line, [field]: value };
      })
    );
  };

  const toggleHookLoopItem = (lineId: string, itemId: string) => {
    setLines(
      lines.map((line) => {
        if (line.id !== lineId) return line;
        const existing = line.hookLoopItemIds.includes(itemId);
        return {
          ...line,
          hookLoopItemIds: existing
            ? line.hookLoopItemIds.filter((id) => id !== itemId)
            : [...line.hookLoopItemIds, itemId],
        };
      })
    );
  };

  const resetForm = () => {
    setProductId("");
    setQuantity(1);
    setReference("");
    setLines([
      {
        id: generateId(),
        productId: "",
        qty: 1,
        quantity: 1,
        unitId: "",
        hookLoopItemIds: [],
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!productId) {
      toast({ title: "Error", description: "Please select a product", variant: "destructive" });
      return;
    }
    if (quantity <= 0) {
      toast({ title: "Error", description: "Quantity must be greater than 0", variant: "destructive" });
      return;
    }

    const invalidLines = lines.filter(
      (line) => !line.productId || line.qty <= 0 || line.quantity <= 0 || !line.unitId
    );
    if (invalidLines.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for each BOM line (Product, Qty > 0, Quantity > 0, Unit)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createBOMWithLines({
        productId,
        quantity,
        reference: reference || "",
        lines: lines.map((line) => ({
          productId: line.productId,
          qty: line.qty,
          quantity: line.quantity,
          unitId: line.unitId,
          hookLoopItemIds: line.hookLoopItemIds,
        })),
      });

      toast({
        title: "Success",
        description: "BOM created successfully!",
      });
      resetForm();
      router.push("/manufacturing/bom");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: BOM Header */}
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              BOM Header
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Product */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Product <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={productOptions}
                value={productId}
                onValueChange={setProductId}
                placeholder="Select product..."
                searchPlaceholder="Search by SKU..."
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="BOM reference code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: BOM Lines */}
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">BOM Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add BOM Line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table Header - Desktop */}
          <div className="hidden lg:grid lg:grid-cols-13 lg:gap-4 lg:px-2 lg:text-sm lg:font-medium lg:text-muted-foreground">
            <div className="col-span-3">
              Product <span className="text-destructive">*</span>
            </div>
            <div className="col-span-2">
              Qty <span className="text-destructive">*</span>
            </div>
            <div className="col-span-2">
              Quantity <span className="text-destructive">*</span>
            </div>
            <div className="col-span-3">H&L Items</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-1" />
          </div>

          {/* BOM Lines */}
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-lg border bg-background p-4 lg:border-0 lg:bg-transparent lg:p-0"
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-13 lg:items-center">
                  {/* Product */}
                  <div className="lg:col-span-3">
                    <Label className="mb-2 block lg:hidden">
                      Product <span className="text-destructive">*</span>
                    </Label>
                    <SearchableSelect
                      options={productOptions}
                      value={line.productId}
                      onValueChange={(value) => updateLine(line.id, "productId", value)}
                      placeholder="Select product..."
                      searchPlaceholder="Search by SKU..."
                    />
                  </div>

                  {/* Qty */}
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block lg:hidden">
                      Qty <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.qty}
                      onChange={(e) =>
                        updateLine(line.id, "qty", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block lg:hidden">
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                    />
                  </div>

                  {/* H&L Items */}
                  <div className="lg:col-span-3">
                    <Label className="mb-2 block lg:hidden">H&L Items</Label>
                    <SearchableSelect
                      options={hookLoopOptions}
                      value={""}
                      onValueChange={(value) => {
                        if (value) toggleHookLoopItem(line.id, value);
                      }}
                      placeholder="Add H&L item..."
                      searchPlaceholder="Search Hook Loop items..."
                    />
                    {line.hookLoopItemIds.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {line.hookLoopItemIds.map((itemId) => {
                          const item = hookLoopItems.find((hl) => hl.id === itemId);
                          return (
                            <div
                              key={itemId}
                              className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-1 text-xs"
                            >
                              <span>{item?.label ?? itemId}</span>
                              <button
                                type="button"
                                onClick={() => toggleHookLoopItem(line.id, itemId)}
                                className="ml-2 rounded-full text-muted-foreground hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  {/* Unit */}
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block lg:hidden">Unit</Label>
                    <SearchableSelect
                      options={unitOptions}
                      value={line.unitId}
                      onValueChange={(value) => updateLine(line.id, "unitId", value)}
                      placeholder="Select unit..."
                      searchPlaceholder="Search units..."
                    />
                  </div>

                  {/* Remove */}
                  <div className="flex items-center justify-end lg:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length === 1}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? "Creating..." : "Create BOM"}
        </Button>
      </div>
    </form>
  );
}