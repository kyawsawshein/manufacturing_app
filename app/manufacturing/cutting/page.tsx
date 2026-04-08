import { RequestCuttingForm } from "../components/request-cutting-form";
import { getProducts } from "../app/actions";
import { getUnitsOfMeasure, getHookLoopItems } from "@/app/actions";

export default async function RequestCuttingPage() {
    // Fetch all necessary data for the form dropdowns
    const [products, units, hlItems] = await Promise.all([
        getProducts(),
        getUnitsOfMeasure(),
        getHookLoopItems(),
    ]);

    return (
        <main className="min-h-screen bg-muted/30 py-8">
            <div className="max-w-[1400px] mx-auto px-4 w-full">
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Request Cutting
                            </h1>
                            <p className="mt-2 text-muted-foreground">
                                Create a new cutting request for Tub and Hook & Loop materials.
                            </p>
                        </div>
                    </div>
                </header>

                <RequestCuttingForm
                    products={products}
                    units={units}
                    hookLoopItems={hlItems}
                />
            </div>
        </main>
    );
}