"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/pricing";
import type { PriceReport } from "@/types/sync";

interface PriceDiffTableProps {
  report: PriceReport[];
}

export function PriceDiffTable({ report }: PriceDiffTableProps) {
  if (report.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Todos los precios estan sincronizados
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Precio Local</TableHead>
            <TableHead className="text-right">Precio Fudo</TableHead>
            <TableHead className="text-right">Diferencia</TableHead>
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.map((item) => (
            <TableRow key={item.product_id}>
              <TableCell>
                <span className="font-medium">{item.nombre}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {item.product_id}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(item.precio_local)}
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(item.precio_fudo)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    item.diferencia > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {item.diferencia > 0 ? "+" : ""}
                  {formatPrice(item.diferencia)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    Math.abs(item.porcentaje) > 10
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {item.porcentaje > 0 ? "+" : ""}
                  {item.porcentaje}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
