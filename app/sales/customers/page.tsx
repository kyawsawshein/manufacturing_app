"use client";

import { useEffect, useState, useTransition } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPartners, createPartner, updatePartner, deletePartner } from "@/app/actions";

interface Customer {
  id: string;
  Name: string;
  email: string;
  phone: string;
  type: string;
  country: string;
  paymentTerms: string;
  creditLimit: number;
  taxId: string;
  website: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    Name: "",
    email: "",
    phone: "",
    country: "",
    paymentTerms: "",
    creditLimit: 0,
    taxId: "",
    website: "",
  });

  const loadData = async () => {
    try {
      const data = await getPartners("Customer");
      setCustomers(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Customer>[] = [
    { key: "Name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "country", label: "Country" },
    { key: "paymentTerms", label: "Payment Terms" },
    {
      key: "creditLimit",
      label: "Credit Limit",
      render: (value) => formatCurrency(value as number),
      className: "text-right",
    },
  ];

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      Name: "",
      email: "",
      phone: "",
      country: "",
      paymentTerms: "",
      creditLimit: 0,
      taxId: "",
      website: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      Name: customer.Name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      country: customer.country || "",
      paymentTerms: customer.paymentTerms || "",
      creditLimit: customer.creditLimit || 0,
      taxId: customer.taxId || "",
      website: customer.website || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.Name}?`)) {
      startTransition(async () => {
        try {
          await deletePartner(customer.id);
          await loadData();
          toast({
            title: "Success",
            description: "Customer deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete customer",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingCustomer) {
          await updatePartner(editingCustomer.id, formData);
          toast({
            title: "Success",
            description: "Customer updated successfully",
          });
        } else {
          await createPartner({
            ...formData,
            type: "Customer",
          });
          toast({
            title: "Success",
            description: "Customer created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save customer",
          variant: "destructive",
        });
      }
    });
  };

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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">
              View and manage customer information
            </p>
          </div>
        </div>

        <DataTable
          data={customers}
          columns={columns}
          searchKey="Name"
          searchPlaceholder="Search customers..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Customer"
          pageSize={15}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="Name">Customer Name</Label>
                <Input
                  id="Name"
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData({ ...formData, Name: e.target.value })
                  }
                  placeholder="Enter customer Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Country"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentTerms: e.target.value })
                    }
                    placeholder="Net 30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="100"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                    placeholder="Tax ID"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCustomer ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
