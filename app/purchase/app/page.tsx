import { getVendors, getLocations, getProducts } from "./actions";
import { PurchaseOrderForm } from "@/components/purchase-order-form";
import { FileText } from "lucide-react";

export default async function PurchaseOrderPage() {
  const [vendors, locations, products] = await Promise.all([
    getVendors(),
    getLocations(),
    getProducts(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Create Purchase Order
              </h1>
              <p className="text-sm text-muted-foreground">
                Create a new purchase order for your vendors
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PurchaseOrderForm
          vendors={vendors}
          locations={locations}
          products={products}
        />
      </div>
    </main>
  );
}
