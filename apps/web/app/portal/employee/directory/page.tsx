"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Filter,
} from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  location?: string;
  startDate: any;
  bio?: string;
}

export default function DirectoryPage() {
  const { user, claims } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    loadDirectory();
  }, [user]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter]);

  const loadDirectory = async () => {
    try {
      const orgId = claims.orgId;

      const employeesSnap = await getDocs(
        collection(db, `orgs/${orgId}/employees`)
      );

      const employeesList = employeesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];

      setEmployees(employeesList);
    } catch (error) {
      console.error("Error loading directory:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const departments = ["all", ...new Set(employees.map((e) => e.department))];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Employee Directory
          </h1>
          <p className="text-muted-foreground">
            Connect with your colleagues across the organization
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Departments"
            value={departments.length - 1}
            icon={Briefcase}
            color="green"
          />
          <StatCard
            title="Showing"
            value={filteredEmployees.length}
            icon={Filter}
            color="purple"
          />
          <StatCard
            title="Active"
            value={employees.length}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Component: Stat Card
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Component: Employee Card
function EmployeeCard({ employee }: { employee: Employee }) {
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {employee.position}
            </p>
            <p className="text-xs text-muted-foreground">
              {employee.department}
            </p>
          </div>
        </div>

        {employee.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {employee.bio}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <a
            href={`mailto:${employee.email}`}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            <span className="truncate">{employee.email}</span>
          </a>

          {employee.phone && (
            <a
              href={`tel:${employee.phone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              <span>{employee.phone}</span>
            </a>
          )}

          {employee.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{employee.location}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Started:{" "}
            {employee.startDate?.toDate
              ? new Date(employee.startDate.toDate()).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
