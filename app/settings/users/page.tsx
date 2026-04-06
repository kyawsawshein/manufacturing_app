"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  Name: string;
  email: string;
  role: string;
  status: string;
  accessRights: string[];
}

// Mock data for users (in a real app, this would come from the database)
const mockUsers: User[] = [
  {
    id: "1",
    Name: "John Doe",
    email: "john@company.com",
    role: "Admin",
    status: "Active",
    accessRights: ["inventory", "purchase", "sale", "manufacturing"],
  },
  {
    id: "2",
    Name: "Jane Smith",
    email: "jane@company.com",
    role: "Manager",
    status: "Active",
    accessRights: ["inventory", "purchase", "sale"],
  },
  {
    id: "3",
    Name: "Bob Wilson",
    email: "bob@company.com",
    role: "User",
    status: "Active",
    accessRights: ["inventory"],
  },
  {
    id: "4",
    Name: "Alice Brown",
    email: "alice@company.com",
    role: "User",
    status: "Inactive",
    accessRights: ["sale"],
  },
];

const accessModules = [
  { id: "inventory", label: "Inventory" },
  { id: "purchase", label: "Purchase" },
  { id: "sale", label: "Sale" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "employees", label: "Employees" },
  { id: "settings", label: "Settings" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    Name: "",
    email: "",
    role: "User",
    status: "Active",
    accessRights: [] as string[],
  });

  const columns: Column<User>[] = [
    { key: "Name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "accessRights",
      label: "Access Rights",
      render: (value) => {
        const rights = value as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {rights.slice(0, 3).map((right) => (
              <span
                key={right}
                className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {right}
              </span>
            ))}
            {rights.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                +{rights.length - 3} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      Name: "",
      email: "",
      role: "User",
      status: "Active",
      accessRights: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      Name: user.Name,
      email: user.email,
      role: user.role,
      status: user.status,
      accessRights: user.accessRights,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.Name}?`)) {
      setUsers(users.filter((u) => u.id !== user.id));
    }
  };

  const handleSubmit = () => {
    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, ...formData } : u
        )
      );
    } else {
      setUsers([
        ...users,
        { id: String(Date.now()), ...formData },
      ]);
    }
    setIsDialogOpen(false);
  };

  const toggleAccessRight = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      accessRights: prev.accessRights.includes(moduleId)
        ? prev.accessRights.filter((id) => id !== moduleId)
        : [...prev.accessRights, moduleId],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts and their access permissions
            </p>
          </div>
        </div>

        <DataTable
          data={users}
          columns={columns}
          searchKey="Name"
          searchPlaceholder="Search users..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add User"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Add User"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="Name">Name</Label>
                <Input
                  id="Name"
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData({ ...formData, Name: e.target.value })
                  }
                  placeholder="Enter Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Access Rights</Label>
                <div className="grid grid-cols-2 gap-2">
                  {accessModules.map((module) => (
                    <div key={module.id} className="flex items-center gap-2">
                      <Checkbox
                        id={module.id}
                        checked={formData.accessRights.includes(module.id)}
                        onCheckedChange={() => toggleAccessRight(module.id)}
                      />
                      <Label htmlFor={module.id} className="text-sm font-normal">
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingUser ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
