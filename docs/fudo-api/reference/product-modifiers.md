# Product Modifiers

**Base:** `/product-modifiers`

Los modifiers son los toppings/opciones que se pueden agregar a un producto. Se agrupan en `ProductModifiersGroup`.

## Endpoints

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/product-modifiers` | Listar modifiers |
| GET | `/product-modifiers/{id}` | Obtener modifier |
| POST | `/product-modifiers` | Crear modifier |
| PATCH | `/product-modifiers/{id}` | Actualizar modifier |

## GET /product-modifiers

**Sort:** `id`, `-id`

**Include:** `product`

## Response attributes

```
maxQuantity: number
price: number
```

**Relationships:**
- `product` → `{ id, type: "Product" }` (el producto-topping)
- `productModifiersGroup` → `{ id, type: "ProductModifiersGroup" }`

## POST /product-modifiers

```json
{
  "data": {
    "type": "ProductModifier",
    "attributes": {
      "maxQuantity": 10,   // REQUIRED
      "price": 0           // REQUIRED
    },
    "relationships": {
      "product": {
        "data": { "id": "1", "type": "Product" }
      },
      "productModifiersGroup": {
        "data": { "id": "1", "type": "ProductModifiersGroup" }
      }
    }
  }
}
```

## PATCH /product-modifiers/{id}

```json
{
  "data": {
    "id": "1",
    "type": "ProductModifier",
    "attributes": {
      "maxQuantity": 5,
      "price": 150
    }
  }
}
```

## Contexto FANZINE

En FANZINE, los toppings (Pico de Gallo, Jalapeños, etc.) son Products de la categoria "Helados" (id: 12) en Fudo, pero funcionan como modificadores via ProductModifiersGroups. El grupo "Toppings" (id: 1) permite min 1 / max 6 toppings por producto.

Cache local: tabla `pos_modifier_cache` en Supabase, sync via `/api/pos/modifiers/sync`.
