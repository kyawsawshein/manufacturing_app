"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Plus, Trash2, ShoppingCart, Loader2, CheckCircle } from "lucide-react";
import type { Vendor, Location, Product } from "@/app/actions";
import { createPurchaseOrder } from "@/app/actions";

import { useToast } from "@/hooks/use-toast";

interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit: string | null;
}

interface PurchaseOrderFormProps {
  vendors: Vendor[];
  locations: Location[];
  products: Product[];
  onSuccess?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PurchaseOrderForm({
  vendors,
  locations,
  products,
  onSuccess,
}: PurchaseOrderFormProps) {
  const { toast } = useToast();
  // Header fields
  const [vendorId, setVendorId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expectedDelivery, setExpectedDelivery] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");

  // Order lines
  const [lines, setLines] = useState<OrderLineItem[]>([]);

  // New line inputs
  const [newProductId, setNewProductId] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<string>("");
  const [newUnitPrice, setNewUnitPrice] = useState<string>("");

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product lookup map
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // When product changes, auto-fill unit price from cost
  const handleProductChange = useCallback(
    (productId: string) => {
      setNewProductId(productId);
      const product = productMap.get(productId);
      if (product && product.cost > 0) {
        setNewUnitPrice(product.cost.toString());
      }
    },
    [productMap]
  );

  const addLine = useCallback(() => {
    if (!newProductId || !newQuantity || !newUnitPrice) return;

    const product = productMap.get(newProductId);
    if (!product) return;

    const qty = parseFloat(newQuantity);
    const price = parseFloat(newUnitPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) return;

    const newLine: OrderLineItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: `${product.sku} - ${product.Name}`,
      quantity: qty,
      unitPrice: price,
      unit: product.uom,
    };

    setLines((prev) => [...prev, newLine]);
    setNewProductId("");
    setNewQuantity("");
    setNewUnitPrice("");
  }, [newProductId, newQuantity, newUnitPrice, productMap]);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const updateLineQuantity = useCallback((lineId: string, value: string) => {
    const qty = parseFloat(value);
    if (isNaN(qty) || qty <= 0) return;
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, quantity: qty } : l))
    );
  }, []);

  const updateLinePrice = useCallback((lineId: string, value: string) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) return;
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, unitPrice: price } : l))
    );
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0
    );
    return { subtotal, total: subtotal };
  }, [lines]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await createPurchaseOrder({
      vendorId,
      orderDate,
      expectedDelivery,
      destinationId,
      lines: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Success",
        description: `Purchase Order ${result.poReference} created successfully!`,
      });
      // Reset form
      setVendorId("");
      setOrderDate(new Date().toISOString().split("T")[0]);
      setExpectedDelivery("");
      setDestinationId("");
      setLines([]);
      setNewProductId("");
      setNewQuantity("");
      setNewUnitPrice("");
      onSuccess?.(); // Notify parent of success
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const isValid =
    vendorId && orderDate && destinationId && lines.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5" />
            Purchase Order Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Vendor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Vendor <span className="text-destructive">*</span>
              </label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Order Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>

            {/* Expected Delivery */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Expected Delivery
              </label>
              <Input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
              />
            </div>

            {/* Destination Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Destination Location <span className="text-destructive">*</span>
              </label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Lines Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Order Lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new line */}
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
            <div className="min-w-[200px] flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">Product</label>
              <Select value={newProductId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-28 space-y-2">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
            </div>

            <div className="w-32 space-y-2">
              <label className="text-sm font-medium text-foreground">Unit Price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(e.target.value)}
              />
            </div>

            <Button
              type="button"
              onClick={addLine}
              disabled={!newProductId || !newQuantity || !newUnitPrice}
              className="shrink-0"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Line
            </Button>
          </div>

          {/* Lines table */}
          {lines.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40%]">Product</TableHead>
                    <TableHead className="w-[15%] text-right">Qty</TableHead>
                    <TableHead className="w-[10%] text-center">Unit</TableHead>
                    <TableHead className="w-[15%] text-right">Unit Price</TableHead>
                    <TableHead className="w-[15%] text-right">Subtotal</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {line.productName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLineQuantity(line.id, e.target.value)
                          }
                          className="w-24 text-right ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {line.unit || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLinePrice(line.id, e.target.value)
                          }
                          className="w-28 text-right ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.quantity * line.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total Amount:
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {formatCurrency(totals.total)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
              <ShoppingCart className="mb-2 h-10 w-10 opacity-50" />
              <p>No order lines added yet</p>
              <p className="text-sm">Add products above to create your purchase order</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Section */}
      <div className="flex items-center justify-between">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="min-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Purchase Order"
          )}
        </Button>
      </div>
    </div>
  );
}
