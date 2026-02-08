"use client";

import { use } from "react";
import { useCategories, useProducts } from "@/lib/hooks/use-products";
import { useDeliveryModules, useDeliveryCategoryTemplate } from "@/lib/hooks/use-delivery";
import { DeliveryPreview } from "@/components/delivery/delivery-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CategoriaDeliveryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.slug === slug);

  const { data: modules } = useDeliveryModules();
  const { data: template } = useDeliveryCategoryTemplate(category?.id);
  const { data: products } = useProducts(
    category ? { categoria_id: category.id } : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/delivery">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="min-w-0 truncate text-2xl font-bold">
          Delivery — {category?.nombre || slug}
        </h1>
      </div>

      {/* Template info */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template de categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                Modulos en orden:
              </span>
              {template.modulos_orden.map((mod) => (
                <Badge key={mod} variant="outline">
                  {mod}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview for first product */}
      {products && products[0] && modules && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Preview con: {products[0].nombre}
          </h3>
          <DeliveryPreview
            product={products[0]}
            modules={modules}
            categoryTemplate={template || null}
          />
        </div>
      )}
    </div>
  );
}
