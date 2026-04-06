"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shield, Package, ShoppingCart, Receipt, Factory, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModuleAccess {
  id: string;
  Name: string;
  description: string;
  icon: React.ElementType;
  permissions: {
    id: string;
    label: string;
    enabled: boolean;
  }[];
}

const initialModules: ModuleAccess[] = [
  {
    id: "inventory",
    Name: "Inventory",
    description: "Manage products, stock levels, and warehouse operations",
    icon: Package,
    permissions: [
      { id: "view", label: "View inventory data", enabled: true },
      { id: "create", label: "Create products and stock entries", enabled: true },
      { id: "edit", label: "Edit inventory records", enabled: true },
      { id: "delete", label: "Delete inventory records", enabled: false },
      { id: "manage_locations", label: "Manage locations and warehouses", enabled: false },
    ],
  },
  {
    id: "purchase",
    Name: "Purchase",
    description: "Handle purchase orders and vendor management",
    icon: ShoppingCart,
    permissions: [
      { id: "view", label: "View purchase orders", enabled: true },
      { id: "create", label: "Create purchase orders", enabled: true },
      { id: "edit", label: "Edit purchase orders", enabled: true },
      { id: "delete", label: "Delete purchase orders", enabled: false },
      { id: "approve", label: "Approve purchase orders", enabled: false },
    ],
  },
  {
    id: "sales",
    Name: "Sales",
    description: "Manage sales orders and customer relationships",
    icon: Receipt,
    permissions: [
      { id: "view", label: "View sales orders", enabled: true },
      { id: "create", label: "Create sales orders", enabled: true },
      { id: "edit", label: "Edit sales orders", enabled: true },
      { id: "delete", label: "Delete sales orders", enabled: false },
      { id: "manage_pricing", label: "Manage pricing and discounts", enabled: false },
    ],
  },
  {
    id: "manufacturing",
    Name: "Manufacturing",
    description: "Control production orders and bill of materials",
    icon: Factory,
    permissions: [
      { id: "view", label: "View manufacturing orders", enabled: true },
      { id: "create", label: "Create manufacturing orders", enabled: true },
      { id: "edit", label: "Edit manufacturing orders", enabled: true },
      { id: "delete", label: "Delete manufacturing orders", enabled: false },
      { id: "manage_bom", label: "Manage bill of materials", enabled: false },
    ],
  },
  {
    id: "employees",
    Name: "Employees",
    description: "Employee and department management",
    icon: Users,
    permissions: [
      { id: "view", label: "View employee data", enabled: true },
      { id: "create", label: "Create employee records", enabled: false },
      { id: "edit", label: "Edit employee records", enabled: false },
      { id: "delete", label: "Delete employee records", enabled: false },
      { id: "manage_departments", label: "Manage departments", enabled: false },
    ],
  },
  {
    id: "settings",
    Name: "Settings",
    description: "System configuration and user management",
    icon: Settings,
    permissions: [
      { id: "view", label: "View settings", enabled: true },
      { id: "manage_users", label: "Manage users", enabled: false },
      { id: "manage_roles", label: "Manage roles and permissions", enabled: false },
      { id: "system_config", label: "System configuration", enabled: false },
    ],
  },
];

export default function AccessRightsPage() {
  const [modules, setModules] = useState<ModuleAccess[]>(initialModules);
  const { toast } = useToast();

  const togglePermission = (moduleId: string, permissionId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
            ...module,
            permissions: module.permissions.map((perm) =>
              perm.id === permissionId
                ? { ...perm, enabled: !perm.enabled }
                : perm
            ),
          }
          : module
      )
    );
  };

  const handleSave = () => {
    // In a real app, this would save to the database
    toast({
      title: "Settings saved",
      description: "Access rights have been updated successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Access Rights</h1>
              <p className="text-muted-foreground">
                Configure module permissions for the default user role
              </p>
            </div>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.id} className="bg-card border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.Name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {module.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                      >
                        <span className="text-sm text-foreground">
                          {permission.label}
                        </span>
                        <Switch
                          checked={permission.enabled}
                          onCheckedChange={() =>
                            togglePermission(module.id, permission.id)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
