"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Scissors, Plus, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
    getProducts,
    createCuttingWithLines,
} from "../../app/actions";

interface Product {
    id: string;
    Name: string;
    productCode: string;
    cost: number | null;
}

interface CuttingLineForm {
    productId: string;
    quantity: number;
    unitCost: number;
}

export default function CreateCuttingPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Form state
    const [cuttingForm, setCuttingForm] = useState({
        name: "",
        reference: "",
    });

    const [cuttingLines, setCuttingLines] = useState<CuttingLineForm[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Load products on mount
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch {
                toast({
                    title: "Error",
                    description: "Failed to load products",
                    variant: "destructive",
                });
            }
        };
        loadProducts();
    }, []);

    const addCuttingLine = () => {
        setCuttingLines(prev => [...prev, {
            productId: "",
            quantity: 1,
            unitCost: 0,
        }]);
    };

    const removeCuttingLine = (index: number) => {
        setCuttingLines(prev => prev.filter((_, i) => i !== index));
    };

    const updateCuttingLine = (index: number, field: keyof CuttingLineForm, value: string | number) => {
        setCuttingLines(prev => prev.map((line, i) =>
            i === index ? { ...line, [field]: value } : line
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!cuttingForm.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Cutting name is required",
                variant: "destructive",
            });
            return;
        }

        if (cuttingLines.length === 0) {
            toast({
                title: "Validation Error",
                description: "At least one cutting line is required",
                variant: "destructive",
            });
            return;
        }

        // Validate cutting lines
        for (let i = 0; i < cuttingLines.length; i++) {
            const line = cuttingLines[i];
            if (!line.productId) {
                toast({
                    title: "Validation Error",
                    description: `Line ${i + 1}: Product is required`,
                    variant: "destructive",
                });
                return;
            }
            if (line.quantity <= 0) {
                toast({
                    title: "Validation Error",
                    description: `Line ${i + 1}: Quantity must be greater than 0`,
                    variant: "destructive",
                });
                return;
            }
            if (line.unitCost < 0) {
                toast({
                    title: "Validation Error",
                    description: `Line ${i + 1}: Unit cost cannot be negative`,
                    variant: "destructive",
                });
                return;
            }
        }

        startTransition(async () => {
            try {
                await createCuttingWithLines({
                    name: cuttingForm.name,
                    reference: cuttingForm.reference || undefined,
                    lines: cuttingLines.map(line => ({
                        productId: line.productId,
                        quantity: line.quantity,
                        unitCost: line.unitCost,
                    })),
                });

                toast({
                    title: "Success",
                    description: "Cutting created successfully",
                });

                router.push("/manufacturing/cutting-management");
            } catch {
                toast({
                    title: "Error",
                    description: "Failed to create cutting",
                    variant: "destructive",
                });
            }
        });
    };

    const calculateTotalCost = () => {
        return cuttingLines.reduce((total, line) => total + (line.quantity * line.unitCost), 0);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        {/* <h1 className="text-3xl font-bold tracking-tight">Create Cutting</h1> */}
                        <p className="text-muted-foreground">
                            Create a new cutting pattern with material requirements.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/manufacturing/cutting-management")}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Create Cutting
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Scissors className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={cuttingForm.name}
                                        onChange={(e) => setCuttingForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter cutting name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={cuttingForm.reference}
                                        onChange={(e) => setCuttingForm(prev => ({ ...prev, reference: e.target.value }))}
                                        placeholder="Optional reference"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cutting Lines */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Cutting Lines</CardTitle>
                                <Button type="button" onClick={addCuttingLine} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Line
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cuttingLines.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No cutting lines added yet.</p>
                                    <p className="text-sm">Click "Add Line" to start adding material requirements.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cuttingLines.map((line, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">Line {index + 1}</h4>
                                                <Button
                                                    type="button"
                                                    onClick={() => removeCuttingLine(index)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Product *</Label>
                                                    <Select
                                                        value={line.productId}
                                                        onValueChange={(value) => updateCuttingLine(index, "productId", value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map((product) => (
                                                                <SelectItem key={product.id} value={product.id}>
                                                                    {product.Name} ({product.productCode})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Quantity *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={line.quantity}
                                                        onChange={(e) => updateCuttingLine(index, "quantity", parseFloat(e.target.value) || 0)}
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Unit Cost</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.unitCost}
                                                        onChange={(e) => updateCuttingLine(index, "unitCost", parseFloat(e.target.value) || 0)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-muted-foreground">
                                                Total: ${(line.quantity * line.unitCost).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}

                                    <Separator />

                                    <div className="flex justify-end">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Total Cost</p>
                                            <p className="text-2xl font-bold">${calculateTotalCost().toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    );
}