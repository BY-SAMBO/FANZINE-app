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
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();

  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.rol)
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <Film className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">FANZINE</span>
      </div>

      <Separator />

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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User */}
      <div className="p-4">
        <div className="mb-2 text-sm">
          <p className="font-medium">{user?.nombre || "Usuario"}</p>
          <p className="text-muted-foreground text-xs capitalize">
            {user?.rol || "—"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesion
        </Button>
      </div>
    </div>
  );
}
