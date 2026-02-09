"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      // Use getSession (local, no network call) instead of getUser (network call that can hang)
      // Server-side middleware + layout already validate the token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log(
        `[AUTH] getSession: ${session ? `OK (email=${session.user.email}, expires_at=${session.expires_at})` : "NO SESSION"}`
      );

      if (!session?.user) {
        setIsLoading(false);
        window.location.href = "/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      console.log(
        `[AUTH] profile: ${profile ? `OK (${profile.nombre}, ${profile.rol})` : "NONE"} | error: ${profileError?.message || "none"}`
      );

      setUser(profile as UserProfile | null);
      setIsLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH] authChange: ${event} | ${session?.user?.email || "none"}`);

      if (session?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(profile as UserProfile | null);
      } else {
        setUser(null);
        window.location.href = "/login";
        return;
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.rol === "administrador",
    signOut,
  };
}
