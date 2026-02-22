# Customers

**Base:** `/customers`

## Endpoints

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/customers` | Listar clientes |
| GET | `/customers/{id}` | Obtener cliente |
| POST | `/customers` | Crear cliente |
| PATCH | `/customers/{id}` | Actualizar cliente |
| DELETE | `/customers/{id}` | Eliminar cliente |

## GET /customers

**Filtros:**
| Filtro | Valores |
|--------|---------|
| `filter[active]` | `eq.true`, `eq.false` |
| `filter[firstSaleDate]` | `gte.DATE`, `lte.DATE`, `and(gte.DATE,lte.DATE)` |
| `filter[lastSaleDate]` | (igual que firstSaleDate) |
| `filter[houseAccountEnabled]` | `eq.true`, `eq.false` |
| `filter[origin]` | `eq.ONLINE-MENU`, `is.null` |
| `filter[salesCount]` | `eq.N`, `gte.N`, `lte.N`, `and(gte.N,lte.N)` |
| `filter[@all]` | `fts.texto` (busqueda full-text) |

**Sort:** `id`, `-id`, `name`, `-name`, `salesCount`, `-salesCount`

## Response attributes

```
active: boolean
address: string (JSON array)
birthDate: date
comment: string
createdAt: datetime
discountPercentage: number (1-100)
email: string
fiscalAddress: { postalCode, addressType, state, municipality, city, neighborhood, street, number }
firstSaleDate: datetime          ← read-only
historicalSalesCount: integer    ← read-only
historicalTotalSpent: number     ← read-only
houseAccountBalance: number      ← read-only
houseAccountEnabled: boolean
lastSaleDate: datetime           ← read-only
name: string
origin: string                   ← read-only
phone: string
salesCount: integer              ← read-only
vatNumber: string
```

## POST /customers

```json
{
  "data": {
    "type": "Customer",
    "attributes": {
      "name": "Paula",            // REQUIRED, 1-90 chars
      "email": "paula@mail.com",  // opcional, 1-90 chars
      "phone": "+57 300 1234",    // opcional, 1-45 chars
      "active": true,
      "discountPercentage": 10,
      "houseAccountEnabled": false
    },
    "relationships": {
      "paymentMethod": {           // REQUIRED
        "data": { "id": "1", "type": "PaymentMethod" }
      }
    }
  }
}
```

## PATCH /customers/{id}

Mismos attributes, todos opcionales. `birthDate`, `comment`, `discountPercentage`, `fiscalAddress` aceptan `null` para limpiar.
