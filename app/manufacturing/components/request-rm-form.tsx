"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, type Option } from "@/components/searchable-select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createRequestRM, RequestItemLine } from "../app/actions";

interface RequestRMFormProps {
    units: {
        id: string;
        Name: string;
    }[];
    products: {
        id: string;
        Name: string;
        productCode: string;
    }[];
}

const emptyLine: RequestItemLine = {
    productId: "",
    productName: "",
    lotNo: "",
    quantity: 0,
    unitId: "",
};

export function RequestRMForm({ units, products }: RequestRMFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [header, setHeader] = useState({
        Date: "",
        Time: "",
        status: "Requested",
    });
    const [lines, setLines] = useState<RequestItemLine[]>([]);

    const productOptions: Option[] = useMemo(
        () => products.map((product) => ({
            value: product.id,
            label: product.productCode ? `[${product.productCode}] ${product.Name}` : product.Name,
        })),
        [products]
    );

    const addLine = () => {
        setLines([...lines, { ...emptyLine }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, idx) => idx !== index));
    };

    const updateLine = (index: number, field: keyof RequestItemLine, value: string | number) => {
        const updated = [...lines];
        if (field === "productId") {
            const selectedProduct = products.find((product) => product.id === value);
            (updated[index] as any).productId = value;
            (updated[index] as any).productName = selectedProduct?.Name || "";
        } else {
            (updated[index] as any)[field] = value;
        }
        setLines(updated);
    };

    const isValid =
        header.Date &&
        header.Time &&
        lines.length > 0 &&
        lines.every((line) => line.productId && line.productName.trim() && line.quantity > 0 && line.unitId);

    const handleSubmit = async () => {
        if (!isValid) return toast.error("Please complete the request header and all item lines.");

        setLoading(true);
        try {
            const result = await createRequestRM({
                ...header,
                lines,
            });

            if (result.success) {
                toast.success("Request RM created successfully");
                router.push("/manufacturing/request-rm");
            }
        } catch (error) {
            toast.error("Failed to create Request RM");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Create Request RM</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="rm-date">Date</Label>
                        <Input
                            id="rm-date"
                            type="date"
                            value={header.Date}
                            onChange={(e) => setHeader({ ...header, Date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rm-time">Time</Label>
                        <Input
                            id="rm-time"
                            type="time"
                            value={header.Time}
                            onChange={(e) => setHeader({ ...header, Time: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rm-status">Status</Label>
                        <Select
                            value={header.status}
                            onValueChange={(value) => setHeader({ ...header, status: value })}
                        >
                            <SelectTrigger id="rm-status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Requested">Requested</SelectItem>
                                <SelectItem value="Done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg">Request Item Lines</CardTitle>
                    <Button variant="outline" size="sm" onClick={addLine}>
                        <Plus className="h-4 w-4 mr-2" /> Add Line
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-2 text-left">Product</th>
                                    <th className="p-2 text-left">Lot No</th>
                                    <th className="p-2 text-left w-24">Qty</th>
                                    <th className="p-2 text-left w-40">Unit</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, idx) => (
                                    <tr key={idx} className="border-b last:border-0">
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={productOptions}
                                                value={line.productId}
                                                onValueChange={(value) => updateLine(idx, "productId", value)}
                                                placeholder="Select product..."
                                                searchPlaceholder="Search products..."
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                value={line.lotNo}
                                                placeholder="Lot No"
                                                onChange={(e) => updateLine(idx, "lotNo", e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                value={line.quantity || ""}
                                                onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={line.unitId}
                                                onValueChange={(value) => updateLine(idx, "unitId", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {units.map((unit) => (
                                                        <SelectItem key={unit.id} value={unit.id}>
                                                            {unit.Name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-2 text-right">
                                            <Button variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {lines.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                            No request item lines added
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Create Request RM"}
                </Button>
            </div>
        </div>
    );
}
