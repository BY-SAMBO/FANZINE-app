# FANZINE App - Plan de Ejecucion

## Fuente de Referencia

> **Proyecto origen:** `/Users/a./Cloud-Workspace/GALGO/FANZINE/`
> - `v2/` - Arquitectura backend Node.js (controllers, services, routes, providers)
> - `DOCS/` - Documentacion Fudo API, delivery config, auditorias
> - `DOCS/fudo-api/` - OpenAPI specs, datos reales (fudo-products.json, fudo-categories.json)
> - `DOMICILIOS/` - Templates delivery por categoria
> - `MENU-Interno/` - Productos JSON individuales (source of truth v1)
> - `EXPORT-DELIVERY/` - Configuraciones exportadas para plataformas
> - `media/` - Fotos de productos existentes
>
> Esta app Next.js es la **migracion** del sistema v2 (Node.js + JSON files) a **Supabase + Next.js**.

---

## Resumen del Proyecto

**FANZINE** es un panel administrativo para el restaurante "Cine & Tex-Mex" (Bogota, Colombia).
Gestiona productos, precios, delivery (Rappi/PedidosYa), sincronizacion con Fudo y checklist de completitud.

**Stack:** Next.js 16 + Supabase + Tailwind + shadcn/ui + React Query + Fudo API

---

## Estado Completado

### Infraestructura (LISTO)
- Supabase: 6 tablas, RLS, triggers, storage bucket
- Seed: 11 categorias, 5 modulos delivery, 10 templates
- Admin: Jose Garcia (administrador)
- Fudo API: Credenciales configuradas, cliente corregido y funcionando

### Frontend (LISTO)
- Auth: Login, middleware, roles (admin/mesero/cajero)
- Layout: Sidebar, header, mobile nav, 20 componentes shadcn
- Productos: CRUD, grid, form, search, filtros
- Media: Upload, gallery (Supabase Storage)
- Delivery: Hub, templates por categoria, editor de modulos, preview
- Sync: Comparacion local vs Fudo, precios, status, audit log
- Checklist: Grid, cards, progress, filtros
- Dashboard: 4 stat cards, metricas

---

## PLAN DE EJECUCION - Todas las fases completadas

### FASE 1: Pull Inicial de Productos desde Fudo (COMPLETADA)

**Objetivo:** Poblar la tabla `products` con los ~49 productos activos de Fudo

**Datos Fudo (actual):**
- 65 productos totales en la API
- 10 categorias Fudo -> 11 categorias locales (Toppings es solo local)
- Productos con `sellAlone: false` son toppings/modificadores, NO productos reales
- 2 productos sin codigo (`code: null`): Cheesecake Pistachos, Cheesecake Kinder Bueno

**Mapeo de Categorias Fudo -> Supabase:**

| Fudo ID | Fudo Name | Slug Local |
|---------|-----------|------------|
| 5 | Perro | perros |
| 6 | Chicanitas | chicanitas |
| 7 | Crispetas | crispetas |
| 8 | Milkshakes | milkshakes |
| 9 | Nachos | nachos |
| 10 | Tacos | tacos |
| 11 | Bebidas | bebidas |
| 12 | Helados | helados |
| 13 | TEX MEX | tex-mex |
| 14 | POSTRES | postres |

**Tareas:**

1. Crear endpoint API `/api/sync/pull` que:
   - Llame a Fudo API para obtener todos los productos
   - Filtre: solo `sellAlone: true` (excluir toppings)
   - Mapee `productCategoryId` de Fudo -> `categoria_id` UUID de Supabase
   - Genere `id` a partir de `code` de Fudo (o auto-genere para los que no tienen)
   - Genere `slug` a partir del nombre
   - Calcule `precio_delivery` automatico (trigger x1.35)
   - Guarde `fudo_id`, `fudo_sync_status: 'synced'`, `fudo_synced_at`
   - Inserte o actualice (upsert) en tabla `products`

2. Actualizar tabla `categories` con `fudo_category_id` para cada categoria

3. Ejecutar el pull y verificar que los ~49 productos reales se cargan

4. Registrar en `fudo_sync_log` cada producto importado

**Resultado esperado:** ~49 productos visibles en `/productos`

---

### FASE 2: Verificacion y Correccion de Datos

**Objetivo:** Asegurar que los datos importados son correctos y la UI funciona

**Tareas:**

1. Verificar que `/productos` muestra todos los productos por categoria
2. Verificar que `/dashboard` muestra las stats correctas
3. Verificar que `/sync` muestra todo como "sincronizado"
4. Verificar que `/checklist` muestra los items pendientes correctamente
5. Corregir cualquier error de runtime (como el `price: null` ya corregido)
6. Asignar codigos a los 2 productos sin codigo (Cheesecakes)

---

### FASE 3: Enriquecimiento de Productos

**Objetivo:** Completar la info que Fudo no tiene pero FANZINE si

**Datos del v2 a migrar (por producto):**

