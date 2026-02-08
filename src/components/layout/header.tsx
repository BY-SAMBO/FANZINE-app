"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Film } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
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
        <Film className="h-5 w-5 text-primary" />
        <span className="font-bold">FANZINE</span>
      </div>

      <div className="flex-1" />

      {/* User info (desktop) */}
      <div className="hidden items-center gap-2 text-sm lg:flex">
        <span className="text-muted-foreground">
          {user?.nombre}
        </span>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
          {user?.rol}
        </span>
      </div>
    </header>
  );
}
