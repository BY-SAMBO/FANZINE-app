"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Camera, Check, ImageOff, Unlink, Cloud } from "lucide-react";
import type { CartaReadinessItem, CartaFudoOnly, CartaStatus } from "@/types/sync";

interface CartaReadinessTableProps {
  items: CartaReadinessItem[];
  fudoOnly: CartaFudoOnly[];
  filter: string;
}

const statusConfig: Record<
  CartaStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Check }
> = {
  listo: { label: "Listo", variant: "default", icon: Check },
  sin_foto: { label: "Sin foto", variant: "secondary", icon: ImageOff },
  sin_fudo: { label: "Sin Fudo", variant: "destructive", icon: Unlink },
  sin_foto_fudo: { label: "Sin foto + Fudo", variant: "destructive", icon: Unlink },
};

function StatusBadge({ status }: { status: CartaStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function PhotoCell({
  foto,
  nombre,
  productId,
}: {
  foto: string | null;
  nombre: string;
  productId: string;
}) {
  return (
    <a
      href={`/productos/${productId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted transition-opacity hover:opacity-80"
      title={foto ? "Ver/cambiar foto" : "Agregar foto"}
    >
      {foto ? (
        <Image
          src={foto}
          alt={nombre}
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Camera className="h-4 w-4" />
        </div>
      )}
    </a>
  );
}

export function CartaReadinessTable({
  items,
  fudoOnly,
  filter,
}: CartaReadinessTableProps) {
  // Apply filter
  let filtered = items;
  if (filter === "listos") {
    filtered = items.filter((i) => i.status === "listo");
  } else if (filter === "sin_foto") {
    filtered = items.filter((i) => i.status === "sin_foto");
  } else if (filter === "sin_fudo") {
    filtered = items.filter(
      (i) => i.status === "sin_fudo" || i.status === "sin_foto_fudo"
    );
  }
  // "fudo_only" filter shows only the fudo_only section (empty filtered)
  const showLocalProducts = filter !== "fudo_only";
  const showFudoOnly = filter === "todos" || filter === "fudo_only";

  // Group by category
  const grouped = new Map<string, CartaReadinessItem[]>();
  for (const item of filtered) {
    const key = item.categoria_nombre;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  // Sort groups by category name
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-6">
      {showLocalProducts && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Foto</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="w-[100px]">Precio</TableHead>
                <TableHead className="w-[100px]">Fudo</TableHead>
                <TableHead className="w-[140px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay productos con este filtro.
                  </TableCell>
                </TableRow>
              )}
              {sortedGroups.map(([catName, catItems]) => {
                const listosCount = catItems.filter(
                  (i) => i.status === "listo"
                ).length;
                return (
                  <CategoryGroup
                    key={catName}
                    categoryName={catName}
                    items={catItems}
                    listosCount={listosCount}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {showFudoOnly && fudoOnly.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Cloud className="h-4 w-4 text-blue-500" />
            Solo en Fudo ({fudoOnly.length})
          </h3>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fudo ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fudoOnly.map((p) => (
                  <TableRow key={p.fudo_id}>
                    <TableCell className="font-mono text-xs">
                      {p.fudo_id}
                    </TableCell>
                    <TableCell className="text-xs">{p.code || "—"}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      ${(p.price ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryGroup({
  categoryName,
  items,
  listosCount,
}: {
  categoryName: string;
  items: CartaReadinessItem[];
  listosCount: number;
}) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell colSpan={5} className="py-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{categoryName}</span>
            <span className="text-xs text-muted-foreground">
              {listosCount}/{items.length} listos
            </span>
          </div>
        </TableCell>
      </TableRow>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="py-1.5">
            <PhotoCell
              foto={item.foto_principal}
              nombre={item.nombre}
              productId={item.id}
            />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.nombre}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {item.id}
              </span>
            </div>
          </TableCell>
          <TableCell className="font-mono text-sm">
            ${(item.precio_venta ?? 0).toLocaleString()}
          </TableCell>
          <TableCell>
            {item.fudo_id ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <span className="text-xs text-red-500">Sin vincular</span>
            )}
          </TableCell>
          <TableCell>
            <StatusBadge status={item.status} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
