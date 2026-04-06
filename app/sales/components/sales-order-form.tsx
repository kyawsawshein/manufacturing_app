"use client";

import * as React from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect, type Option } from "../components/searchable-select";
import { useToast } from "@/hooks/use-toast";
import {
  createSalesOrder,
  type Partner,
  type CustomerPO,
  type Location,
  type Product,
  type UnitOfMeasure,
  type SalesOrderLineInput,
} from "../app/actions";

interface SalesOrderFormProps {
  partners: Partner[];
  customerPOs: CustomerPO[];
  locations: Location[];
  products: Product[];
  unitsOfMeasure: UnitOfMeasure[];
  onSuccess?: () => void;
}

interface OrderLine {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  unitId: string;
  jobNo: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function SalesOrderForm({
  partners,
  customerPOs,
  locations,
  products,
  unitsOfMeasure,
  onSuccess,
}: SalesOrderFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Header fields
  const [customerId, setCustomerId] = React.useState("");
  const [poNoId, setPoNoId] = React.useState("");
  const [orderDate, setOrderDate] = React.useState(getToday());
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [sourceLocationId, setSourceLocationId] = React.useState("");
  const [isKitOrder, setIsKitOrder] = React.useState(false);

  // Order lines
  const [lines, setLines] = React.useState<OrderLine[]>([
    {
      id: generateId(),
      productId: "",
      qty: 1,
      unitPrice: 0,
      unitId: "",
      jobNo: "",
    },
  ]);

  // Convert data to options
  const partnerOptions: Option[] = partners.map((p) => ({
    value: p.id,
    label: p.Name,
  }));

  const poOptions: Option[] = customerPOs.map((po) => ({
    value: po.id,
    label: po.label,
  }));

  const locationOptions: Option[] = locations.map((loc) => ({
    value: loc.id,
    label: loc.locationCode,
  }));

  const productOptions: Option[] = products.map((p) => ({
    value: p.id,
    label: `${p.sku}${p.Name ? ` - ${p.Name}` : ""}`,
  }));

  const unitOptions: Option[] = unitsOfMeasure.map((u) => ({
    value: u.id,
    label: u.Name,
  }));

  // Create a product lookup for quick access to sale price
  const productLookup = React.useMemo(() => {
    const lookup: Record<string, Product> = {};
    products.forEach((p) => {
      lookup[p.id] = p;
    });
    return lookup;
  }, [products]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: generateId(),
        productId: "",
        qty: 1,
        unitPrice: 0,
        unitId: "",
        jobNo: "",
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof OrderLine, value: string | number) => {
    setLines(
      lines.map((line) => {
        if (line.id !== id) return line;

        const updatedLine = { ...line, [field]: value };

        // Auto-fill unit price when product is selected
        if (field === "productId" && value) {
          const product = productLookup[value as string];
          if (product?.salePrice) {
            updatedLine.unitPrice = product.salePrice;
          }
        }

        return updatedLine;
      })
    );
  };

  const calculateSubtotal = (line: OrderLine) => {
    return line.qty * line.unitPrice;
  };

  const totalAmount = lines.reduce((sum, line) => sum + calculateSubtotal(line), 0);

  const resetForm = () => {
    setCustomerId("");
    setPoNoId("");
    setOrderDate(getToday());
    setDeliveryDate("");
    setSourceLocationId("");
    setIsKitOrder(false);
    setLines([
      {
        id: generateId(),
        productId: "",
        qty: 1,
        unitPrice: 0,
        unitId: "",
        jobNo: "",
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerId) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" });
      return;
    }
    if (!poNoId) {
      toast({ title: "Error", description: "Please select a PO Number", variant: "destructive" });
      return;
    }
    if (!orderDate) {
      toast({ title: "Error", description: "Please select an order date", variant: "destructive" });
      return;
    }

    const invalidLines = lines.filter(
      (line) => !line.productId || line.qty <= 0 || line.unitPrice < 0
    );
    if (invalidLines.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for each order line (Product, Qty > 0, Unit Price >= 0)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderLines: SalesOrderLineInput[] = lines.map((line) => ({
        productId: line.productId,
        qty: line.qty,
        unitPrice: line.unitPrice,
        unitId: line.unitId || undefined,
        jobNo: line.jobNo || undefined,
      }));

      const result = await createSalesOrder(
        {
          customerId,
          poNoId,
          orderDate,
          deliveryDate: deliveryDate || undefined,
          sourceLocationId: sourceLocationId || undefined,
          isKitOrder,
        },
        orderLines
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `Sales Order ${result.soReference} created successfully!`,
        });
        resetForm();
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create sales order",
          variant: "destructive",
        });
      }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Sale Order Header */}
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Sale Order Header
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              Draft
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Customer */}
            <div className="space-y-2">
              <Label htmlFor="customer">
                Customer <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={partnerOptions}
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select customer..."
                searchPlaceholder="Search customers..."
              />
            </div>

            {/* PO Number */}
            <div className="space-y-2">
              <Label htmlFor="poNo">
                PO.No <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={poOptions}
                value={poNoId}
                onValueChange={setPoNoId}
                placeholder="Select PO number..."
                searchPlaceholder="Search PO numbers..."
              />
            </div>

            {/* Order Date */}
            <div className="space-y-2">
              <Label htmlFor="orderDate">
                Order Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            {/* Source Location */}
            <div className="space-y-2">
              <Label htmlFor="sourceLocation">Source Location</Label>
              <SearchableSelect
                options={locationOptions}
                value={sourceLocationId}
                onValueChange={setSourceLocationId}
                placeholder="Select location..."
                searchPlaceholder="Search locations..."
              />
            </div>

            {/* Is Kit Order */}
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isKitOrder"
                checked={isKitOrder}
                onCheckedChange={(checked) => setIsKitOrder(checked === true)}
              />
              <Label htmlFor="isKitOrder" className="cursor-pointer">
                Is Kit Order
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Sale Order Lines */}
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sale Order Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table Header - Desktop */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:px-2 lg:text-sm lg:font-medium lg:text-muted-foreground">
            <div className="col-span-3">
              Product <span className="text-destructive">*</span>
            </div>
            <div className="col-span-2">
              Qty <span className="text-destructive">*</span>
            </div>
            <div className="col-span-2">
              Unit Price <span className="text-destructive">*</span>
            </div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2">Job No</div>
            <div className="col-span-1 text-right">Subtotal</div>
          </div>

          {/* Order Lines */}
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-lg border bg-background p-4 lg:border-0 lg:bg-transparent lg:p-0"
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
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

                  {/* Unit Price */}
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block lg:hidden">
                      Unit Price <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
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

                  {/* Job No */}
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block lg:hidden">Job No</Label>
                    <Input
                      type="text"
                      value={line.jobNo}
                      onChange={(e) => updateLine(line.id, "jobNo", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Subtotal & Remove */}
                  <div className="flex items-center justify-between lg:col-span-1 lg:justify-end lg:gap-2">
                    <div className="lg:hidden">
                      <span className="text-sm text-muted-foreground">Subtotal: </span>
                      <span className="font-medium">
                        {calculateSubtotal(line).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <span className="hidden text-right font-medium lg:block">
                      {calculateSubtotal(line).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
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

          {/* Total */}
          <div className="flex items-center justify-end border-t pt-4">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Total Amount: </span>
              <span className="text-xl font-bold">
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? "Creating..." : "Submit Order"}
        </Button>
      </div>
    </form>
  );
}
