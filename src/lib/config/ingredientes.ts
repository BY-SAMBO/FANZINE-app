// Regex patterns for automatic ingredient detection from product descriptions
// Used to auto-generate "quitar" (remove) options in delivery config

export interface IngredientPattern {
  nombre: string;
  patterns: RegExp[];
  categoria?: string; // optional category hint
}

export const INGREDIENT_PATTERNS: IngredientPattern[] = [
  // Proteinas
  {
    nombre: "Carne molida",
    patterns: [/carne\s*molida/i, /ground\s*beef/i, /carne/i],
    categoria: "proteinas",
  },
  {
    nombre: "Pollo",
    patterns: [/pollo/i, /chicken/i],
    categoria: "proteinas",
  },
  {
    nombre: "Cerdo",
    patterns: [/cerdo/i, /pork/i, /carnitas/i],
    categoria: "proteinas",
  },
  {
    nombre: "Chorizo",
    patterns: [/chorizo/i],
    categoria: "proteinas",
  },
  {
    nombre: "Chicharron",
    patterns: [/chicharr[oó]n/i],
    categoria: "proteinas",
  },

  // Quesos
  {
    nombre: "Queso cheddar",
    patterns: [/queso\s*cheddar/i, /cheddar/i],
    categoria: "quesos",
  },
  {
    nombre: "Queso mozzarella",
    patterns: [/mozzarella/i, /mozarela/i],
    categoria: "quesos",
  },
  {
    nombre: "Queso",
    patterns: [/queso/i, /cheese/i],
    categoria: "quesos",
  },

  // Salsas
  {
    nombre: "Guacamole",
    patterns: [/guacamole/i, /guac/i],
    categoria: "salsas",
  },
  {
    nombre: "Salsa ranch",
    patterns: [/ranch/i],
    categoria: "salsas",
  },
  {
    nombre: "Salsa BBQ",
    patterns: [/bbq/i, /barbecue/i, /barbacoa/i],
    categoria: "salsas",
  },
  {
    nombre: "Pico de gallo",
    patterns: [/pico\s*de\s*gallo/i],
    categoria: "salsas",
  },
  {
    nombre: "Crema agria",
    patterns: [/crema\s*agria/i, /sour\s*cream/i],
    categoria: "salsas",
  },
  {
    nombre: "Salsa picante",
    patterns: [/salsa\s*picante/i, /hot\s*sauce/i, /picante/i],
    categoria: "salsas",
  },

  // Vegetales
  {
    nombre: "Cebolla",
    patterns: [/cebolla/i, /onion/i],
    categoria: "vegetales",
  },
  {
    nombre: "Tomate",
    patterns: [/tomate/i, /tomato/i],
    categoria: "vegetales",
  },
  {
    nombre: "Lechuga",
    patterns: [/lechuga/i, /lettuce/i],
    categoria: "vegetales",
  },
  {
    nombre: "Jalapeno",
    patterns: [/jalape[nñ]o/i, /jalapeño/i],
    categoria: "vegetales",
  },
  {
    nombre: "Maiz",
    patterns: [/ma[ií]z/i, /corn/i, /elote/i],
    categoria: "vegetales",
  },
  {
    nombre: "Aguacate",
    patterns: [/aguacate/i, /avocado/i],
    categoria: "vegetales",
  },
  {
    nombre: "Frijoles",
    patterns: [/frijoles?/i, /beans/i],
    categoria: "vegetales",
  },

  // Otros
  {
    nombre: "Nachos/Tortilla chips",
    patterns: [/nachos?/i, /tortilla\s*chips/i, /totopos/i],
    categoria: "base",
  },
  {
    nombre: "Tortilla",
    patterns: [/tortilla/i],
    categoria: "base",
  },
  {
    nombre: "Pan de perro",
    patterns: [/pan\s*(de\s*perro)?/i, /bun/i],
    categoria: "base",
  },
];

/**
 * Detect ingredients from a product description text
 */
export function detectIngredients(text: string): string[] {
  if (!text) return [];

  const detected = new Set<string>();

  for (const ingredient of INGREDIENT_PATTERNS) {
    for (const pattern of ingredient.patterns) {
      if (pattern.test(text)) {
        detected.add(ingredient.nombre);
        break;
      }
    }
  }

  return Array.from(detected);
}
