# Resumen: Rediseno comunicacion de ingredientes y toppings — Carta C3

## Que hicimos

### 1. Recetas C3 (HTML lab)
Actualizamos las 3 recetas de perros calientes en `public/hotdogs/` para reflejar el sistema Punch real de la carta:

- **c3-fanzine-gold.html** (BBQ Bacon): Cambio de garnish fijo a Punch Elige 1 (Pepinillos rec, Jalapenos, Pina)
- **c3-tropical-fuego.html**: Punch Elige 1 (Takis Fuego rec, Jalapenos, Cebolla Encurtida). Takis va doble capa (base + corona), los otros toppings solo arriba. Pina fresca es garnish final fijo.
- **c3-birria.html**: Se agrego Cilantro fresco como garnish final fijo (nuevo). Punch Elige 1 (Cebolla Encurtida rec, Pina, Jalapenos). Se reordeno para que el fresco quede visible encima de la birria.

Tambien se actualizaron los registros en Supabase (`lab_recipe_notes`).

### 2. Estrategia de comunicacion — Variaciones
Creamos `public/hotdogs/carta-v31-2.html` con variaciones visuales para decidir como comunicar ingredientes y toppings en la carta:

**Hot Dogs (Variaciones A-E):**
- A: Minimo cambio, solo corregir ingredientes
- B: Ingredientes en orden de construccion, Punch inline
- C: Solo 2-3 ingredientes de identidad, Punch ultra-discreto
- D: Dos niveles (hero + detalle), Punch liviano
- **E (elegida):** Ingredientes directos en negro + `+ 1 topping` en rojo al final. Punch con starburst intacto.

**Nachos/Tacos/Papas (Variaciones F-H):**
- F: Tabla unificada sabor x formato
- G: Sabores como filas, formatos como pills
- **H (elegida):** Bloques separados por categoria (Nachos, Tacos, Papas Cargadas), cada uno con header negro propio, ingredientes (Guacamole, SourCream, Pico de Gallo, Cheddar) + `+ 3 toppings` en amarillo, sabores en fila horizontal (estilo v30). Punch compartido una sola vez. Papas Francesas aparte.

### 3. Cambios aplicados a carta-v30.html y carta-v31.html

**pname-sub de cada perro actualizado:**

| Perro | Nuevo pname-sub |
|---|---|
| Zinema | Arma tu perro · Papas crocantes · SourCream · Salsa lena · **+ 3 toppings** |
| BBQ Bacon | Tocineta · Queso crema · BBQ Gold · Cebolla crispy · **+ 1 topping** |
| Tropical Fuego | Tocineta · Salsa pina · SourCream · Pina fresca · **+ 1 topping** |
| Birria Fusion | Res birria · Cheddar fundido · Papas angel · Cilantro fresco · **+ 1 topping** |

**Reglas aplicadas:**
- Todo el texto de ingredientes en negro
- Solo el `+ X topping(s)` va en rojo
- El starburst Punch se mantiene como indicador visual de la dinamica de elegir
- Se agrego CSS `.plus-topping { font-weight: 800; color: var(--red); }` en ambas cartas

**Correcciones de ingredientes:**
- Tropical: "Trozos de pina dulce" → "Pina fresca", se agrego Tocineta al inicio
- Birria: SourCream sale, entra Cilantro fresco (nuevo ingrediente C3)
- BBQ Bacon: Tocineta pasa al inicio (es la proteina principal)
- Salsa pina-habanero → Salsa pina (la habanero aun no esta lista)

### 4. Pendiente: Salsa Lena
Se quiere mejorar para que sea salsa de la casa. No se toco en esta sesion.

## Archivos modificados
- `public/hotdogs/c3-fanzine-gold.html`
- `public/hotdogs/c3-tropical-fuego.html`
- `public/hotdogs/c3-birria.html`
- `public/hotdogs/carta-v30.html`
- `public/hotdogs/carta-v31.html`
- `public/hotdogs/carta-v31-2.html` (nuevo — variaciones)
- `docs/carta-comunicacion-variaciones.md` (nuevo — documento de variaciones)
- Supabase: `lab_recipe_notes` (c3-fanzine-gold, c3-birria)
