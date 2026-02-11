"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  RefreshCw,
  Truck,
  CheckSquare,
  Settings,
  LogOut,
  Monitor,
  FlaskConical,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["administrador", "mesero", "cajero"],
  },
  {
    name: "Productos",
    href: "/productos",
    icon: Package,
    roles: ["administrador", "mesero", "cajero"],
  },
  {
    name: "Sync Fudo",
    href: "/sync",
    icon: RefreshCw,
    roles: ["administrador"],
  },
  {
    name: "Delivery",
    href: "/delivery",
    icon: Truck,
    roles: ["administrador"],
  },
  {
    name: "Checklist",
    href: "/checklist",
    icon: CheckSquare,
    roles: ["administrador", "mesero"],
  },
  {
    name: "Configuracion",
    href: "/configuracion",
    icon: Settings,
    roles: ["administrador"],
  },
  {
    name: "POS",
    href: "/pos/caja",
    icon: Monitor,
    roles: ["administrador", "cajero"],
  },
  {
    name: "LAB",
    href: "/lab",
    icon: FlaskConical,
    roles: ["administrador"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();

  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.rol)
  );

  const userName = user?.nombre || "Usuario";
  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-64 flex-col bg-black text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b-[3px] border-white/20">
        <div className="w-10 h-10 bg-[#DC2626] border-[3px] border-white flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">FANZINE</h1>
          <p className="text-xs text-white/50 uppercase tracking-widest">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 text-sm transition-all",
                  isActive
                    ? "px-4 py-3 bg-[#DC2626] text-white font-bold border-[3px] border-white"
                    : "px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#FDE047] border-2 border-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">{initials}</span>
          </div>
          <div>
            <p className="font-bold text-sm text-white">{userName}</p>
            <p className="text-xs text-white/40 uppercase">
              {user?.rol || "—"}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 font-medium text-sm transition-all"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
