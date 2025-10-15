"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  User as UserIcon,
  Mail,
  Shield,
  ArrowLeft,
  Save,
  Trash2,
  Key,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
  scopes: string[];
  createdAt: any;
  lastLoginAt?: any;
  status: "active" | "inactive" | "suspended";
}

interface Role {
  id: string;
  name: string;
  description: string;
  scopes: string[];
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { claims, hasScope } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!hasScope("admin.read")) {
      router.push("/portal/admin/users");
      return;
    }
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const orgId = claims.orgId;

      // Load user
      const userDoc = await getDoc(doc(db, `orgs/${orgId}/users`, userId));
      if (!userDoc.exists()) {
        setError("User not found");
        setLoading(false);
        return;
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      setUser(userData);
      setDisplayName(userData.displayName || "");
      setSelectedRoles(userData.roles || []);
      setStatus(userData.status || "active");

      // Load roles
      const rolesSnap = await getDocs(collection(db, `orgs/${orgId}/roles`));
      const rolesList = rolesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Role[];
      setRoles(rolesList);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load user data");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (selectedRoles.length === 0) {
      setError("User must have at least one role");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          roles: selectedRoles,
          status,
          orgId: claims.orgId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadData(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm("Send password reset email to this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: claims.orgId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      alert("Password reset email sent!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: claims.orgId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      router.push("/portal/admin/users");
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
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

  if (!hasScope("admin.read") || !user) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">
            {error || "User not found or you don't have permission"}
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
            href="/portal/admin/users"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-xl">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.displayName || "Edit User"}</h1>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">User updated successfully!</p>
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
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="font-semibold mb-4">User Information</h3>

              <div>
                <p className="text-sm text-muted-foreground mb-1">User ID</p>
                <p className="text-sm font-mono">{user.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created
                </p>
                <p className="text-sm">
                  {user.createdAt?.toDate
                    ? new Date(user.createdAt.toDate()).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Login
                </p>
                <p className="text-sm">
                  {user.lastLoginAt?.toDate
                    ? new Date(user.lastLoginAt.toDate()).toLocaleDateString()
                    : "Never"}
                </p>
              </div>

              <div className="pt-4 border-t space-y-2">
                {hasScope("admin.write") && (
                  <>
                    <button
                      onClick={handleResetPassword}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Key className="h-4 w-4" />
                      Reset Password
                    </button>
                    <button
                      onClick={handleDelete}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        showDeleteConfirm
                          ? "bg-destructive text-white hover:bg-destructive/90"
                          : "border border-destructive text-destructive hover:bg-destructive/10"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {showDeleteConfirm ? "Confirm Delete" : "Delete User"}
                    </button>
                    {showDeleteConfirm && (
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                  disabled={!hasScope("admin.write")}
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!hasScope("admin.write")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Roles <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No roles available</p>
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
                          disabled={!hasScope("admin.write")}
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
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              {hasScope("admin.write") && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={submitting || selectedRoles.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-5 w-5" />
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <Link
                    href="/portal/admin/users"
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
