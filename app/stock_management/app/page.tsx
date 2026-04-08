"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockMoveForm } from "../components/stock-move-form";
import { PackageCheck, ArrowRightLeft, Truck } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function StockMovePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Stock Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create stock movements for receiving, transferring, and delivering inventory.
          </p>
        </div>

        <Tabs defaultValue="receive" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="receive" className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Receive</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receive" className="mt-0">
            <StockMoveForm type="receive" />
          </TabsContent>

          <TabsContent value="transfer" className="mt-0">
            <StockMoveForm type="transfer" />
          </TabsContent>

          <TabsContent value="delivery" className="mt-0">
            <StockMoveForm type="delivery" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
