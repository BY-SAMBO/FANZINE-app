"use client";

import { useState } from "react";
import { detectIngredients } from "@/lib/config/ingredientes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export function IngredientDetector() {
  const [text, setText] = useState("");
  const ingredients = detectIngredients(text);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Detector de ingredientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Pega la descripcion del producto aqui para detectar ingredientes automaticamente..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        {ingredients.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Ingredientes detectados:
            </p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="secondary">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {text && ingredients.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No se detectaron ingredientes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
