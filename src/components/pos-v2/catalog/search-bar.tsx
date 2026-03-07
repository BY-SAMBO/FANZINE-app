"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar producto..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 lg:py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20"
      />
    </div>
  );
}
