import { SalesOrderForm } from "@/components/sales-order-form";
import {
  getPartners,
  getCustomerPOs,
  getLocations,
  getProducts,
  getUnitsOfMeasure,
} from "./actions";

export default async function HomePage() {
  // Fetch all data in parallel
  const [partners, customerPOs, locations, products, unitsOfMeasure] = await Promise.all([
    getPartners(),
    getCustomerPOs(),
    getLocations(),
    getProducts(),
    getUnitsOfMeasure(),
  ]);

  return (
    <main className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create Sales Order
          </h1>
          <p className="mt-2 text-muted-foreground">
            Fill in the order details and add products to create a new sales order.
          </p>
        </header>

        <SalesOrderForm
          partners={partners}
          customerPOs={customerPOs}
          locations={locations}
          products={products}
          unitsOfMeasure={unitsOfMeasure}
        />
      </div>
    </main>
  );
}
