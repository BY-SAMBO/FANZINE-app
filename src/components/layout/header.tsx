"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center gap-4 border-b-[3px] border-black bg-white px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileNav />
        </SheetContent>
      </Sheet>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-8 h-8 bg-[#DC2626] border-2 border-black flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <span className="font-bold tracking-tight">FANZINE</span>
      </div>

      <div className="flex-1" />

      {/* User info (desktop) */}
      <div className="hidden items-center gap-2 text-sm lg:flex">
        <span className="font-medium text-black">
          {user?.nombre}
        </span>
        <span className="bg-[#FDE047] border-2 border-black px-2 py-0.5 text-xs font-bold uppercase text-black">
          {user?.rol}
        </span>
      </div>
    </header>
  );
}
