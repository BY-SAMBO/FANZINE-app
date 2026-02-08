# Fudo API - Documentación para FANZINE

**Versión API:** v1alpha1
**Fecha de análisis:** 2025-12-06
**Especificación completa:** `openapi.yml` (10,606 líneas)

---

## Autenticación

### Obtener credenciales
Email a **soporte@fu.do** indicando:
- Nombre de la cuenta en Fudo
- Usuario al que dar acceso API

**Recomendación:** Crear usuario específico para API (ej: `api@fanzine`)

### Obtener token

```bash
# Producción
curl -X POST https://auth.fu.do/api \
     -d '{"apiKey":"TU_API_KEY","apiSecret":"TU_API_SECRET"}' \
     -H "Content-Type: application/json"

# Staging (pruebas)
curl -X POST https://auth.staging.fu.do/api \
     -d '{"apiKey":"TU_API_KEY","apiSecret":"TU_API_SECRET"}' \
     -H "Content-Type: application/json"
```

**Respuesta:**
```json
{"token":"1234567890", "exp": "1645387452"}
```

### Usar token
```bash
curl https://api.fu.do/v1alpha1/products \
     -H "Authorization: Bearer TU_TOKEN"
```

**Duración del token:** 24 horas

---

## Servidores

| Ambiente | URL Base |
|----------|----------|
| Producción | `https://api.fu.do/v1alpha1` |
| Staging | `https://api.staging.fu.do/v1alpha1` |

---

## Endpoints Disponibles

### Productos (relevante para FANZINE)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products` | Listar productos |
| POST | `/products` | Crear producto |
| GET | `/products/{id}` | Obtener producto |
| PATCH | `/products/{id}` | Actualizar producto |

### Categorías de Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/product-categories` | Listar categorías |
| POST | `/product-categories` | Crear categoría |
| GET | `/product-categories/{id}` | Obtener categoría |
| PATCH | `/product-categories/{id}` | Actualizar categoría |

### Modificadores de Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/product-modifiers` | Listar modificadores |
| POST | `/product-modifiers` | Crear modificador |
| GET | `/product-modifiers/{id}` | Obtener modificador |
| PATCH | `/product-modifiers/{id}` | Actualizar modificador |

### Ventas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sales` | Listar ventas |
| POST | `/sales` | Crear venta |
| GET | `/sales/{id}` | Obtener venta |
| PATCH | `/sales/{id}` | Actualizar venta |

### Items (líneas de venta)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/items` | Listar items |
| POST | `/items` | Crear item |
| GET | `/items/{id}` | Obtener item |
| PATCH | `/items/{id}` | Actualizar item |

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/customers` | Listar clientes |
| POST | `/customers` | Crear cliente |
| GET | `/customers/{id}` | Obtener cliente |
| PATCH | `/customers/{id}` | Actualizar cliente |
| DELETE | `/customers/{id}` | Eliminar cliente |

### Otros Endpoints

- `/ingredients` - Ingredientes
- `/kitchens` - Cocinas/KDS
- `/payments` - Pagos
- `/payment-methods` - Métodos de pago
- `/discounts` - Descuentos
- `/expenses` - Gastos
- `/expense-categories` - Categorías de gastos
- `/rooms` - Salas/Sectores
- `/tables` - Mesas
- `/users` - Usuarios
- `/roles` - Roles

---

## Paginación

```
?page[size]=500&page[number]=1
```

- **Tamaño por defecto:** 250
- **Tamaño máximo:** 500
- **Página por defecto:** 1

Para obtener todos los items, hacer requests hasta que la cantidad recibida sea menor al tamaño de página.

---

## Filtros (ejemplo customers)

```
?filter[active]=eq.true
?filter[salesCount]=gte.5
?filter[lastSaleDate]=and(gte.2020-05-11T23:15:00Z,lte.2020-12-31T23:59:59Z)
?filter[@all]=fts.texto_busqueda
```

---

## Mapeo FANZINE → Fudo

| FANZINE (JSON) | Fudo API |
|----------------|----------|
| `id` | N/A (Fudo genera su propio ID) |
| `nombre` | `attributes.name` |
| `categoria` | `relationships.productCategory` |
| `precio.venta` | `attributes.price` |
| `estado.activo` | `attributes.active` |
| `contenido.descripcion_corta` | `attributes.description` |

---

## Próximos Pasos

1. [ ] Solicitar credenciales API a soporte@fu.do
2. [ ] Probar autenticación en staging
3. [ ] Obtener lista de productos actuales de Fudo
4. [ ] Diseñar mapeo completo FANZINE ↔ Fudo
5. [ ] Implementar sincronización bidireccional

---

## Archivos

- `openapi.yml` - Especificación OpenAPI completa (10,606 líneas)
- `README.md` - Este archivo
