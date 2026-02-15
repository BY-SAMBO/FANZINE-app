import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";

const gw = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

const SYSTEM_CONSULTAR = (ctx: string) =>
  `Eres el asistente del Lab Gastronómico de FANZINE (Cine & Tex-Mex, Bogotá). Ayudas al equipo a iterar recetas de perros calientes.

Contexto de la receta actual:

${ctx}

Responde de forma concisa, directa y útil. Puedes sugerir ajustes de ingredientes, técnicas de cocción, ideas de naming, comparaciones con otras recetas, o ayudar a resolver tareas pendientes. Usa markdown para formatear tus respuestas (negritas, listas, headers cuando aplique). Siempre en español.`;

const SYSTEM_EDITAR = (ctx: string) =>
  `Eres el editor del Lab Gastronómico de FANZINE (Cine & Tex-Mex, Bogotá). Tu rol es interpretar instrucciones de edición sobre la receta y ejecutarlas usando las herramientas disponibles.

Contexto de la receta actual:

${ctx}

INSTRUCCIONES:
- El usuario pedirá cambios a la receta. USA LAS HERRAMIENTAS para aplicar cada cambio.
- Puedes llamar múltiples herramientas en una respuesta si hay varios cambios.
- Después de llamar las herramientas, SIEMPRE escribe un breve resumen en español de lo que cambiaste.
- Si el cambio es ambiguo, pide clarificación ANTES de usar herramientas.
- Si el cambio no tiene sentido culinario, adviértelo pero ofrece alternativas.
- Siempre en español. Sé conciso.`;

const EDIT_TOOLS = {
  updateRecipeName: tool({
    description:
      "Cambia el nombre principal de la receta (h1). Ej: de 'BIRRIA' a 'BIRRIA FUSIÓN'",
    inputSchema: z.object({
      newName: z.string().describe("El nuevo nombre de la receta"),
    }),
    execute: async ({ newName }) => ({
      success: true,
      tool: "updateRecipeName",
      args: { newName },
    }),
  }),
  updateSubtitle: tool({
    description:
      "Cambia el subtítulo de la receta (debajo del h1). Ej: 'La Quesabirria Hecha Hot Dog'",
    inputSchema: z.object({
      newSubtitle: z.string().describe("El nuevo subtítulo"),
    }),
    execute: async ({ newSubtitle }) => ({
      success: true,
      tool: "updateSubtitle",
      args: { newSubtitle },
    }),
  }),
  updateIngredientName: tool({
    description:
      "Cambia el nombre de un ingrediente. Usa el nombre actual para identificarlo.",
    inputSchema: z.object({
      currentName: z
        .string()
        .describe("Nombre actual del ingrediente (exacto como aparece)"),
      newName: z.string().describe("Nuevo nombre del ingrediente"),
    }),
    execute: async ({ currentName, newName }) => ({
      success: true,
      tool: "updateIngredientName",
      args: { currentName, newName },
    }),
  }),
  updateIngredientRole: tool({
    description:
      "Cambia la descripción del rol de un ingrediente (el texto debajo del nombre).",
    inputSchema: z.object({
      ingredientName: z
        .string()
        .describe("Nombre del ingrediente a modificar"),
      newRole: z.string().describe("Nueva descripción del rol"),
    }),
    execute: async ({ ingredientName, newRole }) => ({
      success: true,
      tool: "updateIngredientRole",
      args: { ingredientName, newRole },
    }),
  }),
  updateMeter: tool({
    description:
      "Ajusta el valor de un meter. Valores posibles: 1-5. Meters: umami, cremosidad, crunch, frescura, picante.",
    inputSchema: z.object({
      meterName: z
        .string()
        .describe(
          "Nombre del meter (umami, cremosidad, crunch, frescura, picante)",
        ),
      value: z
        .number()
        .min(1)
        .max(5)
        .describe("Nuevo valor del meter (1-5)"),
    }),
    execute: async ({ meterName, value }) => ({
      success: true,
      tool: "updateMeter",
      args: { meterName, value },
    }),
  }),
  updateFlavorProfile: tool({
    description: "Cambia el texto completo del perfil de sabor.",
    inputSchema: z.object({
      newText: z.string().describe("Nuevo texto del perfil de sabor"),
    }),
    execute: async ({ newText }) => ({
      success: true,
      tool: "updateFlavorProfile",
      args: { newText },
    }),
  }),
  updateLabNotes: tool({
    description: "Escribe o reemplaza las notas del lab.",
    inputSchema: z.object({
      notes: z.string().describe("Nuevo contenido de las notas del lab"),
    }),
    execute: async ({ notes }) => ({
      success: true,
      tool: "updateLabNotes",
      args: { notes },
    }),
  }),
  updateIngredientNotes: tool({
    description:
      "Escribe notas en el campo de input de un ingrediente específico.",
    inputSchema: z.object({
      ingredientName: z.string().describe("Nombre del ingrediente"),
      notes: z.string().describe("Notas a escribir en el campo"),
    }),
    execute: async ({ ingredientName, notes }) => ({
      success: true,
      tool: "updateIngredientNotes",
      args: { ingredientName, notes },
    }),
  }),
};

export async function POST(req: Request) {
  const { messages, recipeContext, mode } = await req.json();

  const modelMessages = await convertToModelMessages(messages);

  if (mode === "editar") {
    const result = streamText({
      model: gw("openai/gpt-4.1-mini"),
      system: SYSTEM_EDITAR(recipeContext || ""),
      messages: modelMessages,
      tools: EDIT_TOOLS,
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  }

  const result = streamText({
    model: gw("openai/gpt-4.1-mini"),
    system: SYSTEM_CONSULTAR(recipeContext || ""),
    messages: modelMessages,
  });

  return result.toTextStreamResponse();
}
