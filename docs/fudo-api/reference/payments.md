# Payments y Payment Methods

## Payments

**Base:** `/payments`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/payments` | Listar pagos |
| GET | `/payments/{id}` | Obtener pago |
| POST | `/payments` | Registrar pago |
| PATCH | `/payments/{id}` | Cancelar pago |

### Response attributes

```
amount: number
canceled: boolean
createdAt: datetime
external_reference: string
```

**Relationships:**
- `paymentMethod` → `{ id, type: "PaymentMethod" }`
- `sale` → `{ id, type: "Sale" }`
- `expense` → `{ id, type: "Expense" }`

### POST /payments (para una venta)

```json
{
  "data": {
    "type": "Payment",
    "attributes": {
      "amount": 18000,             // REQUIRED, min: 0
      "extraData": {               // opcional
        "installments": 1,
        "cardIssuer": "Visa",
        "cardType": "DEBIT",       // "DEBIT" | "CREDIT"
        "entryType": "CHIP",       // "CHIP" | "CONTACTLESS" | "MAGSTRIPE"
        "paymentProvider": "MERCADOPAGO",
        "paymentType": "CARD",     // "CARD" | "QR"
        "externalReference": "..."
      }
    },
    "relationships": {
      "paymentMethod": { "data": { "id": "1", "type": "PaymentMethod" } },  // REQUIRED
      "sale": { "data": { "id": "1", "type": "Sale" } }                     // REQUIRED
    }
  }
}
```

### PATCH /payments/{id} (solo cancelar)

```json
{
  "data": {
    "id": "1",
    "type": "Payment",
    "attributes": {
      "canceled": true
    }
  }
}
```

---

## Payment Methods

**Base:** `/payment-methods`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/payment-methods` | Listar metodos de pago |
| GET | `/payment-methods/{id}` | Obtener metodo |

**Solo lectura** — se gestionan desde el admin de Fudo.

### Response attributes

```
name: string       (ej: "Efectivo", "Tarjeta")
active: boolean
code: string       (ej: "cash", "card")
position: number
```
