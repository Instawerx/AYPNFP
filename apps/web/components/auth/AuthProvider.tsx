"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthChange, getUserClaims } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  claims: any;
  loading: boolean;
  hasScope: (scope: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  claims: null,
  loading: true,
  hasScope: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userClaims = await getUserClaims();
        setClaims(userClaims);
      } else {
        setClaims(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasScope = (scope: string): boolean => {
    return claims?.scopes?.includes(scope) || false;
  };

  return (
    <AuthContext.Provider value={{ user, claims, loading, hasScope }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
