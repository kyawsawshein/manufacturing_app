"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SalesOrderForm } from "../../components/sales-order-form";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getPartners,
  getCustomerPO,
  getLocations,
  getProducts,
  getUnitsOfMeasure,
} from "../../app/actions";

export default function CreateSalesOrderPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [customerPOs, setCustomerPOs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [partnersData, customerPOsData, locationsData, productsData, unitsOfMeasureData] = await Promise.all([
          getPartners(),
          getCustomerPO(),
          getLocations(),
          getProducts(),
          getUnitsOfMeasure(),
        ]);
        setPartners(partnersData);
        setCustomerPOs(customerPOsData);
        setLocations(locationsData);
        setProducts(productsData);
        setUnitsOfMeasure(unitsOfMeasureData);
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
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create Sales Order
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create a new sales order for your customers.
          </p>
        </div>

        <div className="max-w-4xl">
          <SalesOrderForm
            partners={partners}
            customerPOs={customerPOs}
            locations={locations}
            products={products}
            unitsOfMeasure={unitsOfMeasure}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}