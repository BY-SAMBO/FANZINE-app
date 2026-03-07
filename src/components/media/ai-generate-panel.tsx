"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAIGenerate, type AIGenerateResponse } from "@/lib/hooks/use-ai-generate";
import { addToGallery, setMainPhoto } from "@/lib/services/media-service";

interface AIGeneratePanelProps {
  productId: string;
  productName: string;
  promptIa: string | null;
  mainPhoto: string | null;
  gallery: string[];
}

export function AIGeneratePanel({
  productId,
  productName,
  promptIa,
  mainPhoto,
  gallery,
}: AIGeneratePanelProps) {
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<"pro" | "preview">("pro");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [includeRefs, setIncludeRefs] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AIGenerateResponse | null>(null);

  const generate = useAIGenerate();
  const queryClient = useQueryClient();

  async function handleGenerate() {
    try {
      const result = await generate.mutateAsync({
        productId,
        promptOverride: useCustomPrompt ? customPrompt : undefined,
        promptExtra: undefined,
        model: selectedModel,
        imageSize: selectedModel === "pro" ? imageSize : undefined,
        includeRefs,
        addToGallery: false,
      });
      setGeneratedResult(result);
      toast.success("Imagen generada exitosamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generando imagen");
    }
  }

  async function handleAddToGallery() {
    if (!generatedResult) return;
    try {
      await addToGallery(productId, generatedResult.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Imagen agregada a la galeria");
      setGeneratedResult(null);
    } catch {
      toast.error("Error agregando imagen a la galeria");
    }
  }

  async function handleSetMain() {
    if (!generatedResult) return;
    try {
      const isInGallery = gallery.includes(generatedResult.imageUrl);
      if (!isInGallery) {
        await addToGallery(productId, generatedResult.imageUrl);
      }
      await setMainPhoto(productId, generatedResult.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Foto principal actualizada");
      setGeneratedResult(null);
    } catch {
      toast.error("Error actualizando foto principal");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Generar con IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!promptIa && !useCustomPrompt ? (
          <p className="text-sm text-muted-foreground">
            Sin prompt IA configurado. Agrega uno en la ficha del producto.
          </p>
        ) : null}

        {promptIa ? (
          <div className="rounded bg-muted p-3 text-sm max-h-32 overflow-y-auto whitespace-pre-wrap">
            {promptIa}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Checkbox
            checked={useCustomPrompt}
            onCheckedChange={(checked) => setUseCustomPrompt(checked === true)}
            id="use-custom-prompt"
          />
          <label htmlFor="use-custom-prompt" className="text-sm">
            Usar prompt personalizado
          </label>
        </div>

        {useCustomPrompt ? (
          <Textarea
            rows={4}
            placeholder="Describe la imagen..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        ) : null}

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-1">
              Modelo
            </label>
            <Select
              value={selectedModel}
              onValueChange={(v) => setSelectedModel(v as "pro" | "preview")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pro">Pro (Gemini 3)</SelectItem>
                <SelectItem value="preview">Preview (Flash)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-black/40 tracking-wider block mb-1">
              Tamano
            </label>
            <Select
              value={imageSize}
              onValueChange={(v) => setImageSize(v as "1K" | "2K" | "4K")}
              disabled={selectedModel !== "pro"}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1K">1K</SelectItem>
                <SelectItem value="2K">2K</SelectItem>
                <SelectItem value="4K">4K</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end pb-1">
            <Checkbox
              checked={includeRefs}
              onCheckedChange={(checked) => setIncludeRefs(checked === true)}
              id="include-refs"
            />
            <label htmlFor="include-refs" className="text-sm">
              Usar fotos como referencia
            </label>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            (!promptIa && !useCustomPrompt) ||
            (!customPrompt && useCustomPrompt) ||
            generate.isPending
          }
          className="w-full border-[3px] border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold transition-all h-auto py-3"
        >
          {generate.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando... (~10-30s)
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar imagen
            </>
          )}
        </Button>

        {generatedResult ? (
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={generatedResult.imageUrl}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Generado en {(generatedResult.durationMs / 1000).toFixed(1)}s ·{" "}
              {generatedResult.model}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAddToGallery}>
                Agregar a galeria
              </Button>
              <Button variant="outline" size="sm" onClick={handleSetMain}>
                Establecer como principal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedResult(null)}
              >
                Descartar
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
