"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Shield, ArrowLeft, AlertCircle, Plus, Search } from "lucide-react";
import Link from "next/link";

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

export default function CreateRolePage() {
  const router = useRouter();
  const { claims, hasScope } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!hasScope("admin.write")) {
      router.push("/portal/admin/roles");
    }
  }, []);

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

  const getPortalAccess = () => {
    const portals = new Set<string>();
    selectedScopes.forEach((scope) => {
      const scopeDef = AVAILABLE_SCOPES.find((s) => s.scope === scope);
      if (scopeDef) portals.add(scopeDef.access);
    });
    return Array.from(portals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validation
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
      const response = await fetch("/api/admin/roles", {
        method: "POST",
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
        throw new Error(data.error || "Failed to create role");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/portal/admin/roles");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create role");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasScope("admin.write")) {
    return null;
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Role</h1>
              <p className="text-muted-foreground">
                Define a new role with specific permissions
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Role Created!</h3>
                <p className="text-sm text-green-800">Redirecting to roles list...</p>
              </div>
            </div>
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
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || selectedScopes.length === 0}
                  className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Role"}
                </button>
                <Link
                  href="/portal/admin/roles"
                  className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold mb-4">Role Preview</h3>

              {selectedScopes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select scopes to preview role capabilities
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Portal Access</p>
                    <div className="space-y-1">
                      {getPortalAccess().map((portal) => (
                        <div
                          key={portal}
                          className="px-2 py-1 bg-primary/10 text-primary text-sm rounded"
                        >
                          {portal}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Selected Scopes ({selectedScopes.length})
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {selectedScopes.sort().map((scope) => (
                        <div
                          key={scope}
                          className="px-2 py-1 bg-muted text-sm rounded font-mono"
                        >
                          {scope}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Users with this role will have access to all features covered by these
                      scopes.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
