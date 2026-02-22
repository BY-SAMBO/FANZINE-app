# Items y Subitems

## Items (lineas de venta)

**Base:** `/items`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/items` | Listar items |
| GET | `/items/{id}` | Obtener item |
| POST | `/items` | Agregar producto a una venta |
| PATCH | `/items/{id}` | Cancelar o cambiar estado |

### GET /items

**Sort:** `id`, `-id`, `createdAt`, `-createdAt`

**Include:** `product`, `subitems`, `subitems.product`

### Response attributes

```
canceled: boolean
cancellationComment: string (1-255)
comment: string (1-255)
createdAt: datetime
price: number
quantity: number
status: null | "PENDING" | "IN-COURSE" | "READY" | "SERVED"
paid: boolean
```

**Relationships:**
- `product` → `{ id, type: "Product" }`
- `sale` → `{ id, type: "Sale" }`
- `subitems` → `[{ id, type: "Item" }]`
- `priceList` → `{ id, type: "PriceList" }`

### POST /items

```json
{
  "data": {
    "type": "Item",
    "attributes": {
      "quantity": 3,        // REQUIRED
      "price": 100,         // opcional (override precio)
      "comment": "Sin sal"  // opcional, 1-255
    },
    "relationships": {
      "product": { "data": { "id": "1", "type": "Product" } },  // REQUIRED
      "sale": { "data": { "id": "1", "type": "Sale" } }          // REQUIRED
    }
  }
}
```

### PATCH /items/{id}

**Cancelar item (ambos campos requeridos juntos):**
```json
{
  "data": {
    "id": "1",
    "type": "Item",
    "attributes": {
      "canceled": true,
      "cancellationComment": "Cliente cambio de opinion"
    }
  }
}
```

**Cambiar estado:**
```json
{
  "data": {
    "id": "1",
    "type": "Item",
    "attributes": {
      "status": "READY",  // "PENDING" | "IN-COURSE" | "READY" | "SERVED"
      "paid": true,
      "quantity": 2
    }
  }
}
```

**Flujo de estados:** `PENDING → IN-COURSE → READY → SERVED`

---

## Subitems (toppings/modificadores dentro de un item)

**Base:** `/subitems`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| POST | `/subitems` | Agregar topping a un item |

**No hay GET collection ni PATCH para subitems.**

### POST /subitems

```json
{
  "data": {
    "type": "Subitem",
    "attributes": {
      "quantity": 1,        // REQUIRED
      "price": 0,           // opcional, min: 0, max: 99999999.99
      "comment": "..."      // opcional, 1-255
    },
    "relationships": {
      "product": {                          // REQUIRED (el producto-topping)
        "data": { "id": "42", "type": "Product" }
      },
      "item": {                             // REQUIRED (el item padre)
        "data": { "id": "1", "type": "Item" }
      },
      "productModifiersGroup": {            // REQUIRED (grupo de modifiers)
        "data": { "id": "1", "type": "ProductModifiersGroup" }
      }
    }
  }
}
```

### Response attributes

```
comment: string
createdAt: datetime
price: number
quantity: number
status: null | "PENDING" | "IN-COURSE" | "READY" | "SERVED"
```
