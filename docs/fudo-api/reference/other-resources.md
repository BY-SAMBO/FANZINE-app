# Otros Recursos (API Principal)

Recursos secundarios que FANZINE no usa activamente pero estan disponibles.

---

## Rooms `/rooms`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/rooms` | Listar salas |
| GET | `/rooms/{id}` | Obtener sala |
| POST | `/rooms` | Crear sala |
| PATCH | `/rooms/{id}` | Actualizar sala |

**Include:** `tables`
**Attributes:** `name` (1-45 chars)

---

## Tables `/tables`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/tables` | Listar mesas |
| GET | `/tables/{id}` | Obtener mesa |
| POST | `/tables` | Crear mesa |

**Sort:** `id`, `-id`, `number`, `-number`
**Include:** `room`, `activeSales`, `activeSales.items`, `activeSales.payments`, etc.
**Attributes:** `column`, `number`, `row`, `shape` ("0"=rect, "1"=round), `size` ("s"|"l")
**Relationships:** `room` (required en POST)

---

## Users `/users`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/users` | Listar usuarios |
| GET | `/users/{id}` | Obtener usuario |
| POST | `/users` | Crear usuario |

**Include:** `role`
**Attributes:** `active`, `admin`, `email`, `name`, `promotionalCode` (read-only)
**POST required:** `email`, `name`, `password` (5-90 chars), relationship `role`

---

## Roles `/roles`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/roles` | Listar roles |
| GET | `/roles/{id}` | Obtener rol |
| POST | `/roles` | Crear rol |
| PATCH | `/roles/{id}` | Actualizar rol |

**Attributes:** `isWaiter`, `isDeliveryman`, `name`, `permissions[]`

---

## Kitchens `/kitchens`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/kitchens` | Listar cocinas |
| GET | `/kitchens/{id}` | Obtener cocina |
| POST | `/kitchens` | Crear cocina |
| PATCH | `/kitchens/{id}` | Actualizar cocina |

**Attributes:** `name` (1-255 chars)

---

## Ingredients `/ingredients`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/ingredients` | Listar ingredientes (solo lectura) |

**Attributes:** `name`, `cost`, `stock`, `stockControl`
**Relationships:** `ingredientCategory`

---

## Discounts `/discounts`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/discounts` | Listar descuentos |
| GET | `/discounts/{id}` | Obtener descuento |
| POST | `/discounts` | Crear descuento (por amount O percentage) |
| PATCH | `/discounts/{id}` | Cancelar descuento (`canceled: true`) |

**Relationships:** `sale` (required en POST)

---

## Expenses `/expenses`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/expenses` | Listar gastos |
| GET | `/expenses/{id}` | Obtener gasto |
| POST | `/expenses` | Crear gasto |

**POST required:** `amount` (0-99999999.99), `date` (YYYY-MM-DD)

---

## Expense Categories `/expense-categories`

| Metodo | Path | Descripcion |
|--------|------|-------------|
| GET | `/expense-categories` | Listar categorias |
| POST | `/expense-categories` | Crear categoria |
| PATCH | `/expense-categories/{id}` | Actualizar |

---

## Referencia de tipos JSON:API

Todos los tipos usan PascalCase singular:

| Recurso | type |
|---------|------|
| Customer | `"Customer"` |
| Discount | `"Discount"` |
| Expense | `"Expense"` |
| ExpenseCategory | `"ExpenseCategory"` |
| Item | `"Item"` |
| Kitchen | `"Kitchen"` |
| Payment | `"Payment"` |
| PaymentMethod | `"PaymentMethod"` |
| Product | `"Product"` |
| ProductCategory | `"ProductCategory"` |
| ProductModifier | `"ProductModifier"` |
| ProductModifiersGroup | `"ProductModifiersGroup"` |
| Role | `"Role"` |
| Room | `"Room"` |
| Sale | `"Sale"` |
| Subitem | `"Subitem"` |
| Table | `"Table"` |
| User | `"User"` |
