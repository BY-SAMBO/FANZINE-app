# Products

**Base:** `/products`

## Endpoints

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/products` | Listar productos |
| GET | `/products/{id}` | Obtener producto |
| POST | `/products` | Crear producto |
| PATCH | `/products/{id}` | Actualizar producto |

## GET /products

**Filtros:**
| Filtro | Ejemplo |
|--------|---------|
| `filter[id]` | `in.(1,3,2345)` |
| `filter[name]` | `ilike.%texto%` |
| `filter[productCategoryId]` | `eq.5` |
| `filter[active]` | `eq.true` |
| `filter[stock]` | `isdistinct.null` |
| `filter[stockControl]` | `eq.true` |

**Sort:** `id`, `-id`, `name`, `-name`

**Include:** `productCategory`, `productModifiersGroups`, `productModifiersGroups.productModifiers`, `productModifiersGroups.productModifiers.product`, `productProportions`, `proportions`, `unit`

## Response attributes

```
active: boolean
code: string (1-45 chars)
cost: number (min: 0)
description: string (1-255 chars)
enableOnlineMenu: boolean
enableQrMenu: boolean
favourite: boolean
imageUrl: string          ← READ-ONLY
name: string (1-45 chars)
position: number
preparationTime: number | null
price: number
sellAlone: boolean
stock: number
stockControl: boolean
```

**Relationships:**
- `productCategory` → `{ id, type: "ProductCategory" }`
- `productModifiersGroups` → `[{ id, type: "ProductModifiersGroup" }]`
- `kitchen` → `{ id, type: "Kitchen" }`

## POST /products

```json
{
  "data": {
    "type": "Product",
    "attributes": {
      "name": "Producto",       // REQUIRED, 1-45 chars
      "price": 250.5,           // REQUIRED, min: 0
      "code": "COD01",          // optional, 1-45 chars
      "cost": 100,              // optional, min: 0
      "description": "...",     // optional, 1-255 chars
      "stock": 50,              // optional
      "stockControl": true      // optional
    },
    "relationships": {
      "productCategory": {       // REQUIRED
        "data": { "id": "1", "type": "ProductCategory" }
      }
    }
  }
}
```

## PATCH /products/{id}

```json
{
  "data": {
    "id": "1",
    "type": "Product",
    "attributes": {
      "name": "Nuevo Nombre",
      "price": 300,
      "code": "NW001",
      "cost": 100,
      "description": "Nueva desc",
      "stock": 25,
      "stockControl": true
    }
  }
}
```

**Solo acepta:** `name`, `code`, `description`, `price`, `cost`, `stock`, `stockControl`

**imageUrl es READ-ONLY** — no se puede subir fotos via API.

No se pueden cambiar relationships en PATCH (ni `productCategory`, ni `active`, ni `sellAlone`).
