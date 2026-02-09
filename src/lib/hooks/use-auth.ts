"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const profileLoaded = useRef(false);

  useEffect(() => {
    // Single source of truth: onAuthStateChange handles ALL auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        `[AUTH] event=${event} | user=${session?.user?.email || "none"} | expires_at=${session?.expires_at || "none"}`
      );

      if (!session?.user) {
        console.log(`[AUTH] No session → clearing user`);
        setUser(null);
        setIsLoading(false);
        // Redirect on explicit sign-out or if no initial session
        if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
          window.location.href = "/login";
        }
        return;
      }

      // Avoid duplicate profile fetches for rapid-fire events
      if (profileLoaded.current && event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[AUTH] Fetching profile for ${session.user.id}...`);
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        console.log(
          `[AUTH] Profile: ${profile ? `OK (${(profile as Record<string, unknown>).nombre}, ${(profile as Record<string, unknown>).rol})` : "NONE"} | error: ${profileError?.message || "none"}`
        );

        setUser(profile as UserProfile | null);
        profileLoaded.current = !!profile;
      } catch (err) {
        console.error(`[AUTH] Profile EXCEPTION:`, err);
      }

      setIsLoading(false);
    });

    // Safety timeout: if nothing fires in 5s, stop loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("[AUTH] TIMEOUT: no auth event in 5s → redirect /login");
        setIsLoading(false);
        window.location.href = "/login";
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

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
