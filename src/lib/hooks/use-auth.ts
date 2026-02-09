"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      console.log("[AUTH] getUser: starting...");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log(
        `[AUTH] getUser result: ${authUser ? `OK (id=${authUser.id}, email=${authUser.email})` : "NO USER"} | error: ${authError?.message || "none"}`
      );

      if (!authUser) {
        console.log("[AUTH] No auth user → redirect /login");
        setIsLoading(false);
        window.location.href = "/login";
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      console.log(
        `[AUTH] session: ${session.session ? `expires_at=${session.session.expires_at}, access_token=${session.session.access_token?.slice(0, 20)}...` : "NO SESSION"}`
      );

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      console.log(
        `[AUTH] profile query: ${profile ? `OK (nombre=${profile.nombre}, rol=${profile.rol})` : "NO PROFILE"} | error: ${profileError?.message || "none"}`
      );

      setUser(profile as UserProfile | null);
      setIsLoading(false);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        `[AUTH] onAuthStateChange: event=${event} | user=${session?.user?.email || "none"} | expires_at=${session?.expires_at || "none"}`
      );

      if (session?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(profile as UserProfile | null);
      } else {
        console.log("[AUTH] Session lost → redirect /login");
        setUser(null);
        window.location.href = "/login";
        return;
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    console.log("[AUTH] signOut called");
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
