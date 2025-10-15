"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  Heart,
  Briefcase
} from "lucide-react";

// Client component - no exports needed

interface UserClaims {
  role?: string;
  scopes?: string[];
  orgId?: string;
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<UserClaims>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      
      // Get custom claims
      const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh
      setClaims(idTokenResult.claims as UserClaims);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const hasScope = (scope: string) => {
    return claims.scopes?.includes(scope) || false;
  };

  const navigationItems = [
    // Admin
    ...(hasScope('admin.read') ? [{
      name: 'Admin',
      icon: Building2,
      href: '/portal/admin',
      children: [
        { name: 'Dashboard', href: '/portal/admin' },
        { name: 'Users', href: '/portal/admin/users' },
        { name: 'Roles', href: '/portal/admin/roles' },
        { name: 'Settings', href: '/portal/admin/settings' },
        { name: 'Integrations', href: '/portal/admin/integrations' },
      ]
    }] : []),
    
    // Finance
    ...(hasScope('finance.read') ? [{
      name: 'Finance',
      icon: DollarSign,
      href: '/portal/finance',
      children: [
        { name: 'Dashboard', href: '/portal/finance' },
        { name: 'Transactions', href: '/portal/finance/transactions' },
        { name: 'Settlements', href: '/portal/finance/settlements' },
        { name: 'Form 990', href: '/portal/finance/reports/990' },
        { name: 'Board Pack', href: '/portal/finance/reports/board-pack' },
      ]
    }] : []),
    
    // Manager
    ...(hasScope('campaign.read') ? [{
      name: 'Manager',
      icon: TrendingUp,
      href: '/portal/manager',
      children: [
        { name: 'Dashboard', href: '/portal/manager' },
        { name: 'Campaigns', href: '/portal/manager/campaigns' },
        { name: 'Team', href: '/portal/manager/team' },
        { name: 'Analytics', href: '/portal/manager/analytics' },
      ]
    }] : []),
    
    // Fundraiser
    ...(hasScope('donor.read') ? [{
      name: 'Fundraiser',
      icon: Heart,
      href: '/portal/fundraiser',
      children: [
        { name: 'Dashboard', href: '/portal/fundraiser' },
        { name: 'Donors', href: '/portal/fundraiser/donors' },
        { name: 'Tasks', href: '/portal/fundraiser/tasks' },
        { name: 'Pledges', href: '/portal/fundraiser/pledges' },
        { name: 'Leaderboard', href: '/portal/fundraiser/leaderboard' },
      ]
    }] : []),
    
    // Employee
    ...(hasScope('hr.read') ? [{
      name: 'Employee',
      icon: Briefcase,
      href: '/portal/employee',
      children: [
        { name: 'Dashboard', href: '/portal/employee' },
        { name: 'Onboarding', href: '/portal/employee/onboarding' },
        { name: 'Documents', href: '/portal/employee/documents' },
        { name: 'Training', href: '/portal/employee/training' },
        { name: 'Time Off', href: '/portal/employee/time-off' },
        { name: 'Directory', href: '/portal/employee/directory' },
      ]
    }] : []),
    
    // Donor (everyone has access)
    {
      name: 'Donor Portal',
      icon: UserCircle,
      href: '/portal/donor',
      children: [
        { name: 'Dashboard', href: '/portal/donor' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link href="/" className="ml-4 flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ADOPT A YOUNG PARENT
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <p className="font-medium">{user?.email}</p>
                <p className="text-xs text-gray-500">Role: {claims.role || 'donor'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 pt-16 transition-transform duration-300 ease-in-out overflow-y-auto`}
        >
          <nav className="px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-md font-medium"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
                {item.children && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-1.5 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
