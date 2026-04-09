"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, type Option } from "@/components/searchable-select";
import { Plus, Trash2, Scissors } from "lucide-react";
import { createCuttingRequest, CuttingTubLine, CuttingHookLoopLine } from "../app/actions";
import { toast } from "sonner";

export function RequestCuttingForm({ products, units, hookLoopItems }: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [Date, setDate] = useState<string>("");

    // Header State
    const [header, setHeader] = useState({
        productId: "",
        quantity: 1,
        reference: "",
    });

    // Options for SearchableSelect
    const productOptions: Option[] = useMemo(() => products.map((p: any) => ({
        value: p.id,
        label: p.productCode ? `[${p.productCode}] ${p.Name}` : p.Name,
    })), [products]);

    const unitOptions: Option[] = useMemo(() => units.map((u: any) => ({
        value: u.id,
        label: u.Name,
    })), [units]);

    const hookLoopOptions: Option[] = useMemo(() => hookLoopItems.map((item: any) => ({
        value: item.id,
        label: item.label,
    })), [hookLoopItems]);

    // Lines State
    const [tubLines, setTubLines] = useState<CuttingTubLine[]>([]);
    const [hlLines, setHlLines] = useState<CuttingHookLoopLine[]>([]);

    const addTubLine = () => {
        setTubLines([...tubLines, { productId: "", quantity: 0, unitId: "", notes: "" }]);
    };

    const addHlLine = () => {
        setHlLines([...hlLines, { itemId: "", length: 0, quantity: 0, notes: "" }]);
    };

    const removeLine = (index: number, type: 'tub' | 'hl') => {
        if (type === 'tub') {
            setTubLines(tubLines.filter((_, i) => i !== index));
        } else {
            setHlLines(hlLines.filter((_, i) => i !== index));
        }
    };

    const updateLine = (index: number, type: 'tub' | 'hl', field: string, value: any) => {
        if (type === 'tub') {
            const newLines = [...tubLines];
            (newLines[index] as any)[field] = value;
            setTubLines(newLines);
        } else {
            const newLines = [...hlLines];
            (newLines[index] as any)[field] = value;
            setHlLines(newLines);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const result = await createCuttingRequest({
                ...header,
                tubLines,
                hookLoopLines: hlLines
            });

            if (result.success) {
                toast.success("Cutting request created successfully");
                router.push("/manufacturing/orders");
            }
        } catch (error) {
            toast.error("Failed to create cutting request");
        } finally {
            setLoading(false);
        }
    };

    // const isValid = Date && header.reference && (tubLines.length > 0 || hlLines.length > 0);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Scissors className="h-5 w-5" /> General Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* <div className="space-y-2">
                        <Label>Finished Product</Label>
                        <SearchableSelect
                            options={productOptions}
                            value={header.productId}
                            onValueChange={(v) => setHeader({ ...header, productId: v })}
                            placeholder="Select product..."
                            searchPlaceholder="Search products..."
                        />
                    </div> */}

                    {/* <div className="space-y-2">
                        <Label>Planned Quantity</Label>
                        <Input
                            type="number"
                            value={header.quantity}
                            onChange={(e) => setHeader({ ...header, quantity: Number(e.target.value) })}
                        />
                    </div> */}
                    <div className="space-y-2">
                        <Label htmlFor="start-date"> Date</Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={Date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Reference</Label>
                        <Input
                            placeholder="e.g. CUT-2024-001"
                            value={header.reference}
                            onChange={(e) => setHeader({ ...header, reference: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Cutting Tub Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Cutting Tub Lines</CardTitle>
                    <Button variant="outline" size="sm" onClick={addTubLine}>
                        <Plus className="h-4 w-4 mr-2" /> Add Tub Line
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-2 text-left">Product</th>
                                    <th className="p-2 text-left w-24">Qty</th>
                                    <th className="p-2 text-left w-40">UoM</th>
                                    <th className="p-2 text-left">Notes</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tubLines.map((line, idx) => (
                                    <tr key={idx} className="border-b last:border-0">
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={productOptions}
                                                value={line.productId}
                                                onValueChange={(v) => updateLine(idx, 'tub', 'productId', v)}
                                                placeholder="Select product..."
                                                searchPlaceholder="Search products..."
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input type="number" onChange={(e) => updateLine(idx, 'tub', 'quantity', Number(e.target.value))} />
                                        </td>
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={unitOptions}
                                                value={line.unitId}
                                                onValueChange={(v) => updateLine(idx, 'tub', 'unitId', v)}
                                                placeholder="Select unit..."
                                                searchPlaceholder="Search units..."
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input placeholder="Notes" onChange={(e) => updateLine(idx, 'tub', 'notes', e.target.value)} />
                                        </td>
                                        <td className="p-2">
                                            <Button variant="ghost" size="icon" onClick={() => removeLine(idx, 'tub')}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {tubLines.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No lines added</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Cutting Hook & Loop Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Cutting Hook & Loop Lines</CardTitle>
                    <Button variant="outline" size="sm" onClick={addHlLine}>
                        <Plus className="h-4 w-4 mr-2" /> Add H&L Line
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-2 text-left">H&L Item</th>
                                    <th className="p-2 text-left w-24">Length</th>
                                    <th className="p-2 text-left w-24">Qty</th>
                                    <th className="p-2 text-left">Notes</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {hlLines.map((line, idx) => (
                                    <tr key={idx} className="border-b last:border-0">
                                        <td className="p-2">
                                            <SearchableSelect
                                                options={hookLoopOptions}
                                                value={line.itemId}
                                                onValueChange={(v) => updateLine(idx, 'hl', 'itemId', v)}
                                                placeholder="Select item..."
                                                searchPlaceholder="Search H&L items..."
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input type="number" placeholder="mm" onChange={(e) => updateLine(idx, 'hl', 'length', Number(e.target.value))} />
                                        </td>
                                        <td className="p-2">
                                            <Input type="number" onChange={(e) => updateLine(idx, 'hl', 'quantity', Number(e.target.value))} />
                                        </td>
                                        <td className="p-2">
                                            <Input placeholder="Notes" onChange={(e) => updateLine(idx, 'hl', 'notes', e.target.value)} />
                                        </td>
                                        <td className="p-2">
                                            <Button variant="ghost" size="icon" onClick={() => removeLine(idx, 'hl')}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {hlLines.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No lines added</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                {/* <Button onClick={handleSubmit} disabled={loading || !isValid}></Button> */}
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Create Cutting Request"}
                </Button>
            </div>
        </div>
    );
}