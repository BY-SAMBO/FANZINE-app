# Orders (API de Integraciones)

**IMPORTANTE:** Este endpoint usa la API de Integraciones, NO la API principal.

- **Base URL:** `https://integrations.fu.do/fudo`
- **Auth header:** `Fudo-External-App-Authorization: Bearer <token>`
- **Auth endpoint:** `POST /auth` con `{ clientId, clientSecret }`

Ver `specs/integrations-openapi.yml` para spec completa.

## Endpoints

| Metodo | Path | Descripcion |
|--------|------|-------------|
| POST | `/orders` | Crear orden (delivery/pickup) |

## POST /orders

```json
{
  "order": {
    "type": "delivery",              // REQUIRED: "delivery" | "pickup"
    "typeOptions": {                  // REQUIRED
      "expectedTime": "2024-01-15T19:00:00Z",
      "address": "Calle 123 #45-67"
    },
    "items": [                        // REQUIRED, min 1
      {
        "product": { "id": 10 },      // REQUIRED: fudo product id
        "quantity": 2,                 // REQUIRED
        "price": 10000,               // REQUIRED
        "comment": "Sin cebolla",
        "subitems": [
          {
            "productId": 42,           // REQUIRED: topping product id
            "productGroupId": 1,       // REQUIRED: modifier group id
            "quantity": 1,             // REQUIRED
            "price": 0                 // REQUIRED
          }
        ]
      }
    ],
    "customer": {
      "name": "Juan Perez",           // REQUIRED
      "phone": "+57 300 123 4567",
      "email": "juan@example.com"
    },
    "payment": {
      "total": 20000,                 // REQUIRED, min: 0
      "paymentMethod": { "id": 1 }    // opcional
    },
    "comment": "Timbre no funciona",
    "externalId": "order-abc-123",
    "shippingCost": 5000,
    "discounts": [
      { "amount": 2000 }              // o { "percentage": 10 }
    ]
  }
}
```

**Response (201):**
```json
{ "order": { "id": 123 } }
```

## Webhooks

Configurables en Fudo Admin > Administration > External Applications:

| Evento | Descripcion |
|--------|-------------|
| `ORDER-REJECTED` | Orden rechazada |
| `ORDER-CONFIRMED` | Orden confirmada |
| `ORDER-READY-TO-DELIVER` | Lista para entregar |
| `ORDER-DELIVERY-SENT` | Envio iniciado |
| `ORDER-CLOSED` | Orden cerrada |

Solo se reciben webhooks de ordenes creadas via esta API.

## Productos y Categorias (lectura)

La API de integraciones tambien expone:
- `GET /products` — lista productos (schema simplificado vs API principal)
- `GET /product-categories` — lista categorias

Estas devuelven datos en formato plano (no JSON:API), identico al formato de `snapshots/fudo-products.json` y `snapshots/fudo-categories.json`.
