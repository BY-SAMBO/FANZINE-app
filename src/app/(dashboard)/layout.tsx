import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/layout/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log(
    `[LAYOUT] getUser: ${user ? `OK (id=${user.id}, email=${user.email})` : "NO USER"} | error: ${error?.message || "none"}`
  );

  if (!user) {
    console.log(`[LAYOUT] REDIRECT → /login`);
    redirect("/login");
  }

  return (
    <Providers>
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
    </Providers>
  );
}
