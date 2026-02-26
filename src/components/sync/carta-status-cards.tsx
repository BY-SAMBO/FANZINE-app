"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ImageOff, Unlink, Cloud } from "lucide-react";
import type { CartaReadinessData } from "@/types/sync";

interface CartaStatusCardsProps {
  summary: CartaReadinessData["summary"] | undefined;
  isLoading: boolean;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function CartaStatusCards({
  summary,
  isLoading,
  activeFilter,
  onFilterChange,
}: CartaStatusCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const items = [
    {
      key: "listos",
      title: "Listos",
      value: summary.listos,
      icon: CheckCircle,
      color: "text-green-500",
      ringColor: "ring-green-500",
    },
    {
      key: "sin_foto",
      title: "Sin foto",
      value: summary.sin_foto,
      icon: ImageOff,
      color: "text-yellow-500",
      ringColor: "ring-yellow-500",
    },
    {
      key: "sin_fudo",
      title: "Sin vincular Fudo",
      value: summary.sin_fudo,
      icon: Unlink,
      color: "text-red-500",
      ringColor: "ring-red-500",
    },
    {
      key: "fudo_only",
      title: "Solo en Fudo",
      value: summary.fudo_only,
      icon: Cloud,
      color: "text-blue-500",
      ringColor: "ring-blue-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.key}
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === item.key ? `ring-2 ${item.ringColor}` : ""
          }`}
          onClick={() =>
            onFilterChange(activeFilter === item.key ? "todos" : item.key)
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">
              de {summary.total} productos
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
