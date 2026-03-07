# Carta v31 — Variaciones de Comunicacion de Ingredientes y Toppings

Documento de trabajo para decidir como comunica la carta los ingredientes de cada perro y el sistema Punch.

---

## Contexto C3

Cada perro tiene:
- **Ingredientes fijos** (lo que viene siempre)
- **Punch** (topping a elegir, 1 o 3 segun el perro)
- **Garnish final** (el ultimo ingrediente visible siempre da color/frescura)
- Salchicha premium + pan artesanal son transversales (ya estan en el tag-explainer)

### Datos reales por perro

| Perro | Ingredientes fijos | Punch (Elige X) | Garnish final |
|---|---|---|---|
| **Zinema** | Papas crocantes, SourCream, Salsa lena | Elige 3 de: Pina, Jalapenos, Cheddar (rec), Pepinillos, Maiz, Cebolla Enc. | Lo que elija el cliente |
| **BBQ Bacon** | Tocineta, Queso crema, BBQ Gold, Cebolla crispy | Elige 1 de: Pepinillos (rec), Jalapenos, Pina | El Punch elegido |
| **Tropical Fuego** | Salsa pina-habanero, SourCream | Elige 1 de: Takis Fuego (rec), Jalapenos, Cebolla Encurtida | Pina fresca (fija, siempre encima) |
| **Birria Fusion** | Res birria, Cheddar fundido, Papas angel, SourCream | Elige 1 de: Cebolla Encurtida (rec), Pina, Jalapenos | Cilantro fresco (fijo, siempre encima) |

---

## VARIACION A — "Ingredientes honestos + Punch inline"

Filosofia: Mostrar los 3-4 ingredientes que definen al perro. El ultimo siempre es el fresco/color. Punch compacto en una linea debajo.

### pname-sub (descripcion bajo el nombre)

| Perro | pname-sub |
|---|---|
| **Zinema** | Arma tu perro · Papas crocantes · SourCream · Salsa lena |
| **BBQ Bacon** | Tocineta · Queso crema · BBQ Gold · **Cebolla crispy** |
| **Tropical Fuego** | Salsa pina-habanero · SourCream · **Pina fresca** |
| **Birria Fusion** | Res birria · Cheddar fundido · Papas angel · **Cilantro fresco** |

### Punch
Se mantiene igual que ahora (caja con pills). Sin cambios.

### Pros
- Minimo cambio visual
- El bold en el ultimo ingrediente senala frescura sin explicarlo
- Birria gana cilantro, Tropical gana "Pina fresca" en vez de "Trozos de pina dulce"

### Contras
- El Punch sigue ocupando mucho espacio visual
- No queda claro que el Punch ES parte del perro (parece add-on)

---

## VARIACION B — "Capas visibles + Punch integrado"

Filosofia: El pname-sub lista las capas en orden de construccion (abajo→arriba). El Punch se integra como la ultima capa con un marcador visual.

### pname-sub

| Perro | pname-sub |
|---|---|
| **Zinema** | Papas crocantes · SourCream · Salsa lena · + Elige 3 toppings |
| **BBQ Bacon** | Queso crema · BBQ Gold · Tocineta · Cebolla crispy · + **Elige 1** |
| **Tropical Fuego** | Salsa pina-habanero · SourCream · + **Elige 1** · Pina fresca |
| **Birria Fusion** | Res birria · Cheddar · Papas angel · + **Elige 1** · Cilantro fresco |

### Punch
Se simplifica: solo los pills (sin la caja ni el starburst repetido). La frase "Elige X" ya esta en el pname-sub.

### Pros
- El cliente lee la construccion como una historia: base → medio → punch → garnish
- Tropical y Birria muestran que el Punch NO es lo ultimo (hay garnish fijo encima)
- Menos ruido visual al quitar el starburst repetido de cada perro

### Contras
- "Elige 1" en el pname-sub puede confundir si no mira las pills
- Rompe la consistencia visual del Punch como bloque separado

---

## VARIACION C — "Identidad + Punch como color final"

Filosofia: El pname-sub solo muestra 2-3 ingredientes de identidad (lo que hace UNICO a ese perro). El Punch se presenta como "el toque final de color" con pills compactos.

### pname-sub (solo identidad)

| Perro | pname-sub |
|---|---|
| **Zinema** | Arma tu perro con 3 toppings + papas crocantes |
| **BBQ Bacon** | Tocineta · BBQ Gold · Queso crema |
| **Tropical Fuego** | Salsa pina-habanero · Pina fresca |
| **Birria Fusion** | Res birria · Cheddar fundido · Cilantro fresco |

### Punch
Los pills aparecen justo debajo del pname-sub, sin caja ni header. Solo:
`+ Pepinillos★ | Jalapenos | Pina`
en tipografia pequena, color gris medio.

### Pros
- Maximo impacto de identidad: cada perro se diferencia al instante
- El Punch no compite visualmente con el nombre
- Mas limpio, mas espacio en la carta
- La regla de frescura se cumple: el pname-sub termina con el ingrediente de color

### Contras
- Se pierden ingredientes como SourCream, Papas angel (el cliente no sabe que vienen)
- El Punch se ve demasiado secundario, puede pasar desapercibido
- Zinema pierde su lista de ingredientes fijos

---

## VARIACION D — "Dos niveles: hero + detalle"

Filosofia: Cada perro tiene una linea hero (lo que seduce) y una linea de detalle (lo que incluye). El Punch se mantiene como bloque pero mas compacto.

### pname-sub hero (primera linea, bold, mas grande)

| Perro | Hero |
|---|---|
| **Zinema** | Arma tu perro · Elige 3 toppings |
| **BBQ Bacon** | Tocineta crujiente · BBQ Gold |
| **Tropical Fuego** | Pina fresca · Salsa pina-habanero |
| **Birria Fusion** | Res birria · Cilantro fresco |

### pname-sub detail (segunda linea, gris, mas pequena)

| Perro | Detalle |
|---|---|
| **Zinema** | con papas crocantes, SourCream y salsa lena |
| **BBQ Bacon** | con queso crema y cebolla crispy |
| **Tropical Fuego** | con SourCream |
| **Birria Fusion** | con cheddar fundido, papas angel y SourCream |

### Punch
Pills compactos sin caja border. Solo una linea:
`Elige 1: Pepinillos★ · Jalapenos · Pina`

### Pros
- Lo que seduce esta arriba y grande. Lo que "tambien viene" esta abajo y discreto
- Cumple la regla de frescura: hero termina con el ingrediente de color
- El Punch es liviano y no compite
- Birria y Tropical muestran su diferenciador inmediato (cilantro, pina)

### Contras
- Dos lineas de texto pueden ocupar mas espacio vertical
- "con queso crema y cebolla crispy" suena generico

---

## Mi recomendacion: VARIACION D

Razones:
1. Resuelve el problema principal: cada perro se diferencia al primer vistazo
2. La regla de frescura se aplica naturalmente (hero termina con color)
3. El Punch no domina la carta — es una opcion, no el protagonista
4. Birria gana cilantro fresco como hero, Tropical gana pina fresca como hero
5. Zinema mantiene su identidad de "arma tu perro"

---

## Decision
[ ] Variacion elegida: ___
[ ] Ajustes solicitados: ___
