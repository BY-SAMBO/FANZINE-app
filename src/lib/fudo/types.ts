// Fudo API response types (JSON:API format)

export interface FudoAuthResponse {
  token: string;
  exp: string; // Unix timestamp string
}

export interface FudoJsonApiResponse<T> {
  data: T;
  meta?: {
    page?: {
      number: number;
      size: number;
    };
  };
  included?: FudoResource[];
}

export interface FudoResource {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships?: Record<
    string,
    {
      data: { type: string; id: string } | { type: string; id: string }[] | null;
    }
  >;
}

export interface FudoProduct extends FudoResource {
  type: "products";
  attributes: {
    name: string;
    code: string | null;
    description: string | null;
    price: number;
    active: boolean;
    image: string | null;
    position: number;
  };
  relationships: {
    productCategory: {
      data: { type: "productCategories"; id: string } | null;
    };
  };
}

export interface FudoCategory extends FudoResource {
  type: "productCategories";
  attributes: {
    name: string;
    active: boolean;
    position: number;
  };
}

export interface FudoProductPayload {
  data: {
    type: "Product";
    id?: string;
    attributes: Partial<{
      name: string;
      code: string;
      description: string;
      price: number;
      cost: number;
      stock: number;
      stockControl: boolean;
    }>;
    relationships?: {
      productCategory?: {
        data: { type: "ProductCategory"; id: string };
      };
    };
  };
}
