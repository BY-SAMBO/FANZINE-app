import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/layout/providers";
import { AuthProvider } from "@/components/layout/auth-provider";
import { Playfair_Display, DM_Sans, DM_Mono, JetBrains_Mono } from "next/font/google";
import type { UserProfile } from "@/types/auth";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jetbrains-mono",
});

export default async function PosLiveLayout({
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
        <div
          className={`h-screen w-screen overflow-hidden ${playfair.variable} ${dmSans.variable} ${dmMono.variable} ${jetbrainsMono.variable}`}
        >
          {children}
        </div>
      </AuthProvider>
    </Providers>
  );
}
