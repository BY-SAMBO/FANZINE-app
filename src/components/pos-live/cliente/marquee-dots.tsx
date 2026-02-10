"use client";

import { cn } from "@/lib/utils";

interface MarqueeDotsProps {
  count?: number;
  className?: string;
}

export function MarqueeDots({ count = 13, className }: MarqueeDotsProps) {
  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i % 2 === 0
              ? "bg-[#DC2626] shadow-[0_0_5px_rgba(220,38,38,0.4)] animate-[chase-a_1.3s_ease-in-out_infinite]"
              : "bg-[#2d2430] shadow-[0_0_3px_rgba(45,36,48,0.3)] animate-[chase-b_1.3s_ease-in-out_infinite]"
          )}
        />
      ))}
    </div>
  );
}
