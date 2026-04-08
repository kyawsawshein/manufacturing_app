"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { BOMCreationForm } from "../../components/bom-creation-form";
import { Layers } from "lucide-react";

export default function CreateBOMPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-3">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Create BOM
              </h1>
              <p className="text-muted-foreground">
                Create a new bill of materials for a product structure.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl">
          <BOMCreationForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
