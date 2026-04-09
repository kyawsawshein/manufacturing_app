import { getProducts, getUnitsOfMeasure } from "@/app/actions";
import { RequestRMForm } from "../../components/request-rm-form";

export default async function CreateRequestRMPage() {
    const [units, products] = await Promise.all([getUnitsOfMeasure(), getProducts()]);

    return (
        <main className="min-h-screen bg-muted/30 py-8">
            <div className="max-w-[1400px] mx-auto px-4 w-full">
                <header className="mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Request RM</h1>
                        <p className="mt-2 text-muted-foreground">
                            Create a new raw material request with Request Item lines.
                        </p>
                    </div>
                </header>
                <RequestRMForm units={units} products={products} />
            </div>
        </main>
    );
}
