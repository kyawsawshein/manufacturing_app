import { MOCreationForm } from "../components/mo-creation-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Manufacturing Order
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a new manufacturing order with cost estimation and scheduling
          </p>
        </header>

        <MOCreationForm />
      </div>
    </main>
  );
}
