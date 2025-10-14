"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  Plug,
  FileText,
  Database,
  Activity,
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasScope } = useAuth();
  const pathname = usePathname();

  if (!user || !hasScope("admin.read")) {
    return <>{children}</>;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/portal/admin",
      icon: LayoutDashboard,
      scope: "admin.read",
    },
    {
      name: "Settings",
      href: "/portal/admin/settings",
      icon: Settings,
      scope: "admin.read",
    },
    {
      name: "Users",
      href: "/portal/admin/users",
      icon: Users,
      scope: "admin.read",
    },
    {
      name: "Roles",
      href: "/portal/admin/roles",
      icon: Shield,
      scope: "admin.read",
    },
    {
      name: "Integrations",
      href: "/portal/admin/integrations",
      icon: Plug,
      scope: "admin.read",
    },
    {
      name: "Audit Logs",
      href: "/portal/admin/audit",
      icon: FileText,
      scope: "admin.read",
    },
    {
      name: "System Health",
      href: "/portal/admin/system",
      icon: Activity,
      scope: "admin.read",
    },
    {
      name: "Backup",
      href: "/portal/admin/backup",
      icon: Database,
      scope: "admin.read",
    },
  ];

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">AAYP Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organization Management
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            if (!hasScope(item.scope)) return null;

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
