"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Loader2, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllMORawMaterials } from "@/app/actions";

interface MORawMaterialRow {
    id: string;
    productName: string;
    moReference: string;
    moQty: number;
    quantity: number;
    lotNames: string;
    usedQty: number;
    unitName: string;
}

export default function MORawMaterialListPage() {
    const [rows, setRows] = useState<MORawMaterialRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadRawMaterials = async () => {
            try {
                const data = await getAllMORawMaterials();
                setRows(data);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load MO raw materials",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadRawMaterials();
    }, [toast]);

    const columns: Column<MORawMaterialRow>[] = [
        { key: "productName", label: "Product" },
        { key: "moReference", label: "MO" },
        {
            key: "moQty",
            label: "MO Qty",
            render: (value) => Number(value as number).toFixed(2),
            className: "text-right",
        },
        {
            key: "quantity",
            label: "Quantity",
            render: (value) => Number(value as number).toFixed(2),
            className: "text-right",
        },
        { key: "lotNames", label: "Lot" },
        {
            key: "usedQty",
            label: "Used Qty",
            render: (value) => Number(value as number).toFixed(2),
            className: "text-right",
        },
        { key: "unitName", label: "Unit" },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                        <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">MO Raw Material</h1>
                        <p className="text-muted-foreground">
                            View all MO raw material lines with product, MO, lot, unit, and used quantity.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-96 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        data={rows}
                        columns={columns}
                        searchKey="productName"
                        searchPlaceholder="Search MO raw material..."
                        pageSize={15}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
