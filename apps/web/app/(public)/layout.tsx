"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogIn, UserPlus, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const navigationLinks = [
    { name: "Home", href: "/" },
    { name: "Mission", href: "/mission" },
    { name: "Programs", href: "/programs" },
    { name: "Events", href: "/events" },
    { name: "Impact", href: "/impact" },
    { name: "Transparency", href: "/transparency" },
    { name: "Contact", href: "/contact" },
    { name: "Donate", href: "/donate", highlight: true },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ADOPT A YOUNG PARENT
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.highlight
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                      : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              {user ? (
                <>
                  <Link
                    href="/portal/donor"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    My Portal
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-purple-600 hover:bg-purple-50"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200">
              <div className="space-y-1">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      link.highlight
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Auth Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/portal/donor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                    >
                      My Portal
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base font-medium rounded-md"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
