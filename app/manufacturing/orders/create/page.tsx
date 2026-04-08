"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MOCreationForm } from "../../components/mo-creation-form";
import { Factory } from "lucide-react";

export default function CreateManufacturingOrderPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Factory className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create Manufacturing Order
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create a new manufacturing order for production.
          </p>
        </div>

        <div className="max-w-4xl">
          <MOCreationForm />
        </div>
      </div>
    </DashboardLayout>
  );
}