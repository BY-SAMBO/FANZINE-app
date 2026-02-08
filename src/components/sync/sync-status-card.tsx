"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SyncComparisonResult } from "@/types/sync";
import { CheckCircle, AlertTriangle, CloudOff, Cloud } from "lucide-react";

interface SyncStatusCardProps {
  comparison: SyncComparisonResult | undefined;
  isLoading: boolean;
}

export function SyncStatusCard({ comparison, isLoading }: SyncStatusCardProps) {
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

  if (!comparison) return null;
  const { summary } = comparison;

  const items = [
    {
      title: "Sincronizados",
      value: summary.synced,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Con diferencias",
      value: summary.with_diffs,
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      title: "Solo en local",
      value: summary.local_only,
      icon: CloudOff,
      color: "text-gray-500",
    },
    {
      title: "Solo en Fudo",
      value: summary.fudo_only,
      icon: Cloud,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
