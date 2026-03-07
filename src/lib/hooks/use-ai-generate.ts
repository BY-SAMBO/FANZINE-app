"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AIGenerateRequest {
  productId: string;
  promptOverride?: string;
  promptExtra?: string;
  model?: "pro" | "preview";
  imageSize?: "1K" | "2K" | "4K";
  includeRefs?: boolean;
  addToGallery?: boolean;
}

interface AIGenerateResponse {
  success: boolean;
  imageUrl: string;
  productId: string;
  durationMs: number;
  promptUsed: string;
  model: string;
}

export type { AIGenerateRequest, AIGenerateResponse };

export function useAIGenerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AIGenerateRequest): Promise<AIGenerateResponse> => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error generando imagen");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product", data.productId] });
    },
  });
}
