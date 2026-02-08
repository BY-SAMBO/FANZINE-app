export interface Category {
  id: string;
  nombre: string;
  slug: string;
  fudo_category_id: string | null;
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_SLUGS = [
  "tacos",
  "nachos",
  "perros",
  "chicanitas",
  "crispetas",
  "helados",
  "milkshakes",
  "bebidas",
  "tex-mex",
  "postres",
  "toppings",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
