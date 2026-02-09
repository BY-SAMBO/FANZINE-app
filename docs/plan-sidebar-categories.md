# Plan: POS Caja Sidebar Categories

Referencia: `prototipos/pos-caja-sidebar/caja.html`

---

## Resumen de cambios

El prototipo aprobado cambia la pantalla POS Caja de un layout oscuro con categorias horizontales a un layout claro con sidebar vertical izquierdo. Los cambios son puramente esteticos/de layout; la logica de negocio (Zustand, Realtime, Fudo API) permanece intacta.

### Estructura actual vs prototipo

| Aspecto | Actual | Prototipo |
|---|---|---|
| Layout principal | `flex h-full bg-[#1a1117]` (dark) | `flex h-screen bg-cream` (light) |
| Categorias | Barra horizontal scroll (top) | Sidebar vertical `w-48` (left) |
| Product grid | Centro, dark cards | Centro con search bar, white cards |
| Order panel | Derecha, dark theme | Derecha, white theme |
| Tipografia numeros | DM Sans / DM Mono | JetBrains Mono bold |
| Border radius | 0 (brutal) / rounded-lg | rounded-xl / rounded-lg |

---

## 1. `src/app/(pos)/layout.tsx`

### Agregar fuente JetBrains Mono

**Actual:** Importa Playfair_Display, DM_Sans, DM_Mono.
**Cambio:** Agregar JetBrains_Mono de `next/font/google`.

```
Agregar:
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jetbrains-mono",
});
```

Agregar `${jetbrainsMono.variable}` al className del `<div>` wrapper.

### Agregar peso extrabold a DM_Sans

**Actual:** DM_Sans weights: `["400", "500", "600", "700"]`
**Cambio:** Agregar `"800"` al array de weights.

---

## 2. `src/app/globals.css`

### Agregar utilidad `.mono` para JetBrains Mono

Agregar despues de los POS color tokens:

```css
/* POS sidebar-categories utilities */
.mono { font-family: var(--font-jetbrains-mono), monospace; font-weight: 700; }
```

### Agregar color `cream` a tokens

Ya existe `--pos-surface: #f7f5f2` que equivale al `cream` del prototipo. No se necesitan nuevos tokens pero verificar que el theme de Tailwind tenga acceso. Opcionalmente agregar:

```css
--pos-cream: #f7f5f2;
--pos-sand: #eae6e0;
```

### Agregar transition para product cards

```css
.product-card { transition: all 0.15s ease; }
.product-card:active { transform: scale(0.95); }
```

### Agregar scrollbar-hide si no existe

```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## 3. `src/components/pos/caja/category-bar.tsx` -> Renombrar a `category-sidebar.tsx`

**Cambio completo de componente.** Pasa de barra horizontal a sidebar vertical.

### Props

```ts
interface CategorySidebarProps {
  categories: { id: string; nombre: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  productCounts?: Record<string, number>;  // NUEVO: conteo por categoria
  totalCount?: number;                      // NUEVO: total productos
  onSync: () => void;                       // NUEVO: boton "Iniciar POS"
  isSyncing: boolean;                       // NUEVO: estado sync
}
```

### Estructura

```
<aside class="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col">
  <!-- Logo -->
  <div px-4 py-4 border-b>
    <p mono text-[10px] uppercase tracking-[0.2em] text-red>POS</p>
    <p text-lg font-extrabold>FANZINE</p>
  </div>

  <!-- Categories nav (flex-1 overflow-y-auto scrollbar-hide py-2) -->
  <nav>
    <!-- "Todos" button + count badge -->
    <!-- Mapped category buttons + count badges -->
  </nav>

