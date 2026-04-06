"use client";

import { useEffect, useState, useTransition } from "react";
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
import { Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
} from "@/app/actions";

interface Employee {
  id: string;
  employeeId: string;
  Name: string;
  contact: string;
  position: string;
  status: string;
  department: string;
}

interface Department {
  id: string;
  Name: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    Name: "",
    contact: "",
    position: "",
    status: "Active",
    departmentId: "",
  });

  const loadData = async () => {
    try {
      const [employeesData, departmentsData] = await Promise.all([
        getEmployees(),
        getDepartments(),
      ]);
      setEmployees(employeesData);
      setDepartments(departmentsData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Employee>[] = [
    { key: "employeeId", label: "ID" },
    { key: "Name", label: "Name" },
    { key: "contact", label: "Contact" },
    { key: "position", label: "Position" },
    { key: "department", label: "Department" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      Name: "",
      contact: "",
      position: "",
      status: "Active",
      departmentId: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    const dept = departments.find((d) => d.Name === employee.department);
    setFormData({
      Name: employee.Name,
      contact: employee.contact,
      position: employee.position,
      status: employee.status,
      departmentId: dept?.id || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    if (confirm(`Are you sure you want to delete ${employee.Name}?`)) {
      startTransition(async () => {
        try {
          await deleteEmployee(employee.id);
          await loadData();
          toast({
            title: "Success",
            description: "Employee deleted successfully",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete employee",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingEmployee) {
          await updateEmployee(editingEmployee.id, formData);
          toast({
            title: "Success",
            description: "Employee updated successfully",
          });
        } else {
          await createEmployee(formData);
          toast({
            title: "Success",
            description: "Employee created successfully",
          });
        }
        await loadData();
        setIsDialogOpen(false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to save employee",
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
            <h1 className="text-2xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground">
              Manage employee records and information
            </p>
          </div>
        </div>

        <DataTable
          data={employees}
          columns={columns}
          searchKey="Name"
          searchPlaceholder="Search employees..."
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Employee"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee" : "Add Employee"}
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
                  placeholder="Enter employee Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  placeholder="Phone or email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="Job title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.Name}
                      </SelectItem>
                    ))}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingEmployee ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
