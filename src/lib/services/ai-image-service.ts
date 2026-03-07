import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import type { SharedV3ProviderOptions } from "@ai-sdk/provider";

const gw = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY ?? "" });

const MODELS = {
  pro: "google/gemini-3-pro-image",
  preview: "google/gemini-2.5-flash-image-preview",
} as const;

export type ModelType = keyof typeof MODELS;
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type ImageSize = "1K" | "2K" | "4K";

export interface GenerateImageOptions {
  prompt: string;
  promptExtra?: string;
  referenceImageUrls?: string[];
  model?: ModelType;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
}

export interface GenerateImageResult {
  imageBuffer: Buffer;
  durationMs: number;
  promptUsed: string;
  model: string;
}

export async function generateProductImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const {
    prompt,
    promptExtra,
    referenceImageUrls,
    model = "pro",
    imageSize,
  } = options;

  const start = Date.now();

  const promptFinal = prompt + (promptExtra ? "\n\nAdditional instructions: " + promptExtra : "");

  // Build multimodal content array
  const content: Array<
    | { type: "image"; image: Buffer; mimeType: "image/png" }
    | { type: "text"; text: string }
  > = [];

  // Fetch reference images if provided
  if (referenceImageUrls && referenceImageUrls.length > 0) {
    for (const url of referenceImageUrls) {
      const buffer = Buffer.from(await (await fetch(url)).arrayBuffer());
      content.push({
        type: "image" as const,
        image: buffer,
        mimeType: "image/png" as const,
      });
    }
  }

  content.push({ type: "text" as const, text: promptFinal });

  // Provider options — imageConfig only for pro model
  const providerOptions: SharedV3ProviderOptions = {
    google: {
      responseModalities: ["TEXT", "IMAGE"],
      ...(model === "pro" && imageSize ? { imageConfig: { imageSize } } : {}),
    },
  };

  const result = await generateText({
    model: gw(MODELS[model]),
    messages: [{ role: "user", content }],
    providerOptions,
  });

  // Extract generated image from result
  const file = result.files?.[0];
  if (!file) {
    throw new Error("No se generó imagen. El modelo no devolvió archivos.");
  }

  const imageBuffer = Buffer.from(
    file.uint8Array ?? Buffer.from(file.base64, "base64")
  );

  return {
    imageBuffer,
    durationMs: Date.now() - start,
    promptUsed: promptFinal,
    model: MODELS[model],
  };
}
