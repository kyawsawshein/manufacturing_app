"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Factory, Scissors, Package, DollarSign, Calendar, FileText } from "lucide-react";
import type { Product, BOM, CostPreview as CostPreviewType } from "@/app/actions";
import {
  getProducts,
  getBOMsByProduct,
  getAllBOMs,
  calculateCostPreview,
  createMO,
} from "@/app/actions";

type MOType = "Production" | "Cutting";

export function MOCreationForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [moType, setMOType] = useState<MOType>("Production");
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [bomId, setBomId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [laborCost, setLaborCost] = useState<number>(0);
  const [machineCost, setMachineCost] = useState<number>(0);
  const [overheadCost, setOverheadCost] = useState<number>(0);
  const [reference, setReference] = useState<string>("");

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [costPreview, setCostPreview] = useState<CostPreviewType | null>(null);

  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBOMs, setLoadingBOMs] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);

  // Load products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, [toast]);

  // Load BOMs when product changes (for Production type)
  useEffect(() => {
    async function loadBOMs() {
      if (!productId) {
        setBoms([]);
        setBomId("");
        return;
      }

      setLoadingBOMs(true);
      try {
        const data = await getBOMsByProduct(productId);
        setBoms(data);
        
        // Auto-select default BOM if available
        const selectedProduct = products.find((p) => p.id === productId);
        if (selectedProduct?.defaultBomId) {
          const defaultBom = data.find((b) => b.id === selectedProduct.defaultBomId);
          if (defaultBom) {
            setBomId(defaultBom.id);
          } else if (data.length > 0) {
            setBomId(data[0].id);
          }
        } else if (data.length > 0) {
          setBomId(data[0].id);
        } else {
          setBomId("");
        }
      } catch (error) {
        console.error("Failed to load BOMs:", error);
      } finally {
        setLoadingBOMs(false);
      }
    }

    if (moType === "Production") {
      loadBOMs();
    }
  }, [productId, moType, products]);

  // Calculate cost preview when relevant fields change
  useEffect(() => {
    async function updateCostPreview() {
      if (!bomId || quantity <= 0) {
        setCostPreview(null);
        return;
      }

      setLoadingCost(true);
      try {
        const preview = await calculateCostPreview(
          bomId,
          quantity,
          laborCost,
          machineCost,
          overheadCost
        );
        setCostPreview(preview);
      } catch (error) {
        console.error("Failed to calculate cost:", error);
      } finally {
        setLoadingCost(false);
      }
    }

    const debounce = setTimeout(updateCostPreview, 300);
    return () => clearTimeout(debounce);
  }, [bomId, quantity, laborCost, machineCost, overheadCost]);

  // Reset form when MO type changes
  useEffect(() => {
    setBomId("");
    setBoms([]);
    setCostPreview(null);
  }, [moType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      toast({
        title: "Validation Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        await createMO({
          moType,
          productId,
          quantity,
          bomId: moType === "Production" ? bomId : null,
          cuttingBomId: moType === "Cutting" ? bomId : null,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          laborCost,
          machineCost,
          overheadCost,
          reference: reference || undefined,
        });

        toast({
          title: "Success",
          description: "Manufacturing Order created successfully",
        });

        // Reset form
        setProductId("");
        setQuantity(1);
        setBomId("");
        setStartDate("");
        setEndDate("");
        setLaborCost(0);
        setMachineCost(0);
        setOverheadCost(0);
        setReference("");
        setCostPreview(null);
      } catch (error) {
        console.error("Failed to create MO:", error);
        toast({
          title: "Error",
          description: "Failed to create Manufacturing Order",
          variant: "destructive",
        });
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* MO Type Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Order Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={moType === "Production" ? "default" : "outline"}
                  className="flex-1 h-20 flex-col gap-2"
                  onClick={() => setMOType("Production")}
                >
                  <Factory className="h-6 w-6" />
                  <span>Production</span>
                </Button>
                <Button
                  type="button"
                  variant={moType === "Cutting" ? "default" : "outline"}
                  className="flex-1 h-20 flex-col gap-2"
                  onClick={() => setMOType("Cutting")}
                >
                  <Scissors className="h-6 w-6" />
                  <span>Cutting</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Product Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <Select
                    value={productId}
                    onValueChange={setProductId}
                    disabled={loadingProducts}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder={loadingProducts ? "Loading..." : "Select a product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.productCode ? `[${product.productCode}] ` : ""}
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              {/* BOM Selection - Conditional based on MO Type */}
              {moType === "Production" && (
                <div className="space-y-2">
                  <Label htmlFor="bom">Bill of Materials (BOM)</Label>
                  <Select
                    value={bomId}
                    onValueChange={setBomId}
                    disabled={loadingBOMs || !productId}
                  >
                    <SelectTrigger id="bom">
                      <SelectValue
                        placeholder={
                          loadingBOMs
                            ? "Loading..."
                            : !productId
                            ? "Select a product first"
                            : boms.length === 0
                            ? "No BOMs available"
                            : "Select a BOM"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {boms.map((bom) => (
                        <SelectItem key={bom.id} value={bom.id}>
                          {bom.name}
                          {bom.reference ? ` - ${bom.reference}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {moType === "Cutting" && (
                <div className="space-y-2">
                  <Label htmlFor="cutting-bom">Cutting Pattern</Label>
                  <Select
                    value={bomId}
                    onValueChange={setBomId}
                    disabled={!productId}
                  >
                    <SelectTrigger id="cutting-bom">
                      <SelectValue
                        placeholder={
                          !productId
                            ? "Select a product first"
                            : "Select a cutting pattern"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No cutting pattern</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Cutting patterns are linked separately for cutting orders
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Optional reference number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Planned Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Planned End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Center Costs */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Work Center Costs (per unit)
              </CardTitle>
              <CardDescription>
                Enter estimated costs per unit for labor, machine, and overhead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="labor-cost">Labor Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="labor-cost"
                      type="number"
                      min={0}
                      step={0.01}
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="machine-cost">Machine Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="machine-cost"
                      type="number"
                      min={0}
                      step={0.01}
                      value={machineCost}
                      onChange={(e) => setMachineCost(Number(e.target.value) || 0)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overhead-cost">Overhead Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="overhead-cost"
                      type="number"
                      min={0}
                      step={0.01}
                      value={overheadCost}
                      onChange={(e) => setOverheadCost(Number(e.target.value) || 0)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Cost Preview
                </CardTitle>
                <CardDescription>
                  Estimated costs based on BOM and quantity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingCost ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : costPreview ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Raw Materials</span>
                        <span className="font-medium">
                          {formatCurrency(costPreview.rawMaterialsCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Labor</span>
                        <span className="font-medium">
                          {formatCurrency(costPreview.laborCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Machine</span>
                        <span className="font-medium">
                          {formatCurrency(costPreview.machineCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overhead</span>
                        <span className="font-medium">
                          {formatCurrency(costPreview.overheadCost)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total Cost</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(costPreview.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost per Unit</span>
                        <span className="font-medium text-primary">
                          {formatCurrency(costPreview.unitCost)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {!bomId
                      ? "Select a BOM to see cost preview"
                      : quantity <= 0
                      ? "Enter a valid quantity"
                      : "Cost preview unavailable"}
                  </div>
                )}

                <Separator />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isPending || !productId || quantity <= 0}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Factory className="mr-2 h-4 w-4" />
                      Create MO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}
