"use client";

import { useProductStats } from "@/lib/hooks/use-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  RefreshCw,
  Truck,
  CheckSquare,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useProductStats();

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Error cargando estadisticas. Recarga la pagina para intentar de nuevo.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Productos",
      value: stats?.total || 0,
      subtitle: `${stats?.activos || 0} activos`,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Sync Fudo",
      value: stats?.synced || 0,
      subtitle: `${stats?.pending_sync || 0} pendientes`,
      icon: RefreshCw,
      color: "text-green-500",
    },
    {
      title: "Delivery",
      value: stats?.delivery || 0,
      subtitle: "disponibles",
      icon: Truck,
      color: "text-orange-500",
    },
    {
      title: "Checklist",
      value: stats?.checklist_completo || 0,
      subtitle: `de ${stats?.total || 0} completos`,
      icon: CheckSquare,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Badge variant="outline">FANZINE Admin</Badge>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado Checklist Rappi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completo</span>
              <Badge variant="default">{stats?.checklist_completo || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Incompleto</span>
              <Badge variant="secondary">
                {stats?.checklist_incompleto || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pendiente</span>
              <Badge variant="outline">{stats?.checklist_pendiente || 0}</Badge>
            </div>
            {/* Progress bar */}
            <div className="pt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      stats?.total
                        ? ((stats.checklist_completo || 0) / stats.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync Fudo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sincronizados</span>
              <Badge variant="default">{stats?.synced || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pendientes</span>
              <Badge variant="secondary">{stats?.pending_sync || 0}</Badge>
            </div>
            {(stats?.pending_sync || 0) > 0 && (
              <div className="flex items-center gap-2 rounded bg-amber-50 p-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                Hay productos pendientes de sincronizar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
