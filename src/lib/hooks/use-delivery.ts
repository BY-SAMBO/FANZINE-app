"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryModule, DeliveryCategoryTemplate } from "@/types/delivery";

export function useDeliveryModules() {
  return useQuery({
    queryKey: ["delivery-modules"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("delivery_modules")
        .select("*")
        .order("id");
      if (error) throw error;
      return data as DeliveryModule[];
    },
  });
}

export function useDeliveryCategoryTemplate(categoriaId: string | undefined) {
  return useQuery({
    queryKey: ["delivery-template", categoriaId],
    queryFn: async () => {
      if (!categoriaId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("delivery_category_templates")
        .select("*")
        .eq("categoria_id", categoriaId)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return (data as DeliveryCategoryTemplate) || null;
    },
    enabled: !!categoriaId,
  });
}
