"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllMOFinishedGoods } from "@/app/actions";

interface MOFinishedGoodsRow {
    id: string;
    productName: string;
    moReference: string;
    poNo: string;
    quantity: number;
    finishedQty: number;
    lotName: string;
}

export default function MOFinishedGoodsListPage() {
    const [rows, setRows] = useState<MOFinishedGoodsRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadFinishedGoods = async () => {
            try {
                const data = await getAllMOFinishedGoods();
                setRows(data);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load MO finished goods",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadFinishedGoods();
    }, [toast]);

    const columns: Column<MOFinishedGoodsRow>[] = [
        { key: "productName", label: "Product" },
        { key: "moReference", label: "MO" },
        { key: "poNo", label: "PO No" },
        {
            key: "quantity",
            label: "Quantity",
            render: (value) => Number(value as number).toFixed(2),
            className: "text-right",
        },
        {
            key: "finishedQty",
            label: "Finished Qty",
            render: (value) => Number(value as number).toFixed(2),
            className: "text-right",
        },
        { key: "lotName", label: "Lot Name" },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                        <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">MO Finished Goods</h1>
                        <p className="text-muted-foreground">
                            View all finished goods from manufacturing orders with PO and lot details.
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
                        searchPlaceholder="Search MO finished goods..."
                        pageSize={15}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