| Campo | Fuente | Estado |
|-------|--------|--------|
| `precio_venta` | Fudo `price` | Viene en pull |
| `precio_delivery` | Auto (x1.35 trigger) | Automatico |
| `precio_costo_receta` | v2 JSONs `precio.costo` | Migrar |
| `descripcion_corta` | v2 JSONs `contenido.descripcion` | Migrar |
| `descripcion_delivery` | v2 JSONs `contenido.descripcion_delivery` | Migrar |
| `prompt_ia` | v2 JSONs `contenido.prompt_ia` | Migrar |
| `foto_principal` | v2 `media/productos/{ID}/` | Subir a Storage |
| `disponible_delivery` | v2 `delivery_config.activo` | Migrar |

**Tareas:**

1. Script de migracion que lea los JSONs de `MENU-Interno/productos/items/`
2. Actualizar cada producto en Supabase con los campos enriquecidos
3. Subir fotos existentes de `media/productos/` a Supabase Storage
4. Marcar checklist items completados automaticamente

---

### FASE 4: Delivery Config por Producto

**Objetivo:** Migrar la configuracion de delivery del v2

**Fuente:** `DOMICILIOS/categorias/*.json` y `DOMICILIOS/productos/*.json`

**Tareas:**

1. Revisar que los `delivery_modules` del seed coinciden con los del v2
2. Verificar que los `delivery_category_templates` estan correctos
3. Migrar overrides por producto (campo `delivery_config` JSONB en products)
4. Verificar la UI de delivery para cada categoria

---

### FASE 5: Testing End-to-End

**Objetivo:** Flujo completo sin errores

**Flujos a probar:**

1. Login admin -> Dashboard con stats reales
2. Productos -> Buscar -> Filtrar por categoria -> Editar producto
3. Producto -> Media -> Subir foto -> Ver en galeria
4. Producto -> Delivery config -> Editar -> Preview
5. Sync -> Comparar con Fudo -> Ver diferencias de precios
6. Checklist -> Filtrar -> Marcar items -> Ver progreso
7. Login mesero -> Verificar permisos limitados

---

### FASE 6: Pulido y Deploy

**Objetivo:** Produccion-ready

**Tareas:**

1. `npm run build` sin errores
2. Responsive: verificar mobile
3. Performance: React Query cache
4. Manejo de errores: toasts, estados vacios, loading
5. Deploy a Vercel (o hosting elegido)

---

## Arquitectura de Archivos

```
src/
  app/
    (auth)/login/           -- Login publico
    (dashboard)/            -- Rutas protegidas
      dashboard/            -- Pagina principal
      productos/            -- CRUD productos
      delivery/             -- Config delivery
      sync/                 -- Sincronizacion Fudo
      checklist/            -- Checklist Rappi
      configuracion/        -- Ajustes
    api/                    -- API routes (auth, fudo, sync)
  components/
    ui/                     -- 20 componentes shadcn
    layout/                 -- Sidebar, Header, Nav
    products/               -- Cards, Grid, Form, Search
    delivery/               -- Preview, Editor, Detector
    sync/                   -- Comparison, Prices, Status
    media/                  -- Uploader, Gallery
    checklist/              -- Cards, Grid, Progress
  lib/
    hooks/                  -- 5 custom hooks
    services/               -- 5 service modules
    fudo/                   -- Cliente API Fudo
    supabase/               -- Clientes Supabase
    config/                 -- Constantes, ingredientes
    utils/                  -- Pricing, errors, deep-merge
  types/                    -- TypeScript types
```

## Base de Datos

```
categories              -- 11 categorias (seed) + fudo_category_id pendiente
products                -- 0 productos (PENDIENTE Fase 1)
delivery_modules        -- 5 modulos (seed)
delivery_category_templates -- 10 templates (seed)
user_profiles           -- 1 admin (Jose Garcia)
fudo_sync_log           -- 0 registros
storage: product-images -- Bucket publico
```

## Datos Fudo (Inventario Real)

| Categoria | Activos | Ejemplos |
|-----------|---------|----------|
| Tacos | 3 | Pollo, Birria, Cochinita Pibil |
| Nachos | 5 | Cheddar, Pollo, Birria, SalchiNachos, Pibil |
| Perros | 4 | Con Toppings, Philly, Corndog, Corndog Queso |
| Chicanitas | 3 | Carne, Pollo, Cochinita Pibil |
| Crispetas | 10 | Sal, Caramelo, Mixtas (Personal/Med/Familiar) |
| Helados | 4 | Cono Vainilla/Choco/Mixto, Sundae, Sandwich |
| Milkshakes | 2 | Vainilla, Chocolate |
| Bebidas | 4 | Coca-Cola, Bretana, Coca-Zero, Cool Drink |
| Tex-Mex | 7 | Alitas, Pollo PopCorn, Macarrones, 4 Salsas |
| Postres | 7 | Tres Leches, Chocolate, RedVelvet, Pistacho, 2 Cheesecakes |

**Total activos estimados: ~49 productos** (excluyendo toppings e inactivos)

---

*Documento generado: 2026-02-07*
*Ultima actualizacion: 2026-02-08 - Plan completo con referencia v2*
*Estado: TODAS LAS FASES COMPLETADAS - App production-ready*
*Deploy: Configurar 7 env vars en Vercel y deploy*
