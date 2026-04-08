"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Package, ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getLocations,
  getLocationsByType,
  getPartners,
  getProducts,
  getUnits,
  getOperationTypesByTransaction,
  getStockLots,
  createStockMove,
  type Location,
  type Partner,
  type Product,
  type Unit,
  type OperationType,
  type StockLot,
} from "../app/actions/stock-move";

interface MoveLine {
  id: string;
  productId: string;
  quantity: number;
  unitId: string;
  lotId: string;
  expiryDate: string;
}

interface StockMoveFormProps {
  type: "receive" | "transfer" | "delivery";
}

export function StockMoveForm({ type }: StockMoveFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendorLocations, setVendorLocations] = useState<Location[]>([]);
  const [customerLocations, setCustomerLocations] = useState<Location[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);

  // Form state
  const [operationTypeId, setOperationTypeId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [lines, setLines] = useState<MoveLine[]>([
    { id: crypto.randomUUID(), productId: "", quantity: 0, unitId: "", lotId: "", expiryDate: "" },
  ]);

  // Popover states for searchable selects
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [operationTypeOpen, setOperationTypeOpen] = useState(false);

  // Get transaction type based on form type
  const getTransactionType = () => {
    switch (type) {
      case "receive":
        return "Receiving";
      case "transfer":
        return "Transfer";
      case "delivery":
        return "Delivery";
    }
  };

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const transactionType = getTransactionType();
        const [allLocations, vendors, customers, allPartners, allProducts, allUnits, opTypes, lots] =
          await Promise.all([
            getLocations(),
            getLocationsByType("Vendor"),
            getLocationsByType("Customer"),
            getPartners(),
            getProducts(),
            getUnits(),
            getOperationTypesByTransaction(transactionType),
            getStockLots(),
          ]);

        setLocations(allLocations);
        setVendorLocations(vendors);
        setCustomerLocations(customers);
        setPartners(allPartners);
        setProducts(allProducts);
        setUnits(allUnits);
        setOperationTypes(opTypes);
        setStockLots(lots);

        // Set default operation type (first one)
        if (opTypes.length > 0) {
          setOperationTypeId(opTypes[0].id);
        }

        // Set default source location for receive (first vendor location)
        if (type === "receive" && vendors.length > 0) {
          setSourceLocationId(vendors[0].id);
        }

        // Set default destination location for delivery (first customer location)
        if (type === "delivery" && customers.length > 0) {
          setDestinationLocationId(customers[0].id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const addLine = () => {
    setLines([
      ...lines,
      { id: crypto.randomUUID(), productId: "", quantity: 0, unitId: "", lotId: "", expiryDate: "" },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof MoveLine, value: string | number) => {
    setLines(
      lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  };

  const resetForm = () => {
    setPartnerId("");
    setDate(new Date().toISOString().split("T")[0]);
    setScheduledDate("");
    setLines([{ id: crypto.randomUUID(), productId: "", quantity: 0, unitId: "", lotId: "", expiryDate: "" }]);

    // Reset location defaults based on type
    if (type === "receive") {
      setSourceLocationId(vendorLocations[0]?.id || "");
      setDestinationLocationId("");
    } else if (type === "delivery") {
      setSourceLocationId("");
      setDestinationLocationId(customerLocations[0]?.id || "");
    } else {
      setSourceLocationId("");
      setDestinationLocationId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!operationTypeId) {
      toast({
        title: "Validation Error",
        description: "Operation type is required",
        variant: "destructive",
      });
      return;
    }

    if (type !== "transfer" && !partnerId) {
      toast({
        title: "Validation Error",
        description: "Partner is required",
        variant: "destructive",
      });
      return;
    }

    if (!sourceLocationId) {
      toast({
        title: "Validation Error",
        description: "Source location is required",
        variant: "destructive",
      });
      return;
    }

    if (!destinationLocationId) {
      toast({
        title: "Validation Error",
        description: "Destination location is required",
        variant: "destructive",
      });
      return;
    }

    const validLines = lines.filter(
      (line) => line.productId && line.quantity > 0 && line.unitId
    );

    if (validLines.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one complete line is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createStockMove({
        operationTypeId,
        partnerId: type === "transfer" ? undefined : partnerId,
        sourceLocationId,
        destinationLocationId,
        date,
        lines: validLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitId: line.unitId,
          lotId: line.lotId || undefined,
          expiryDate: line.expiryDate || undefined,
        })),
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `Stock Move ${result.reference} created successfully`,
        });
        resetForm();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create stock move",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "receive":
        return "Stock Receive";
      case "transfer":
        return "Stock Transfer";
      case "delivery":
        return "Stock Delivery";
    }
  };

  const getSourceLocations = () => {
    switch (type) {
      case "receive":
        return vendorLocations;
      case "delivery":
      case "transfer":
        return locations;
    }
  };

  const getDestinationLocations = () => {
    switch (type) {
      case "receive":
      case "transfer":
        return locations;
      case "delivery":
        return customerLocations;
    }
  };

  // For receive: source is preset to vendor (disabled), destination is selectable
  // For transfer: both source and destination are selectable
  // For delivery: source is selectable, destination is preset to customer (disabled)
  const isSourceDisabled = false; // Allow selection for all, but show default for receive
  const isDestDisabled = false; // Allow selection for all, but show default for delivery

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            {getTitle()}
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            Draft
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Operation Type */}
            <div className="space-y-2">
              <Label htmlFor="operationType">
                Operation Type <span className="text-destructive">*</span>
              </Label>
              <Popover open={operationTypeOpen} onOpenChange={setOperationTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={operationTypeOpen}
                    className="w-full justify-between font-normal"
                  >
                    {operationTypeId
                      ? operationTypes.find((o) => o.id === operationTypeId)?.name
                      : "Select operation type..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search operation type..." />
                    <CommandList>
                      <CommandEmpty>No operation type found.</CommandEmpty>
                      <CommandGroup>
                        {operationTypes.map((opType) => (
                          <CommandItem
                            key={opType.id}
                            value={opType.name}
                            onSelect={() => {
                              setOperationTypeId(opType.id);
                              setOperationTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                operationTypeId === opType.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {opType.name}
                            {opType.code && (
                              <span className="ml-2 text-muted-foreground text-xs">
                                ({opType.code})
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Partner */}
            {type !== "transfer" ? (
              <div className="space-y-2">
                <Label htmlFor="partner">
                  Partner <span className="text-destructive">*</span>
                </Label>
                <Popover open={partnerOpen} onOpenChange={setPartnerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={partnerOpen}
                      className="w-full justify-between font-normal"
                    >
                      {partnerId
                        ? partners.find((p) => p.id === partnerId)?.name
                        : "Select partner..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search partner..." />
                      <CommandList>
                        <CommandEmpty>No partner found.</CommandEmpty>
                        <CommandGroup>
                          {partners.map((partner) => (
                            <CommandItem
                              key={partner.id}
                              value={partner.name}
                              onSelect={() => {
                                setPartnerId(partner.id);
                                setPartnerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  partnerId === partner.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {partner.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="partner">Partner (Optional)</Label>
                <Popover open={partnerOpen} onOpenChange={setPartnerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={partnerOpen}
                      className="w-full justify-between font-normal"
                    >
                      {partnerId
                        ? partners.find((p) => p.id === partnerId)?.name
                        : "Select partner..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search partner..." />
                      <CommandList>
                        <CommandEmpty>No partner found.</CommandEmpty>
                        <CommandGroup>
                          {partners.map((partner) => (
                            <CommandItem
                              key={partner.id}
                              value={partner.name}
                              onSelect={() => {
                                setPartnerId(partner.id);
                                setPartnerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  partnerId === partner.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {partner.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Source Location */}
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="source">
                Source Location <span className="text-destructive">*</span>
              </Label>
              <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sourceOpen}
                    className="w-full justify-between font-normal"
                    disabled={isSourceDisabled}
                  >
                    {sourceLocationId
                      ? getSourceLocations().find((l) => l.id === sourceLocationId)?.name
                      : "Select source..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {getSourceLocations().map((location) => (
                          <CommandItem
                            key={location.id}
                            value={location.name}
                            onSelect={() => {
                              setSourceLocationId(location.id);
                              setSourceOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                sourceLocationId === location.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {location.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Arrow indicator */}
            <div className="hidden lg:flex items-center justify-center pb-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Destination Location */}
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="destination">
                Destination Location <span className="text-destructive">*</span>
              </Label>
              <Popover open={destOpen} onOpenChange={setDestOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={destOpen}
                    className="w-full justify-between font-normal"
                    disabled={isDestDisabled}
                  >
                    {destinationLocationId
                      ? getDestinationLocations().find((l) => l.id === destinationLocationId)?.name
                      : "Select destination..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {getDestinationLocations().map((location) => (
                          <CommandItem
                            key={location.id}
                            value={location.name}
                            onSelect={() => {
                              setDestinationLocationId(location.id);
                              setDestOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                destinationLocationId === location.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {location.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date (Optional)</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          </div>

          {/* Move Lines Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Move Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 grid grid-cols-12 gap-2 text-sm font-medium">
                <div className="col-span-3">Product (SKU)</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Lot No</div>
                <div className="col-span-2">Expiry Date</div>
                <div className="col-span-1"></div>
              </div>
              <div className="divide-y">
                {lines.map((line, index) => (
                  <MoveLineRow
                    key={line.id}
                    line={line}
                    index={index}
                    products={products}
                    units={units}
                    stockLots={stockLots}
                    onUpdate={updateLine}
                    onRemove={removeLine}
                    canRemove={lines.length > 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface MoveLineRowProps {
  line: MoveLine;
  index: number;
  products: Product[];
  units: Unit[];
  stockLots: StockLot[];
  onUpdate: (id: string, field: keyof MoveLine, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function MoveLineRow({
  line,
  products,
  units,
  stockLots,
  onUpdate,
  onRemove,
  canRemove,
}: MoveLineRowProps) {
  const [productOpen, setProductOpen] = useState(false);
  const [lotOpen, setLotOpen] = useState(false);

  return (
    <div className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
      {/* Product */}
      <div className="col-span-3">
        <Popover open={productOpen} onOpenChange={setProductOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={productOpen}
              className="w-full justify-between font-normal text-sm h-9"
            >
              <span className="truncate">
                {line.productId
                  ? products.find((p) => p.id === line.productId)?.sku || "Select..."
                  : "Select product..."}
              </span>
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search by SKU or name..." />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onUpdate(line.id, "productId", product.id);
                        setProductOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          line.productId === product.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{product.sku}</span>
                      {product.name && (
                        <span className="ml-2 text-muted-foreground truncate">
                          - {product.name}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quantity */}
      <div className="col-span-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={line.quantity || ""}
          onChange={(e) =>
            onUpdate(line.id, "quantity", parseFloat(e.target.value) || 0)
          }
          placeholder="0"
          className="text-sm h-9"
        />
      </div>

      {/* Unit */}
      <div className="col-span-2">
        <Select
          value={line.unitId}
          onValueChange={(value) => onUpdate(line.id, "unitId", value)}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lot No */}
      <div className="col-span-2">
        <Popover open={lotOpen} onOpenChange={setLotOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={lotOpen}
              className="w-full justify-between font-normal text-sm h-9"
            >
              <span className="truncate">
                {line.lotId
                  ? stockLots.find((l) => l.id === line.lotId)?.lot || "Select..."
                  : "Select lot..."}
              </span>
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search lot..." />
              <CommandList>
                <CommandEmpty>No lot found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="none"
                    onSelect={() => {
                      onUpdate(line.id, "lotId", "");
                      setLotOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !line.lotId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-muted-foreground">None</span>
                  </CommandItem>
                  {stockLots.map((lot) => (
                    <CommandItem
                      key={lot.id}
                      value={lot.lot}
                      onSelect={() => {
                        onUpdate(line.id, "lotId", lot.id);
                        if (lot.expiryDate) {
                          onUpdate(line.id, "expiryDate", lot.expiryDate.split("T")[0]);
                        }
                        setLotOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          line.lotId === lot.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {lot.lot}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Expiry Date */}
      <div className="col-span-2">
        <Input
          type="date"
          value={line.expiryDate}
          onChange={(e) => onUpdate(line.id, "expiryDate", e.target.value)}
          className="text-sm h-9"
        />
      </div>

      {/* Remove Button */}
      <div className="col-span-1 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(line.id)}
          disabled={!canRemove}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove line</span>
        </Button>
      </div>
    </div>
  );
}
