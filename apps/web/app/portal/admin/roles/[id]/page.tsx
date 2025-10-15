"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Shield,
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  Users,
  Search,
} from "lucide-react";
import Link from "next/link";

interface Role {
  id: string;
  name: string;
  description: string;
  scopes: string[];
}

interface ScopeDefinition {
  scope: string;
  category: string;
  description: string;
  access: string;
}

const AVAILABLE_SCOPES: ScopeDefinition[] = [
  // Admin
  { scope: "admin.read", category: "Admin", description: "View admin portal and settings", access: "Admin Portal" },
  { scope: "admin.write", category: "Admin", description: "Manage users, roles, and settings", access: "Admin Portal" },
  
  // Finance
  { scope: "finance.read", category: "Finance", description: "View financial data and reports", access: "Finance Portal" },
  { scope: "finance.write", category: "Finance", description: "Manage transactions and settlements", access: "Finance Portal" },
  
  // Campaign/Manager
  { scope: "campaign.read", category: "Manager", description: "View campaigns and analytics", access: "Manager Portal" },
  { scope: "campaign.write", category: "Manager", description: "Create and manage campaigns", access: "Manager Portal" },
  
  // Donor/Fundraiser
  { scope: "donor.read", category: "Fundraiser", description: "View donor information", access: "Fundraiser Portal" },
  { scope: "donor.write", category: "Fundraiser", description: "Manage donors and pledges", access: "Fundraiser Portal" },
  
  // HR/Employee
  { scope: "hr.read", category: "Employee", description: "View employee information", access: "Employee Portal" },
  { scope: "hr.write", category: "Employee", description: "Manage employees and documents", access: "Employee Portal" },
  
  // Forms
  { scope: "forms.read", category: "Forms", description: "View form submissions", access: "Forms Portal" },
  { scope: "forms.write", category: "Forms", description: "Create and edit forms", access: "Forms Portal" },
  { scope: "forms.submit", category: "Forms", description: "Submit forms", access: "Forms Portal" },
  { scope: "forms.approve", category: "Forms", description: "Approve/reject form submissions", access: "Forms Portal" },
];

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { claims, hasScope } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!hasScope("admin.read")) {
      router.push("/portal/admin/roles");
      return;
    }
    loadRole();
  }, [roleId]);

  const loadRole = async () => {
    try {
      const orgId = claims.orgId;

      // Load role
      const roleDoc = await getDoc(doc(db, `orgs/${orgId}/roles`, roleId));
      if (!roleDoc.exists()) {
        setError("Role not found");
        setLoading(false);
        return;
      }

      const roleData = { id: roleDoc.id, ...roleDoc.data() } as Role;
      setRole(roleData);
      setName(roleData.name);
      setDescription(roleData.description || "");
      setSelectedScopes(roleData.scopes || []);

      // Count users with this role
      const usersSnap = await getDocs(collection(db, `orgs/${orgId}/users`));
      const count = usersSnap.docs.filter((doc) =>
        doc.data().roles?.includes(roleId)
      ).length;
      setUserCount(count);
    } catch (error) {
      console.error("Error loading role:", error);
      setError("Failed to load role data");
    } finally {
      setLoading(false);
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryScopes = AVAILABLE_SCOPES.filter((s) => s.category === category).map(
      (s) => s.scope
    );
    const allSelected = categoryScopes.every((s) => selectedScopes.includes(s));

    if (allSelected) {
      setSelectedScopes((prev) => prev.filter((s) => !categoryScopes.includes(s)));
    } else {
      setSelectedScopes((prev) => [...new Set([...prev, ...categoryScopes])]);
    }
  };

  const getFilteredScopes = () => {
    let filtered = AVAILABLE_SCOPES;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    return filtered;
  };

  const getCategories = () => {
    return [...new Set(AVAILABLE_SCOPES.map((s) => s.category))];
  };

  const getCategoryCount = (category: string) => {
    const categoryScopes = AVAILABLE_SCOPES.filter((s) => s.category === category);
    const selectedCount = categoryScopes.filter((s) => selectedScopes.includes(s.scope))
      .length;
    return `${selectedCount}/${categoryScopes.length}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!name.trim()) {
      setError("Role name is required");
      setSubmitting(false);
      return;
    }

    if (selectedScopes.length === 0) {
      setError("Please select at least one scope");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          scopes: selectedScopes,
          orgId: claims.orgId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadRole();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (userCount > 0) {
      setError(`Cannot delete role: ${userCount} user(s) still have this role`);
      setShowDeleteConfirm(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: claims.orgId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete role");
      }

      router.push("/portal/admin/roles");
    } catch (err: any) {
      setError(err.message || "Failed to delete role");
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("admin.read") || !role) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            {error || "Role not found or you don't have permission"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/portal/admin/roles"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roles
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{role.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {userCount} user{userCount !== 1 ? "s" : ""} with this role
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Role updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="font-semibold mb-4">Role Information</h3>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Role ID</p>
                <p className="text-sm font-mono">{role.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Users</p>
                <p className="text-sm">{userCount} user{userCount !== 1 ? "s" : ""}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Scopes</p>
                <p className="text-sm">{selectedScopes.length} permission{selectedScopes.length !== 1 ? "s" : ""}</p>
              </div>

              {hasScope("admin.write") && (
                <div className="pt-4 border-t">
                  <button
                    onClick={handleDelete}
                    disabled={userCount > 0 && !showDeleteConfirm}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      showDeleteConfirm
                        ? "bg-destructive text-white hover:bg-destructive/90"
                        : "border border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {showDeleteConfirm ? "Confirm Delete" : "Delete Role"}
                  </button>
                  {showDeleteConfirm && (
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full mt-2 px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {userCount > 0 && !showDeleteConfirm && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Remove this role from all users before deleting
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="font-semibold">Basic Information</h3>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Role Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Finance Manager"
                    disabled={!hasScope("admin.write")}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe what this role is for..."
                    disabled={!hasScope("admin.write")}
                    rows={3}
                  />
                </div>
              </div>

              {/* Scope Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">
                  Permissions <span className="text-destructive">*</span>
                </h3>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search scopes..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Categories</option>
                    {getCategories().map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Quick Select */}
                {hasScope("admin.write") && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Quick Select by Category</p>
                    <div className="flex flex-wrap gap-2">
                      {getCategories().map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="px-3 py-1 text-sm border rounded-lg hover:bg-muted transition-colors"
                        >
                          {category} ({getCategoryCount(category)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scope List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getFilteredScopes().map((scopeDef) => (
                    <label
                      key={scopeDef.scope}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scopeDef.scope)}
                        onChange={() => toggleScope(scopeDef.scope)}
                        disabled={!hasScope("admin.write")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-primary">
                            {scopeDef.scope}
                          </code>
                          <span className="px-2 py-0.5 bg-muted text-xs rounded">
                            {scopeDef.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {scopeDef.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Selected {selectedScopes.length} of {AVAILABLE_SCOPES.length} scopes
                </p>
              </div>

              {/* Actions */}
              {hasScope("admin.write") && (
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || selectedScopes.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-5 w-5" />
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <Link
                    href="/portal/admin/roles"
                    className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
