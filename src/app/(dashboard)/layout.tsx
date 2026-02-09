import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/layout/providers";
import { AuthProvider } from "@/components/layout/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { UserProfile } from "@/types/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile server-side — no client-side auth needed
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <Providers>
      <AuthProvider profile={profile as UserProfile}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar - hidden on mobile */}
          <aside className="hidden lg:block">
            <Sidebar />
          </aside>

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-white p-4 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </AuthProvider>
    </Providers>
  );
}
