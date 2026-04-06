"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getLocations } from "@/app/actions";

interface Location {
  id: string;
  code: string;
  Name: string;
  status: string;
  warehouse: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Location>[] = [
    { key: "code", label: "Code" },
    { key: "Name", label: "Location Name" },
    { key: "warehouse", label: "Warehouse" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Locations</h1>
            <p className="text-muted-foreground">
              Manage storage locations and zones
            </p>
          </div>
        </div>

        <DataTable
          data={locations}
          columns={columns}
          searchKey="Name"
          searchPlaceholder="Search locations..."
          pageSize={15}
        />
      </div>
    </DashboardLayout>
  );
}
