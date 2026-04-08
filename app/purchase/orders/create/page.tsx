"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PurchaseOrderForm } from "../../components/purchase-order-form";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPartners, getLocations, getProducts } from "@/app/actions";

export default function CreatePurchaseOrderPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vendorsData, locationsData, productsData] = await Promise.all([
          getPartners("Vendor"),
          getLocations(),
          getProducts(),
        ]);
        setVendors(vendorsData);
        setLocations(locationsData);
        setProducts(productsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create Purchase Order
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create a new purchase order for your vendors.
          </p>
        </div>

        <div className="max-w-4xl">
          <PurchaseOrderForm
            vendors={vendors}
            locations={locations}
            products={products}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}