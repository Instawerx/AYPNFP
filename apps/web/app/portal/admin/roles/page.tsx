"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Shield, Plus, Users, Edit, Trash2, Lock } from "lucide-react";
import Link from "next/link";

interface Role {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  userCount?: number;
}

export default function RolesManagement() {
  const { claims, hasScope } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasScope("admin.read")) {
      setLoading(false);
      return;
    }
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const orgId = claims.orgId;
      const rolesSnap = await getDocs(collection(db, `orgs/${orgId}/roles`));

      const rolesList = rolesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Role[];

      // Get user count for each role
      const usersSnap = await getDocs(collection(db, `orgs/${orgId}/users`));
      const users = usersSnap.docs.map((doc) => doc.data());

      rolesList.forEach((role) => {
        role.userCount = users.filter((user) =>
          user.roles?.includes(role.id)
        ).length;
      });

      setRoles(rolesList);
    } catch (error) {
      console.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("admin.read")) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            You don't have permission to view roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Role Management</h1>
            <p className="text-muted-foreground">
              Define roles and permissions for your organization
            </p>
          </div>
          {hasScope("admin.write") && (
            <Link
              href="/portal/admin/roles/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Role
            </Link>
          )}
        </div>

        {/* RBAC Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Role-Based Access Control (RBAC)
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Roles define sets of permissions (scopes) that control what users can
                access and modify. Each user can have multiple roles.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white rounded p-2">
                  <span className="font-semibold">admin.*</span> - Full access
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold">crm.*</span> - Donor management
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold">campaign.*</span> - Fundraising
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold">finance.*</span> - Financial data
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} hasWriteAccess={hasScope("admin.write")} />
          ))}

          {roles.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No roles found. Create your first role to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component: Role Card
function RoleCard({ role, hasWriteAccess }: { role: Role; hasWriteAccess: boolean }) {
  const scopeCategories = {
    admin: role.scopes.filter((s) => s.startsWith("admin.")).length,
    crm: role.scopes.filter((s) => s.startsWith("crm.") || s.startsWith("donor.")).length,
    campaign: role.scopes.filter((s) => s.startsWith("campaign.")).length,
    finance: role.scopes.filter((s) => s.startsWith("finance.")).length,
    hr: role.scopes.filter((s) => s.startsWith("hr.")).length,
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{role.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {role.userCount || 0} users
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">{role.description}</p>

        {/* Scope Summary */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            Permissions ({role.scopes.length} scopes)
          </p>
          <div className="flex flex-wrap gap-1">
            {scopeCategories.admin > 0 && (
              <ScopeBadge label="Admin" count={scopeCategories.admin} color="purple" />
            )}
            {scopeCategories.crm > 0 && (
              <ScopeBadge label="CRM" count={scopeCategories.crm} color="blue" />
            )}
            {scopeCategories.campaign > 0 && (
              <ScopeBadge label="Campaign" count={scopeCategories.campaign} color="green" />
            )}
            {scopeCategories.finance > 0 && (
              <ScopeBadge label="Finance" count={scopeCategories.finance} color="orange" />
            )}
            {scopeCategories.hr > 0 && (
              <ScopeBadge label="HR" count={scopeCategories.hr} color="pink" />
            )}
          </div>
        </div>

        {/* Actions */}
        {hasWriteAccess && (
          <div className="flex gap-2 pt-4 border-t">
            <Link
              href={`/portal/admin/roles/${role.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
              title="Delete role"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Component: Scope Badge
function ScopeBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const colorClasses = {
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    pink: "bg-pink-100 text-pink-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      {label} ({count})
    </span>
  );
}
