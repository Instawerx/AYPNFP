"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserPlus, Mail, Shield, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Role {
  id: string;
  name: string;
  description: string;
  scopes: string[];
}

export default function InviteUserPage() {
  const router = useRouter();
  const { claims, hasScope } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!hasScope("admin.write")) {
      router.push("/portal/admin/users");
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
      setRoles(rolesList);
    } catch (error) {
      console.error("Error loading roles:", error);
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const getAggregatedScopes = () => {
    const scopeSet = new Set<string>();
    selectedRoles.forEach((roleId) => {
      const role = roles.find((r) => r.id === roleId);
      role?.scopes.forEach((scope) => scopeSet.add(scope));
    });
    return Array.from(scopeSet).sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setSubmitting(false);
      return;
    }

    if (selectedRoles.length === 0) {
      setError("Please select at least one role");
      setSubmitting(false);
      return;
    }

    try {
      // TODO: Call backend API to create user
      // For now, we'll simulate success
      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          roles: selectedRoles,
          sendEmail,
          orgId: claims.orgId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to invite user");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/portal/admin/users");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasScope("admin.write")) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/portal/admin/users"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Invite User</h1>
              <p className="text-muted-foreground">
                Add a new user to your organization
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">User Invited!</h3>
                <p className="text-sm text-green-800">
                  Redirecting to users list...
                </p>
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
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  User will receive an invitation email at this address
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                  Display Name (Optional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Roles <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No roles available. Create roles first.
                    </p>
                  ) : (
                    roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.scopes.slice(0, 3).map((scope) => (
                              <span
                                key={scope}
                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                              >
                                {scope}
                              </span>
                            ))}
                            {role.scopes.length > 3 && (
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                                +{role.scopes.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Send Email */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <div>
                    <span className="font-medium">Send invitation email</span>
                    <p className="text-sm text-muted-foreground">
                      User will receive an email with login instructions
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting || selectedRoles.length === 0}
                  className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Inviting..." : "Invite User"}
                </button>
                <Link
                  href="/portal/admin/users"
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
              <h3 className="font-semibold mb-4">Permission Preview</h3>
              
              {selectedRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select roles to preview permissions
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Selected Roles ({selectedRoles.length})
                    </p>
                    <div className="space-y-1">
                      {selectedRoles.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId);
                        return (
                          <div
                            key={roleId}
                            className="px-2 py-1 bg-primary/10 text-primary text-sm rounded"
                          >
                            {role?.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Aggregated Scopes ({getAggregatedScopes().length})
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {getAggregatedScopes().map((scope) => (
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
                      This user will have access to all features covered by these scopes.
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
