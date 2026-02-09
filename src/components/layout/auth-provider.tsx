"use client";

import { useMemo } from "react";
import { AuthContext, useSignOut } from "@/lib/hooks/use-auth";
import type { UserProfile } from "@/types/auth";

interface AuthProviderProps {
  profile: UserProfile;
  children: React.ReactNode;
}

export function AuthProvider({ profile, children }: AuthProviderProps) {
  const signOut = useSignOut();

  const value = useMemo(
    () => ({
      user: profile,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: profile.rol === "administrador",
      signOut,
    }),
    [profile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
