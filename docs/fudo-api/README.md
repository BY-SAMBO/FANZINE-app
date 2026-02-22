# Fudo API - Documentacion FANZINE

**Version API:** v1alpha1 (principal) + Integraciones (orders)
**Ultima actualizacion:** 2026-02-19

---

## Estructura

```
docs/fudo-api/
├── README.md                          ← este archivo
├── reference/                         ← docs de consulta rapida por recurso
│   ├── auth.md                        ← autenticacion ambas APIs + paginacion + filtros
│   ├── products.md                    ← CRUD productos + limitaciones PATCH
│   ├── product-categories.md          ← CRUD categorias
│   ├── product-modifiers.md           ← modifiers/toppings
│   ├── sales.md                       ← ventas + flujo POS completo
│   ├── items-subitems.md              ← lineas de venta + toppings
│   ├── payments.md                    ← pagos + metodos de pago
│   ├── orders.md                      ← API integraciones (delivery/pickup)
│   ├── customers.md                   ← clientes + filtros
│   └── other-resources.md             ← rooms, tables, users, roles, kitchens, etc.
├── specs/                             ← specs OpenAPI originales
│   ├── openapi.yml                    (10,606 lineas - API principal completa)
│   └── integrations-openapi.yml       (488 lineas - API integraciones)
└── snapshots/                         ← datos capturados de la API
    ├── fudo-products.json             (69 productos, captura dic 2025)
    └── fudo-categories.json           (10 categorias, captura dic 2025)
```

## Como usar

**Para consulta rapida:** Lee el archivo correspondiente en `reference/`.
**Para spec exacta:** Busca en `specs/openapi.yml` o `specs/integrations-openapi.yml`.
**Para datos de referencia:** Revisa `snapshots/`.

---

## Dos APIs diferentes

| | API Principal | API Integraciones |
|---|---|---|
| **Uso** | CRUD completo de recursos | Crear ordenes delivery/pickup |
| **Base URL** | `api.fu.do/v1alpha1` | `integrations.fu.do/fudo` |
| **Auth URL** | `auth.fu.do/api` | (misma base)/auth |
| **Auth creds** | apiKey + apiSecret | clientId + clientSecret |
| **Auth header** | `Authorization: Bearer` | `Fudo-External-App-Authorization: Bearer` |
| **Formato** | JSON:API (data/attributes/relationships) | JSON plano |
| **Docs** | `reference/*.md` | `reference/orders.md` |

---

## Recursos mas usados por FANZINE

| Recurso | Doc | Usado en |
|---------|-----|----------|
| Products | [products.md](reference/products.md) | Sync, catalogo, POS |
| Product Categories | [product-categories.md](reference/product-categories.md) | Sync, catalogo |
| Product Modifiers | [product-modifiers.md](reference/product-modifiers.md) | POS toppings |
| Sales | [sales.md](reference/sales.md) | POS facturacion |
| Items + Subitems | [items-subitems.md](reference/items-subitems.md) | POS lineas de venta |
| Payments | [payments.md](reference/payments.md) | POS cobro |

---

## Gotchas y bugs conocidos

1. **Auth URL** = `https://auth.fu.do/api` (no `/auth/api`)
2. **`exp`** en auth response es Unix timestamp, NO duracion
3. **Endpoints con hyphen**: `/product-categories`, `/product-modifiers`, `/payment-methods`
4. **`imageUrl` es READ-ONLY** — no se puede subir fotos via PATCH
5. **PATCH Products** solo acepta: `name`, `code`, `description`, `price`, `cost`, `stock`, `stockControl`
6. **Tipos JSON:API** siempre PascalCase singular: `"Product"`, `"ProductCategory"`, etc.
7. **Price puede ser null** en algunos productos — siempre usar `(price ?? 0)`
8. **Pull endpoint** necesita service role client para bypass RLS

---

## Endpoints FANZINE implementados

| Endpoint | Archivo | Descripcion |
|----------|---------|-------------|
| `POST /api/sync/pull` | `src/app/api/sync/pull/route.ts` | Pull masivo desde Fudo |
| `POST /api/sync/enrich` | `src/app/api/sync/enrich/route.ts` | Enriquece con datos v2 |
| `POST /api/pos/sale` | `src/app/api/pos/sale/route.ts` | Orquesta venta completa |
| `POST /api/pos/modifiers/sync` | `src/app/api/pos/modifiers/sync/route.ts` | Sync modifier cache |
