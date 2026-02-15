import { streamText, convertToModelMessages } from "ai";
import { createGateway } from "@ai-sdk/gateway";

const gw = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

export async function POST(req: Request) {
  const { messages, recipeContext } = await req.json();

  const system = `Eres el asistente del Lab Gastronómico de FANZINE (Cine & Tex-Mex, Bogotá). Ayudas al equipo a iterar recetas de perros calientes.

Contexto de la receta actual:

${recipeContext}

Responde de forma concisa, directa y útil. Puedes sugerir ajustes de ingredientes, técnicas de cocción, ideas de naming, comparaciones con otras recetas, o ayudar a resolver tareas pendientes. Siempre en español.`;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: gw("openai/gpt-4.1-mini"),
    system,
    messages: modelMessages,
  });

  return result.toTextStreamResponse();
}