  <!-- Sync button (p-3 border-t) -->
  <div>
    <button "Iniciar POS" border-2 border-red text-red hover:bg-red hover:text-white rounded-lg>
  </div>
</aside>
```

### Diferencias clave vs actual

| Aspecto | Actual | Prototipo |
|---|---|---|
| Orientacion | Horizontal scroll `flex gap-2 overflow-x-auto` | Vertical `flex flex-col overflow-y-auto` |
| Background | Transparente (sobre dark) | `bg-white border-r border-gray-200` |
| Boton activo | `bg-[#DC2626] text-white border-white` | `bg-[#DC2626] text-white` (class `.cat-item.active`) |
| Boton inactivo | `bg-white/5 text-white/60 border-white/10` | `text-gray-500 hover:bg-gray-50 hover:text-gray-900` |
| Count badges | No existen | `mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full` |
| Cada boton | `shrink-0 px-4 py-2` (pill) | `w-full px-4 py-3 rounded-r-lg mr-2` (full-width row) |
| Texto | `text-sm font-bold uppercase tracking-wider` | `text-sm font-extrabold truncate` (NO uppercase) |
| Logo | No existe | POS / FANZINE en header |
| Boton sync | Esta fuera del componente, en CajaPage | Integrado al pie del sidebar |

### Conteo de productos por categoria

Se necesita calcular `productCounts` en `CajaPage` y pasarlo como prop. Es un simple reduce sobre el array de products:

```ts
const productCounts = useMemo(() => {
  if (!products) return {};
  return products.reduce((acc, p) => {
    const catId = p.categoria_id || "uncategorized";
    acc[catId] = (acc[catId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}, [products]);
```

---

## 4. `src/app/(pos)/pos/caja/page.tsx`

### Cambio de layout general

**Actual:**
```tsx
<div className="flex h-full bg-[#1a1117]">
  <div className="flex flex-1 flex-col gap-3 p-4 overflow-hidden">
    <!-- header: CategoryBar + sync button -->
    <!-- ProductGrid -->
    <!-- ToppingPanel -->
  </div>
  <div className="w-80 shrink-0">
    <OrderPanel />
  </div>
</div>
```

**Prototipo:**
```tsx
<div className="flex h-full bg-[#f7f5f2] text-gray-900">
  <!-- LEFT: CategorySidebar (w-48) -->
  <CategorySidebar ... />

  <!-- CENTER: main (flex-1) -->
  <main className="flex-1 flex flex-col overflow-hidden">
    <!-- Search bar (NUEVO) -->
    <!-- ProductGrid -->
    <!-- ToppingPanel -->
  </main>

  <!-- RIGHT: OrderPanel (w-80) -->
  <OrderPanel />
</div>
```

### Cambios especificos

1. **Fondo:** `bg-[#1a1117]` -> `bg-[#f7f5f2] text-gray-900`
2. **Loading state:** `bg-[#1a1117] text-white/50` -> `bg-[#f7f5f2] text-gray-400`
3. **Eliminar header row** (`<div className="flex items-center gap-2">`) que contenia CategoryBar + sync button. Esos elementos se mudan al sidebar.
4. **Agregar search bar** antes del grid (ver seccion 5).
5. **Mover sync button** al sidebar (integrado en CategorySidebar).
6. **CategoryBar** -> `CategorySidebar` (import cambio).
7. **Calcular productCounts** y pasarlo como prop (ver seccion 3).

---

## 5. Nueva funcionalidad: Barra de busqueda

### Agregar search state en `CajaPage`

```ts
const [searchQuery, setSearchQuery] = useState("");
```

### Filtrar productos con busqueda

Agregar al `filteredProducts` memo:

```ts
const filteredProducts = useMemo(() => {
  if (!products) return [];
  let result = products;
  if (selectedCategory) {
    result = result.filter((p) => p.categoria_id === selectedCategory);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((p) => p.nombre.toLowerCase().includes(q));
  }
  return result;
}, [products, selectedCategory, searchQuery]);
```

### JSX de la barra

Colocar justo antes del grid, dentro de `<main>`:

```tsx
<div className="px-4 pt-4 pb-2">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      placeholder="Buscar producto..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20"
    />
  </div>
</div>
```

Importar `Search` de lucide-react.

---

## 6. `src/components/pos/caja/product-grid.tsx`

### Empty state

**Actual:** `text-white/40` sobre fondo dark.
**Cambio:** `text-gray-400` sobre fondo cream.

```tsx
// Actual
<div className="flex items-center justify-center h-40 text-white/40 text-sm">

// Nuevo
<div className="flex items-center justify-center h-40 text-gray-400 text-sm">
```

### Grid columns

**Actual:** `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
**Prototipo:** `grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`

El prototipo usa cards mas grandes con menos columnas. Cambiar a:

```tsx
<div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
```

---

## 7. `src/components/pos/caja/product-button.tsx`

**Cambio completo de estilo.** Este es el componente con mas diferencias visuales.

### Actual vs Prototipo

| Aspecto | Actual | Prototipo |
|---|---|---|
| Fondo | `bg-white/5` (translucent dark) | `bg-white` (solid white) |
| Borde | `border-2 border-white/10` | `border border-gray-200` |
| Hover | `hover:border-white/30 hover:bg-white/10` | `hover:border-red/40 hover:shadow-md` |
| Active | `active:scale-95` | `active:scale(0.95)` via `.product-card` CSS |
| min-height | `min-h-[90px]` | `min-h-[110px]` |
| Padding | `p-3` | `p-4` |
| Border radius | `rounded-lg` | `rounded-xl` |
| Nombre | `text-sm font-bold text-white` | `text-base font-extrabold text-gray-900 leading-tight` |
| Precio position | Bottom-left, inline con badge | Bottom-left, standalone |
| Precio estilo | `text-white/70 text-sm font-medium` | `mono text-red font-bold text-xl` (JetBrains Mono, rojo, grande) |
| Badge modifiers | `bg-[#FDE047] text-black` bottom-right | `bg-amber-100 text-amber-700` top-right absolute |
| Badge texto | "Mod" | "+Mod" |

### Nuevo JSX

```tsx
<button
  type="button"
  onClick={() => onSelect(product)}
  className="product-card flex flex-col items-start p-4 rounded-xl border border-gray-200 bg-white hover:border-red-600/40 hover:shadow-md min-h-[110px] text-left relative"
>
  {product.has_modifiers && (
    <span className="absolute top-2 right-2 text-[9px] mono font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
      +Mod
    </span>
  )}
  <span className="text-base font-extrabold text-gray-900 leading-tight line-clamp-2">
    {product.nombre}
  </span>
  <span className="mt-auto mono text-red-600 font-bold text-xl">
    ${(product.precio_venta ?? 0).toLocaleString()}
  </span>
</button>
```

---

## 8. `src/components/pos/caja/order-panel.tsx`

### Cambios de tema

| Aspecto | Actual | Prototipo |
|---|---|---|
| Background | `bg-[#1a1117]` | `bg-white` |
| Border izquierdo | `border-l-2 border-white/10` | `border-l border-gray-200` |
| Header border | `border-b border-white/10` | `border-b border-gray-200` |
| Header texto | `text-[#DC2626]` | `mono text-[11px] font-bold uppercase tracking-[0.2em] text-red-600` |
| Empty state | `text-white/20` | `text-gray-300` |
| Footer border | `border-t-2 border-white/10` | `border-t border-gray-200` |
| Total label | `text-lg font-bold text-white` | `text-xl font-extrabold text-gray-900` |
| Total valor | `text-lg font-bold text-white` | `mono text-3xl font-extrabold text-gray-900` |
| Btn Limpiar | `border-white/20 text-white/60` | `border-2 border-gray-200 text-gray-500 rounded-lg` |
| Btn Cobrar | `bg-[#DC2626] border-white` | `bg-red-600 border-2 border-red-600 text-white rounded-lg` |
| Items count | No existe | `5 items / 3 productos` line above total |

### Agregar historial button al header

El prototipo tiene un boton de reloj (historial) en el header del order panel, a la derecha. Para una primera iteracion se puede agregar el icono sin funcionalidad, o conectarlo al historial si se implementa en Task #2.

### Agregar conteo de items

Antes del total, agregar:

```tsx
<div className="flex justify-between text-gray-400 text-xs">
  <span>{totalItems} items</span>
  <span className="mono">{order.items.length} productos</span>
</div>
```

Donde `totalItems = order.items.reduce((s, i) => s + i.quantity, 0)`.

### Botones: agregar rounded-lg

Ambos botones (Limpiar, Cobrar) cambian de `border-2 border-white/20` a `border-2 border-gray-200 ... rounded-lg`.

---

## 9. `src/components/pos/caja/order-item-row.tsx`

### Cambios de tema

| Aspecto | Actual | Prototipo |
|---|---|---|
| Border bottom | `border-white/10` | `border-gray-100` |
| Nombre | `text-sm font-bold text-white` | `text-sm font-extrabold text-gray-900 truncate` |
| Modifiers texto | `text-xs text-white/50` | `text-xs font-medium text-gray-400` |
| Btn +/- bg | `bg-white/5 hover:bg-white/10` | `bg-gray-100 hover:bg-gray-200 rounded-lg` |
| Btn +/- text | `text-white/50 hover:text-white` | `text-gray-500 hover:text-gray-900` |
| Btn +/- size | `w-6 h-6 rounded` | `w-7 h-7 rounded-lg` |
| Quantity | `text-white text-sm font-bold` | `mono text-sm font-extrabold text-gray-900` |
| Line total | `text-white text-sm font-medium w-16` | `mono text-sm font-bold text-gray-800 w-20` |
| Btn remove | `text-white/30 hover:text-red-400` | `text-gray-300 hover:text-red-600` |

### Layout

El layout flex horizontal se mantiene igual, solo cambian colores y algunos tamanos.

---

## 10. `src/components/pos/caja/topping-panel.tsx`

### Cambios de tema

| Aspecto | Actual | Prototipo |
|---|---|---|
| Background | `bg-[#1a1117]/95` | `bg-white/95 border-t border-gray-200` |
| Border top | `border-t-2 border-[#DC2626]` | `border-t-2 border-red-600` (mantener) |
| Title | `text-white` | `text-gray-900` |
| Group label | `text-white/40` | `text-gray-400` |
| Max count | `text-white/30` o `text-[#DC2626]` | `text-gray-300` o `text-red-600` |
| Btn Cancelar | `border-white/20 text-white/60` | `border-gray-200 text-gray-500 rounded-lg` |
| Btn Listo | `bg-[#DC2626] border-white text-white` | `bg-red-600 border-red-600 text-white rounded-lg` |

### ToppingChip variant

El topping-chip ya tiene variant "dark" y "light". Cambiar a usar `variant="light"` en lugar de `variant="dark"`. El variant light ya existe y usa los tokens CSS de POS (`--pos-red`, etc.) que son compatibles con el tema claro.

---

## 11. `src/components/pos/caja/payment-dialog.tsx`

### Cambios de tema

| Aspecto | Actual | Prototipo |
|---|---|---|
| Backdrop | `bg-black/80` | `bg-black/30` (mas transparente) |
| Dialog bg | `bg-[#1a1117] border-2 border-white` | `bg-white border border-gray-200 rounded-xl shadow-2xl` |
| Title | `text-white` | `text-gray-900` |
| Total label | `text-white/50` | `text-gray-400` |
| Total valor | `text-4xl font-bold text-white` | `mono text-4xl font-extrabold text-gray-900` |
| Method label | `text-white/50` | `text-gray-400` |
| Method btn active | `bg-[#DC2626] text-white border-white` | `bg-red-600 text-white border-red-600 rounded-lg` |
| Method btn inactive | `text-white/50 border-white/10` | `text-gray-500 border-gray-200 rounded-lg` |
| Error text | `text-red-400` | `text-red-600` |
| Btn Cancelar | `border-white/20 text-white/60` | `border-2 border-gray-200 text-gray-500 rounded-lg` |
| Btn Confirmar | `bg-[#DC2626] border-white text-white` | `bg-red-600 border-2 border-red-600 text-white rounded-lg` |

---

## 12. Historial de ordenes (slide-over panel)

El prototipo incluye un panel deslizante de historial que se activa desde el icono de reloj en el header del order panel. Esto es funcionalidad nueva que se puede implementar en Task #2 o en una fase posterior. Para esta tarea:

- Agregar el icono de reloj en el header del OrderPanel (placeholder).
- No implementar el panel completo de historial aun.

---

## Resumen de archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `src/app/(pos)/layout.tsx` | Agregar JetBrains Mono font, peso 800 a DM Sans |
| `src/app/globals.css` | Agregar `.mono`, `.product-card`, `.scrollbar-hide` utilities |
| `src/components/pos/caja/category-bar.tsx` | **Reescribir** como `category-sidebar.tsx` (sidebar vertical) |
| `src/app/(pos)/pos/caja/page.tsx` | Layout 3-column, search bar, fondo claro, nuevos imports |
| `src/components/pos/caja/product-grid.tsx` | Colores claros, grid cols adjustment |
| `src/components/pos/caja/product-button.tsx` | **Reescribir** estilo (white cards, red price, +Mod badge) |
| `src/components/pos/caja/order-panel.tsx` | Tema claro completo, item counts, rounded buttons |
| `src/components/pos/caja/order-item-row.tsx` | Tema claro, sizes +1, mono class |
| `src/components/pos/caja/topping-panel.tsx` | Tema claro, variant="light" |
| `src/components/pos/caja/payment-dialog.tsx` | Tema claro, rounded-xl, lighter backdrop |

### Archivos nuevos

| Archivo | Descripcion |
|---|---|
| `src/components/pos/caja/category-sidebar.tsx` | Reemplazo de category-bar.tsx |

### Archivos a eliminar

| Archivo | Razon |
|---|---|
| `src/components/pos/caja/category-bar.tsx` | Reemplazado por category-sidebar.tsx |

---

## Orden de implementacion sugerido

1. `globals.css` - Agregar utilities CSS (.mono, .product-card, .scrollbar-hide)
2. `layout.tsx` - Agregar JetBrains Mono font
3. `category-sidebar.tsx` - Crear componente nuevo
4. `product-button.tsx` - Reestilizar cards
5. `product-grid.tsx` - Ajustar grid y colores
6. `order-item-row.tsx` - Tema claro
7. `order-panel.tsx` - Tema claro + conteos
8. `topping-panel.tsx` - Tema claro
9. `payment-dialog.tsx` - Tema claro
10. `page.tsx` - Integrar todo: layout 3-col, search, imports
11. Eliminar `category-bar.tsx`

---

## Notas importantes

- **Sin cambios de logica**: Zustand store, React Query hooks, Supabase Realtime, y Fudo API calls no cambian.
- **ToppingChip**: Ya tiene variant light; solo cambiar el prop de "dark" a "light" en topping-panel.
- **Responsive**: El prototipo asume pantalla >= 1024px. El sidebar w-48 + order w-80 + grid necesita al menos ~900px. Esto es aceptable para un POS de caja con pantalla dedicada.
- **No cambiar la pantalla cliente** (`/pos/cliente`): Solo se cambia `/pos/caja`.
