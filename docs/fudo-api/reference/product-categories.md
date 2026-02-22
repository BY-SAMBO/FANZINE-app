# Product Categories

**Base:** `/product-categories`

**IMPORTANTE:** El endpoint usa hyphen (`product-categories`), NO camelCase.

## Endpoints

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/product-categories` | Listar categorias |
| GET | `/product-categories/{id}` | Obtener categoria |
| POST | `/product-categories` | Crear categoria |
| PATCH | `/product-categories/{id}` | Actualizar categoria |

## GET /product-categories

**Sort:** `id`, `-id`, `name`, `-name`

**Include:** `products`, `parentCategory`, `taxes`

## Response attributes

```
enableOnlineMenu: boolean
name: string (5-90 chars)
preparationTime: number | null (min: 0)
position: number
```

**Relationships:**
- `kitchen` → `{ id, type: "Kitchen" }`
- `parentCategory` → `{ id, type: "ProductCategory" }` (sub-categorias)

## POST /product-categories

```json
{
  "data": {
    "type": "ProductCategory",
    "attributes": {
      "name": "Bebidas"   // REQUIRED, 1-90 chars
    }
  }
}
```

## PATCH /product-categories/{id}

```json
{
  "data": {
    "id": "1",
    "type": "ProductCategory",
    "attributes": {
      "name": "Nuevo Nombre",
      "enableOnlineMenu": true
    }
  }
}
```
