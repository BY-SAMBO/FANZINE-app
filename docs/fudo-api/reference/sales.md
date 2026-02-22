# Sales (Ventas)

**Base:** `/sales`

## Endpoints

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/sales` | Listar ventas |
| GET | `/sales/{id}` | Obtener venta |
| POST | `/sales` | Crear venta |
| PATCH | `/sales/{id}` | Actualizar venta (cambiar estado, cerrar) |

## GET /sales

**Filtros:**
| Filtro | Valores |
|--------|---------|
| `filter[createdAt]` | `gte.DATE`, `lte.DATE`, `and(gte.DATE,lte.DATE)` |
| `filter[saleType]` | `eq.EAT-IN`, `eq.TAKEAWAY`, `eq.DELIVERY`, `in.(EAT-IN,TAKEAWAY)` |
| `filter[saleState]` | `in.(PENDING,CANCELED,CLOSED,IN-COURSE,PAYMENT-PROCESS,DELIVERY-SENT,READY-TO-DELIVER)` |
| `filter[userId]` | `eq.123` |
| `filter[@all]` | `fts.texto` |

**Sort:** `id`, `-id`, `createdAt`, `-createdAt`, `closedAt`, `-closedAt`

**Include:** `items`, `items.product`, `items.product.productCategory`, `items.subitems`, `items.subitems.product`, `payments`, `payments.paymentMethod`, `customer`, `discounts`, `tips`, `shippingCosts`, `table`, `table.room`, `waiter`, `saleIdentifier`, `commercialDocuments`

## Response attributes

```
closedAt: datetime
comment: string
createdAt: datetime
people: integer
customerName: string
anonymousCustomer: { name, phone, address }
total: number
saleType: "EAT-IN" | "TAKEAWAY"
saleState: "CANCELED" | "CLOSED" | "IN-COURSE" | "PENDING" | "PAYMENT-PROCESS" | "DELIVERY-SENT" | "READY-TO-DELIVER"
```

## POST /sales

### TAKEAWAY (usado por FANZINE POS)

```json
{
  "data": {
    "type": "Sale",
    "attributes": {
      "saleType": "TAKEAWAY",    // REQUIRED
      "people": 1,               // REQUIRED, 1-100
      "comment": "...",          // optional, 1-255 chars
      "customerName": "Juan"     // optional, 1-90 chars
    }
  }
}
```

### EAT-IN

```json
{
  "data": {
    "type": "Sale",
    "attributes": {
      "saleType": "EAT-IN",
      "people": 5
    },
    "relationships": {
      "table": { "data": { "id": "1", "type": "Table" } }  // REQUIRED para EAT-IN
    }
  }
}
```

Opcionalmente: `waiter`, `customer`, `saleIdentifier` en relationships.

## PATCH /sales/{id}

```json
{
  "data": {
    "id": "1",
    "type": "Sale",
    "attributes": {
      "saleState": "CLOSED"    // "CLOSED" | "IN-COURSE" | "PAYMENT-PROCESS"
    }
  }
}
```

Otros campos opcionales: `comment`, `people`, `customerName`, `saleType`.

Relationships opcionales: `table`, `waiter`, `customer` (data: null para desvincular), `saleIdentifier`.

## Flujo POS FANZINE (create → items → subitems → payment → close)

1. `POST /sales` → saleId
2. `POST /items` por cada producto (ver items-subitems.md)
3. `POST /subitems` por cada topping (ver items-subitems.md)
4. `POST /payments` (ver payments.md)
5. `PATCH /sales/{id}` con `saleState: "CLOSED"`

## Flujo de estados

```
PENDING → IN-COURSE → PAYMENT-PROCESS → CLOSED
                                      → CANCELED
```
