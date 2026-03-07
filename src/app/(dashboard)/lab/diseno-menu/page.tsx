"use client";

import Link from "next/link";
import { useState } from "react";

type Era = {
  id: string;
  label: string;
  color: string;
  range: string;
  desc: string;
};

const ERAS: Era[] = [
  {
    id: "conceptual",
    label: "Exploracion Conceptual",
    color: "#6366f1",
    range: "v1 – v3",
    desc: "Busqueda de identidad visual: cine, editorial, grid cards",
  },
  {
    id: "narrativa",
    label: "Narrativa Print",
    color: "#0ea5e9",
    range: "v4",
    desc: "Descripcion como storytelling, optimizacion para impresion",
  },
  {
    id: "pop",
    label: "Pop & Retro",
    color: "#f43f5e",
    range: "v5 – v9",
    desc: "Arcade, editorial suizo, VHS, constructivismo — exploracion maximalista",
  },
  {
    id: "gradiente",
    label: "Gradiente & Cinema",
    color: "#f97316",
    range: "v10 – v12",
    desc: "Degradados, ticket de cine, fondos texturizados",
  },
  {
    id: "comic",
    label: "Comic & Sticker",
    color: "#eab308",
    range: "v13 – v16",
    desc: "Bordes gruesos, speech bubbles, stickers, bubble gum",
  },
  {
    id: "completo",
    label: "Menu Completo",
    color: "#22c55e",
    range: "v17 – v17c",
    desc: "Expansion a carta completa: masonry, film strip, A3 poster",
  },
  {
    id: "lateral",
    label: "Layout Lateral",
    color: "#14b8a6",
    range: "v18 – v22, v27 – v30",
    desc: "Grid 3-col con fotos laterales, punch gamificado, desarrollo de menu completo",
  },
  {
    id: "estilos",
    label: "Estilos Alternativos",
    color: "#a855f7",
    range: "v23 – v26",
    desc: "Exploraciones esteticas derivadas — no desarrollo de menu (heladeria, highway, vintage, cards)",
  },
  {
    id: "c3digital",
    label: "C3 & Digital",
    color: "#f43f5e",
    range: "v31 – v35",
    desc: "Sistema C3 final: ingredientes corregidos, pname-sub + plus-topping rojo, combo pricing, imagenes AI-gen, variantes de comunicacion",
  },
];

type Prototype = {
  version: string;
  label: string;
  desc: string;
  era: string;
  intent: string;
  changes: string;
  layout: string;
  typography: string;
  notable: string;
};

const PROTOTYPES: Prototype[] = [
  {
    version: "v35",
    label: "Carta v35",
    desc: "Imagenes AI-gen por perro, badge-spicy SVG, combo pricing consolidado, image transforms afinados",
    era: "c3digital",
    intent:
      "Incorporacion de imagenes generadas por IA (zinema-gen.png, bbq-bacon-gen.png, tropical-fuego-gen.png, birria-fusion-gen.png) con transforms individuales por producto para encuadre optimo. Combo pricing unificado a $25.000 para todos los perros. Badge de picante SVG inline en Tropical Fuego. Zinema recibe subtext 'Arma tu perro' dentro del nombre.",
    changes:
      "De v34: reemplaza fotos reales por AI-gen con transform scale/translate por perro. badge-spicy SVG (flame icon) en Tropical Fuego. arma-sub subtext dentro de .uni-block-name de Zinema. Combo normalizado a $25.000 (antes $23-25k variables). Precios de sabores actualizados (Birria de Res $22.000 nachos/tacos, $25.000 papas cargadas).",
    layout:
      "Identico a v34: lateral 3-col, uni-block, legend bar. Sin cambios estructurales — solo refinamiento de imagenes y pricing.",
    typography:
      "Space Grotesk. Sin cambios tipograficos respecto a v34.",
    notable:
      "Primera version con imagenes 100% AI-generated. Transform scale 1.35–1.60 por producto. badge-spicy con SVG flame path inline. arma-sub como sub-label dentro del nombre.",
  },
  {
    version: "v35-b",
    label: "Carta v35-b (Pixel Diner)",
    desc: "Variante Pixel Diner con badge '+Adicional $1.500' inline en pname-sub",
    era: "c3digital",
    intent:
      "Explorar comunicacion del costo adicional de toppings directamente en el ingrediente line, sin depender de la legend bar. 'Pixel Diner' como subtitulo de marca experimental.",
    changes:
      "De v35: agrega clase .adicional-1up con badge inline despues del plus-topping ('+ 1 topping +Adicional $1.500'). Subtitulo 'Pixel Diner' en header. Resto identico a v35.",
    layout:
      "Identico a v35.",
    typography:
      "Agrega .adicional-1up: font-size pequeño, color gris, badge inline junto a plus-topping.",
    notable:
      "Propuesta para hacer el costo adicional mas visible sin layer extra. Badge sticky junto al topping count. Subtitulo 'Pixel Diner' como nombre de linea de producto.",
  },
  {
    version: "v35-c",
    label: "Carta v35-c (Pixel Diner)",
    desc: "Variante Pixel Diner con reordenamiento de imagen/texto en pares de perros",
    era: "c3digital",
    intent:
      "Ajuste de ritmo visual: intercambia posicion de imagen y texto en el primer par (Zinema img pasa a la derecha) para variar la alternancia visual.",
    changes:
      "De v35-b: Zinema cambia de img-left a img-right (texto-left / img-right). Mantiene badge .adicional-1up. Menos lineas que v35-b (1051 vs 1079). Subtitulo 'Pixel Diner' en header.",
    layout:
      "Lateral 3-col con alternancia ajustada: Zinema img-right, BBQ Bacon img-right, Tropical Fuego img-right, Birria img-right — exploracion de ritmo distinto.",
    typography:
      "Identica a v35-b.",
    notable:
      "Exploracion de ritmo alternante distinto al estandar. Compacta mas que v35-b (menor numero de lineas). Mantiene sistema C3 completo.",
  },
  {
    version: "v34",
    label: "Carta v34",
    desc: "Combo pricing integrado: uni-flavor.combo-key amarillo/negro por perro",
    era: "c3digital",
    intent:
      "Incorporar el precio de combo como flavor adicional dentro del bloque de cada perro. uni-flavor.combo-key usa fondo negro + precio amarillo para diferenciarse visualmente de los sabores regulares. Comentario 'CARTA DIGITAL' en header del CSS documenta intencion de uso en pantalla.",
    changes:
      "De v33: agrega .uni-flavor.combo-key (background negro, label blanco, precio amarillo). combo-tag class para badge inline. Precios de combo por perro ($23-25k). Sin cambios en pname-sub ni ingredientes. Elimina image-edit overlay del CSS.",
    layout:
      "Identico a v33: lateral 3-col, uni-block con starburst punch, legend bar.",
    typography:
      "Space Grotesk. .uni-flavor.combo-key: label blanco 0.55rem, precio amarillo 0.95rem. .combo-tag: badge rojo inline.",
    notable:
      "Primera version con combo pricing visible en carta. Precios diferenciados por perro (Zinema $23k, BBQ/Tropical/Birria $24-25k). Layout oscuro del combo-key contrasta con flavors regulares.",
  },
  {
    version: "v33",
    label: "Carta v33",
    desc: "Image editor integrado: drag/scale/flip con boton lapiz, sin cambios de menu",
    era: "c3digital",
    intent:
      "Agregar herramienta de posicionamiento de imagenes directamente en la carta. Boton lapiz (bottom-left) activa modo edicion con drag libre, scale con rueda, flip horizontal. Permite ajustar encuadres sin tocar CSS manualmente.",
    changes:
      "De v31: incorpora el image editor de v31-2 al flujo principal. Boton pencil (bottom-left, position:fixed). Drag/scale/flip por imagen. Cursor grab en modo edicion. Sin cambios en contenido del menu.",
    layout:
      "Identico a v31. Image editor como overlay tool no-destructivo.",
    typography:
      "Identica a v31.",
    notable:
      "Herramienta de produccion integrada: editor de imagenes drag/scale/flip con boton pencil. Posiciones guardadas en transform CSS. Primero en incluir esta herramienta en la rama principal (v31-2 la tenia pero era solo lab de variaciones).",
  },
  {
    version: "v32c",
    label: "Carta v32c",
    desc: "Legend bar simplificada como fuente unica de verdad para toppings, sin uni-block",
    era: "c3digital",
    intent:
      "Alternativa a v32a/b: usar la legend bar expandida como unico punto de comunicacion de toppings, eliminando los bloques uni-block de punch por perro. pname-sub limpio sin plus-topping rojo.",
    changes:
      "De v32: mantiene la legend bar expandida. Elimina uni-block/starburst. pname-sub vuelve a version sin plus-topping. Nachos/Tacos/Papas Cargadas en bloques compactos. 1005 lineas (mas liviana que v32a/b).",
    layout:
      "Lateral 3-col sin uni-block. Legend bar como unico comunicador de toppings. Bloques nachos/tacos/papas mas compactos.",
    typography:
      "Space Grotesk. pname-sub sin plus-topping. Menos clases CSS que v32a/b.",
    notable:
      "Apuesta maximalista en la legend bar. Elimina la redundancia de comunicar toppings dos veces (legend + por perro). Mas limpio visualmente pero menos claro para el cliente.",
  },
  {
    version: "v32b",
    label: "Carta v32b",
    desc: "Expansion de v32a: nachos/tacos/papas con uni-block propio y sabores integrados",
    era: "c3digital",
    intent:
      "Extender el sistema uni-block a las categorias secundarias (nachos, tacos, papas cargadas). Cada categoria tiene su propio bloque con imagen, ingredientes base y lista de sabores como uni-flavors.",
    changes:
      "De v32a: nachos, tacos y papas cargadas pasan de cat-flavor grid horizontal a uni-block completo con imagen, ingredientes y flavors verticales. Mayor altura de la carta (1327 lineas). Legend bar mantenida.",
    layout:
      "Lateral 3-col. uni-block para TODOS los productos incluyendo nachos/tacos/papas. Carta mas alta y densa.",
    typography:
      "Identica a v32a.",
    notable:
      "Version mas completa del sistema uni-block — todos los productos (perros + nachos + tacos + papas) con el mismo tratamiento visual. Alta fidelidad de informacion.",
  },
  {
    version: "v32a",
    label: "Carta v32a",
    desc: "Retorno al sistema v31 con legend bar + pname-sub plus-topping, rama principal",
    era: "c3digital",
    intent:
      "Fusion del sistema de comunicacion aprobado en v31 (ingredientes en negro + plus-topping rojo) con la legend bar de v32. Descarta el toppings-bar global de v32 y retoma starburst punch por perro.",
    changes:
      "De v32: descarta toppings-bar global. Recupera uni-block con starburst punch por perro de v31. Agrega legend bar de v30. pname-sub con .plus-topping rojo. 1151 lineas (mas que v32 original).",
    layout:
      "Lateral 3-col con legend bar + uni-block + starburst punch. Cat-flavors horizontal para nachos/tacos.",
    typography:
      "Space Grotesk con .plus-topping red como v31.",
    notable:
      "Reconciliacion de dos ramas: toma lo mejor de v31 (plus-topping) + v32 (legend bar expandida). Base solida para v33+.",
  },
  {
    version: "v32",
    label: "Carta v32",
    desc: "Toppings-bar global — barra unica 'Personaliza tu plato' reemplaza punch por perro",
    era: "c3digital",
    intent:
      "Experimento radical: en vez de comunicar los toppings dentro de cada perro, una sola barra global al tope de la seccion explica el sistema. Cada perro pierde su bloque de punch individual.",
    changes:
      "De v31: elimina uni-block/starburst punch por perro. Agrega .toppings-bar global con titulo 'Personaliza tu plato', badge '1–3', y explicacion '+Adicional $1.500'. pname-sub sin plus-topping. 902 lineas (la mas compacta de la era C3).",
    layout:
      "Lateral 3-col sin punch individual. toppings-bar como header de seccion de perros. Cat-flavors en 1fr flex.",
    typography:
      "Space Grotesk. toppings-bar-title 1rem bold, toppings-bar-punch starburst 1.2rem, toppings-bar-extra 0.75rem.",
    notable:
      "La carta mas corta de la era C3 (902 lineas). Apuesta por la barra global que no prospera — la comunicacion es menos clara por perro. Sirve de referencia negativa para confirmar el sistema punch individual.",
  },
  {
    version: "v31-2",
    label: "Carta v31-2 (Variaciones Lab)",
    desc: "Documento de laboratorio: 5 variaciones A-E para hot dogs + 3 variaciones F-H para nachos/tacos",
    era: "c3digital",
    intent:
      "Lab de decisiones de comunicacion: 5 variaciones de como mostrar ingredientes y punch en hot dogs (A=minimo, B=construccion inline, C=solo identidad, D=dos niveles hero/detalle, E=directo+rojo) y 3 para categorias secundarias (F=tabla, G=sabores como filas, H=bloques separados por categoria). Incluye anotaciones PRO/CON por variacion.",
    changes:
      "Nuevo archivo independiente. No es iteracion de v31 — es documento de evaluacion. 1219 lineas. Image editor drag/scale incluido. Variacion E y H elegidas como resultado.",
    layout:
      "Documento multi-seccion: cada variacion es una version completa de la carta con anotaciones. No es para produccion.",
    typography:
      "Agrega tipografia de anotacion: .var-philosophy, .note-row, .note-label con colores PRO/CON.",
    notable:
      "Unico archivo 'meta-carta' — muestra el proceso de decision. Variacion E elegida para hot dogs (ingredientes directo + plus-topping rojo). Variacion H elegida para nachos/tacos/papas (bloques separados por categoria). Image editor integrado.",
  },
  {
    version: "v31",
    label: "Carta v31",
    desc: "Sistema C3 aplicado: ingredientes corregidos, plus-topping rojo, pname-sub variacion E",
    era: "c3digital",
    intent:
      "Aplicar el sistema de comunicacion C3 aprobado: pname-sub muestra ingredientes en negro bold + 'plus-topping' en rojo al final. Correcciones de receta: Tropical Fuego recupera Pina fresca, Birria Fusion incorpora Cilantro fresco (nuevo C3), BBQ Bacon reordena Tocineta al inicio.",
    changes:
      "De v30: nuevo CSS .plus-topping (font-weight 800, color var(--red)). pname-sub de cada perro actualizado con ingredientes C3 correctos. Zinema: Papas crocantes·Queso cheddar·SourCream·Salsa leña·+3 toppings. BBQ Bacon: Tocineta·Queso crema·BBQ Gold·Cebolla crispy·+1 topping. Tropical Fuego: Tocineta·Salsa piña·SourCream·Piña fresca·+1 topping. Birria Fusion: Res birria·Cheddar fundido·Papas ángel·Cilantro fresco·+1 topping.",
    layout:
      "Identico a v30: lateral 3-col simetrico 5.8cm, legend bar, starburst punch. Sin cambios estructurales.",
    typography:
      "Space Grotesk. Agrega .plus-topping: font-weight 800, color var(--red). Resto identico a v30.",
    notable:
      "Primera version con el sistema C3 completo en produccion. 'Cilantro fresco' entra como garnish fijo de Birria Fusion. 'Piña fresca' reemplaza 'Trozos de piña dulce'. 'Salsa piña' reemplaza 'Salsa piña-habanero'. Tocineta sube a primer ingrediente en BBQ Bacon.",
  },
  {
    version: "v30",
    label: "Carta v30",
    desc: "Merge v28 + v29-paola: layout lateral 3-col, legend bar comunicativa, starburst punch, CSS unificado",
    era: "lateral",
    intent:
      "Merge de v28 (CSS unificado, Space Grotesk, grid homogeneo) con v29-paola (comunicacion al cliente, legend bar hero/secondary, badges). Layout lateral evoluciona a 3-col simetrico (5.8cm|1fr|5.8cm). Combo explainer detallado. Carta de produccion final.",
    changes:
      "De v28: adopta legend bar hero/secondary de v29-paola con starburst punch (clip-path polygon, rotate -4deg). Topping label con flecha CSS ::after. Badges (best seller, nuevo, spicy, veg) de v29-paola. Combo explainer detallado ('Gaseosa + Crispetas o Papas'). Tag-explainer en vez de combo-explainer. Layout lateral 3-col simetrico (5.8cm|1fr|5.8cm, antes 4.6cm). Bebidas simplificadas (flex row, sin fondo negro). De v29-paola: mantiene Space Grotesk (no Dela Gothic), CSS variables unificadas, section-grid compartido.",
    layout:
      "Lateral 3-col simetrico: 5.8cm img-left | 1fr center-zone | 5.8cm img-right. Center-zone con txt-left/txt-right (2 productos por fila). Nachos/Tacos en lateral con cat-flavors centrados. Section-grid cols-3 para tex-mex y snacks.",
    typography:
      "Space Grotesk (de v28). Pname 1.5rem, pname-sub 0.58rem, pprice 1.05rem, pills 0.65rem. Legend 0.48rem, hero-text 0.38rem, secondary 0.4rem, punch 0.58rem starburst. Tag 0.5rem, tag-explainer 0.44rem.",
    notable:
      "Merge exitoso de dos ramas: v28 (sistema tecnico CSS) + v29-paola (comunicacion al cliente). Legend bar combina starburst visual con jerarquia informativa. Layout lateral simetrico es nuevo (5.8cm vs 4.6cm). Primer menu con live-reload script integrado.",
  },
  {
    version: "v29-paola",
    label: "Carta v29 (Paola)",
    desc: "Iteracion de Paola sobre v28: foco en comunicacion al cliente, legend bar explicativa, badges informativos",
    era: "lateral",
    intent:
      "Iteracion de Paola sobre v28 con foco en estandares de comunicacion al cliente: legend bar con jerarquia hero/secondary para que el cliente entienda el menu rapidamente, badges (mas pedido, nuevo, picante, vegetal), combo explainer visible, y tipografia display impactante.",
    changes:
      "De v28: cambia header a Dela Gothic One (display font) + Inter body (18px). Legend bar rediseñada con jerarquia: Toppings punch + 'Personaliza tu plato' + Recomendado + Combo. Agrega badges informativos (best seller, nuevo, spicy, veg). Product cards en grid vertical 4.6cm|1fr (no lateral 3-col). Brand-arc mas grande (300px).",
    layout:
      "Grid vertical 2-col (4.6cm img | 1fr info) con alternancia .flip. Dual-section 2-col para nachos/tacos. Snacks-grid y texmex-grid como clases independientes (no unificadas). Brand-arc 300px. Presenta-arc 190px.",
    typography:
      "Dela Gothic One header (72px). Inter body (18px). Pname 24px bold. Pdesc 14px. Legend 13px. Punch-label 12px. Tag 16px. Combo explainer 13px.",
    notable:
      "Primera iteracion por colaboradora externa (Paola). Prioriza comunicacion clara al cliente: legend bar explicativa, badges de estado, combo tag prominente, descripciones detalladas. Base conceptual para la legend bar y badges que v30 adopta.",
  },
  {
    version: "v28",
    label: "Carta v28",
    desc: "Refactorizacion: CSS unificado, espaciado optimizado, sistema grid homogeneo",
    era: "lateral",
    intent:
      "Optimizacion de espacio y homogeneizacion del CSS. Unifica snacks y tex-mex bajo un sistema grid compartido (.section-grid). Reduce tamaños globalmente para aprovechar mejor los 25x35cm.",
    changes:
      "De v27: CSS refactorizado — variables compartidas (--border, --dash, --radius). Snacks y Tex-Mex usan mismas clases (.grid-col, .grid-item, .grid-title). Header comprimido (brand-arc 260px, presenta-arc 170px). Todos los tamaños reducidos ~8% (pname 1.5rem, pills 0.65rem, prices 1.05rem). Padding/margin uniformizados.",
    layout:
      "Grid lateral 4.6cm (antes 4.8cm). Secciones grid con modificadores .cols-3 y .cols-4. Imágenes 2.5cm (antes 2.8cm). Gaps uniformes 0.18cm.",
    typography:
      "Space Grotesk. Escala reducida: pname 1.5rem, pprice 1.05rem, pills 0.65rem, grid-item 0.72rem, bev 0.62rem. Tag 0.5rem.",
    notable:
      "Eliminacion de CSS duplicado (snack-* y texmex-* → grid-*). Variables CSS para border, dash, radius. Responsive actualizado para cols-4→cols-2. Footer comprimido. ~15% menos lineas CSS que v27.",
  },
  {
    version: "v27",
    label: "Carta v27",
    desc: "Menu completo con precios finales, Tex-Mex, Snacks y Bebidas",
    era: "lateral",
    intent:
      "Desarrollo completo del menu de produccion: todos los productos con precios, secciones Tex-Mex y Snacks expandidas, papas rizadas, corndogs y bebidas.",
    changes:
      "De v22: agrega secciones Tex-Mex (alitas, mac&cheese, pollo popcorn, bebidas) y Snacks (corndogs, chicanitas, papas rizadas). Precios finales en todos los productos. Nachos y Tacos con 3 sabores en columnas. Punch mas prominente. Combo como texto rojo inline.",
    layout:
      "Grid 3-col lateral (4.8cm img | 1fr text | 4.8cm img). Tex-Mex en grid 4-col. Snacks en grid 3-col. Nachos/Tacos con cat-flavors flex centrado.",
    typography:
      "Space Grotesk. Nombres 1.6rem. Punch-extra 0.68rem red bold. Combo tag 1.15rem red inline. Cat-item-name 1rem uppercase centrado.",
    notable:
      "Zinema con Tropical Punch default (Piña+Jalapeños+Cheddar). BBQ Bacon renombrado de Fanzine Gold. Papas rizadas con 3 tamaños. Corndogs con variante Mixto (salchicha+queso). Separadores dashed #ccc. Tex-Mex arriba de Snacks.",
  },
  {
    version: "v26",
    label: "Carta v26",
    desc: "Cards verticales con hero overlay",
    era: "estilos",
    intent:
      "Layout card-based vertical donde cada producto es una tarjeta autocontenida con imagen hero y overlay cinematografico.",
    changes:
      "De v25: abandona el serif vintage por Bebas Neue + Inter. Cambia de layout lateral a grid 2-col de cards apiladas. Cada card tiene imagen hero con gradient overlay mostrando nombre/tag.",
    layout: "Grid 2-col de product cards. Hero image + body + punch zone apilados.",
    typography: "Bebas Neue display + Inter body. Nombres como overlay blanco sobre imagen.",
    notable:
      "Sistema de colores por ingrediente en CSS variables (8 colores unicos). Badges 'Viene Completo'. Optimizado para scroll vertical/mobile.",
  },
  {
    version: "v25",
    label: "Carta v25",
    desc: "Vintage editorial con serif y textura papel",
    era: "estilos",
    intent:
      "Estetica de revista vintage con tipografia serif clasica, elementos hand-drawn y vibra de diner americano.",
    changes:
      "De v24: cambia paleta de azul highway a marrones/crema calidos. Introduce Playfair Display serif + Courier Prime monospace + Special Elite handwriting.",
    layout: "Grid lateral 5.5cm imagenes. Overlay de textura papel. Separadores doble linea.",
    typography:
      "Playfair Display 1.45rem serif bold, Courier Prime mono para descripciones (evoca maquina de escribir), Special Elite cursiva.",
    notable:
      "Textura papel via gradientes radiales. Pills categorizadas por color (veggie/queso/especial). Badges Popular/Premium/Recomendado en imagenes.",
  },
  {
    version: "v24",
    label: "Carta v24",
    desc: "Highway Americana con escudo y rivets",
    era: "estilos",
    intent:
      "Americana road-trip + marquee de cine. Senalizacion de autopista con contraste alto azul/mostaza.",
    changes:
      "De v23: abandona pasteles ice cream por azul oscuro (#0D47A1) + mostaza (#F9A825). Logo tipo escudo highway. Rivets metalicos 3D en esquinas.",
    layout:
      "Grid lateral simplificado. Header con escudo + patron highway. Rivets pseudo-elements en 4 esquinas. Bordes redondeados 6px.",
    typography: "Bebas Neue uppercase espaciado + Inter clean. Precios en badges blanco-sobre-rojo.",
    notable:
      "Escudo highway tipo Route 66. Efecto rivet metalico 3D (radial gradient + inset). Franjas viales como separadores. Pills con color por ingrediente.",
  },
  {
    version: "v23",
    label: "Carta v23",
    desc: "Ice cream parlor con pasteles y zig-zag",
    era: "estilos",
    intent:
      "Estetica heladeria vintage con bordes redondeados suaves, sombras multi-capa y paleta pastel rosa/turquesa/coral.",
    changes:
      "De v22: cambio radical de paleta — de rojo/negro a pasteles. Introduce Bebas Neue + Poppins. Bordes full-rounded 50px. Zig-zag borders en header/footer.",
    layout:
      "Grid lateral con bordes 50px rounded. Punch area rosa con pills pill-shape. Fondo polka dots.",
    typography: "Bebas Neue display playful + Poppins modern sans. Tamanos mas pequenos.",
    notable:
      "Zig-zag scalloped borders. Sombras multi-capa (4px + 8px + 12px offset). Paleta rosa/turquesa/coral tipo heladeria. Animacion pulse-gratis.",
  },
  {
    version: "v22",
    label: "Carta v22",
    desc: "Punch gamificado, pills como tokens, layout lateral refinado",
    era: "lateral",
    intent:
      "Simplificacion del lateral con foco en la gamificacion del punch. Pills como tokens de arcade — recomendados 'encendidos' vs disponibles.",
    changes:
      "De v21: punch rediseñado como caja con fondo #FAFAFA y pills tipo token. pname-sub introduce keywords de ingredientes. Pills mas grandes y tactiles.",
    layout:
      "Grid 3-col lateral (4.8cm img | 1fr text | 4.8cm img). Punch como box con row-flex labels.",
    typography:
      "Space Grotesk body. Nombres 1.6rem extra bold. pname-sub 0.62rem keywords. Pills 0.72rem.",
    notable:
      "Pills rec: fondo amarillo + borde solid + shadow (token encendido). Pills normales: fondo blanco + borde dashed (token disponible). Gamificacion del momento de decision.",
  },
  {
    version: "v21",
    label: "Carta v21",
    desc: "Simetria lateral con flechas direccionales",
    era: "lateral",
    intent:
      "Layout simetrico completo: imagenes en ambos lados simultaneamente con zona central de texto comparativo.",
    changes:
      "De v20: imagenes aparecen en AMBOS lados (no alternando). Zona central con 2 bloques de texto separados por linea punteada. Flechas direccionales.",
    layout:
      "3-col simetrico con imagenes flanqueando texto centrado. Separacion left/right con dividers horizontales.",
    typography:
      "Space Grotesk. Nombres 1.5rem muy grandes. Tags inline con flechas (◀ / ▶) como indicadores.",
    notable:
      "Flechas direccionales (◀Zinema | Gold▶) indican producto izq/der. Banner combo con emoji. Luces marquee en bordes del banner.",
  },
  {
    version: "v20",
    label: "Carta v20",
    desc: "Grid lateral con imagen multi-row",
    era: "lateral",
    intent:
      "Grid 3-col donde imagenes pueden abarcar multiples filas, creando efecto de spread de revista.",
    changes:
      "De v19: introduce grid explicito 3-col (img | text | img). Imagen puede invadir espacio del vecino con grid-row spanning. dog-pair agrupa 2 productos.",
    layout:
      "CSS Grid explicito: 4.5cm img | 1fr text | 4.5cm img. Pair grids con overlap de imagen.",
    typography: "Space Grotesk. Nombres 1.3rem. Tags 0.48rem red uppercase. Pills 0.44rem mas pequenos.",
    notable:
      "Imagen spanning multi-row crea efecto cinematografico overlap. dog-pair permite que una foto represente 2 productos.",
  },
  {
    version: "v19",
    label: "Carta v19",
    desc: "Bloques estructurados, punch simplificado",
    era: "lateral",
    intent:
      "Simplificacion de v18: bloques de contenido mas estructurados, punch con pills dashed vs solid.",
    changes:
      "De v18: elimina alternancia de imagen izq/der. Layout mas consistente img-left + text-right. Punch con pills dashed (no-rec) vs solid (rec).",
    layout:
      "Flex horizontal con pares imagen-texto centrados. Hero images 4cm. Grids 2-col para snacks/texmex.",
    typography: "Space Grotesk. Nombres 1.35rem. Tags 0.5rem. Precios 0.85rem bold red. Pills 0.48rem.",
    notable:
      "Punch simplificado sin cola decorativa. Jerarquia visual mas limpia. Separadores horizontales entre secciones.",
  },
  {
    version: "v18",
    label: "Carta v18",
    desc: "Magazine con alternancia de imagen",
    era: "lateral",
    intent:
      "Layout estilo revista con alternancia de posicion de imagen (izq/der) y sistema de punch con speech bubble.",
    changes:
      "De v17c: cambia de masonry card grid a magazine-row con alternancia. Mantiene punch speech bubble. Pill system con estrellas amarillas.",
    layout:
      "Flex magazine con imagenes alternando izq/der. Categorias secundarias con shared images. Grid 2-col para algunas categorias.",
    typography:
      "Space Grotesk. Nombres 1.2rem bold uppercase. Tags 0.45rem. Precios 0.8rem. Pills 0.5rem.",
    notable:
      "Speech bubble punch con cola. Fondo checkered (conic gradient). Dual-price. Separadores punteados.",
  },
  {
    version: "v17c",
    label: "Carta v17c",
    desc: "Masonry card grid — maxima densidad",
    era: "completo",
    intent:
      "Maxima optimizacion de espacio para A3. Cards de hotdog (img + text) + small card grids para categorias secundarias.",
    changes:
      "De v17b: hot dog cards usan grid 2.8cm img + 1fr content. Small cards para nachos/tacos/chicanitas en grids 4x3x3. Bottom band 4-col.",
    layout:
      "2-col masonry (izq: hotdogs 1-2 + nachos; der: hotdogs 3-4 + tacos) + 4-col bottom band.",
    typography:
      "Comprimido: 0.5rem section labels, 0.38rem small card names, 0.85rem hot dog card names.",
    notable:
      "Version mas compacta conservando identidad. Speech bubbles solo en hotdogs. Category-specific badge colors. 26 items totales con fotos.",
  },
  {
    version: "v17b",
    label: "Carta v17b",
    desc: "Magazine format — legibilidad primero",
    era: "completo",
    intent:
      "Estilo revista con filas de hotdog hero (imagen + texto) y categorias compactas con shared images.",
    changes:
      "De v17a: hot dogs como 'magazine rows' (flex: img izq, info der). Punch removido para ahorrar espacio. Categorias con shared images.",
    layout:
      "Magazine flow: filas full-width para hotdogs, categorias compactas con imagenes compartidas.",
    typography: "Mas grande para legibilidad: 1.3rem dog names, 0.65rem compact items.",
    notable:
      "Shared images por categoria reducen repeticion visual. Punch simplificado a pills inline. Hotdogs con tratamiento premium (imagen + texto generoso).",
  },
  {
    version: "v17a",
    label: "Carta v17a",
    desc: "Carta completa — landscape comprimido",
    era: "completo",
    intent:
      "Comprimir menu completo en A3 landscape. Film strip + masonry 2-col + bottom band 4-col.",
    changes:
      "De v17: masonry 2-col (izq: clasico+especiales 1-2+corndogs; der: especiales 3-4+tacos). Bottom band para chicanitas/alitas/texmex.",
    layout:
      "Masonry 2-col content + 4-col bottom band strip. Zigzag border entre secciones.",
    typography: "Ultra comprimido: 0.5rem base, 0.95rem product names.",
    notable:
      "Zigzag border CSS gradient. Category-specific colored badges. Bottom band como referencia rapida con items 0.8cm. Film strip header/footer.",
  },
  {
    version: "v17",
    label: "Carta v17",
    desc: "Primera carta completa — A3 poster",
    era: "completo",
    intent:
      "Expansion de hot dogs a menu completo del restaurante (7 categorias). Formato A3 25x35cm con film strip branding.",
    changes:
      "De v16: de solo hot dogs a 7 categorias. Introduce @page 25cm x 35cm. Header con film strip + 'PRESENTA' arc. Hot dogs en grid 2x2 con imagen.",
    layout:
      "Film strip header, 2x2 hot dog grid, 4-col bottom band (corndogs, chicanitas, alitas, texmex). Masonry columns.",
    typography:
      "Tamanos reducidos para print: 0.6rem section labels, 0.95rem product names en cards.",
    notable:
      "Film strip perforaciones en header/footer. Fotos de producto via Supabase URLs. A3 print optimizado. Expansion a 26 items totales.",
  },
  {
    version: "v16",
    label: "Carta v16",
    desc: "Bubble gum pop — burbujas suaves",
    era: "comic",
    intent:
      "Retorno a card unificada con bordes redondeados 32px. Burbujas suaves detras de nombres, minimo ruido visual.",
    changes:
      "De v15: de stickers sueltos a card unificada. Dog names con bubble backdrop circular (::before con red tint 0.08 alpha). Salsas light pink.",
    layout: "Single card 32px border-radius. Punch sin speech bubble tail. Separadores punteados.",
    typography:
      "Space Grotesk. Nombres 2.8rem con bubble suave. Jerarquia mas simple.",
    notable:
      "Bubble backdrops sutiles (no cajas llenas). Punch sin cola. Pills estilo pastilla redondeada. Estetica mas refinada que v13-15.",
  },
  {
    version: "v15",
    label: "Carta v15",
    desc: "Sticker sheet — elementos dispersos con rotacion",
    era: "comic",
    intent:
      "Estetica sticker-sheet: elementos dispersos sobre fondo beige con rotaciones independientes, calidad tactil/fisica.",
    changes:
      "De v14: rompe la card contenedora. Header, dogs, salsas, footer son stickers independientes con rotacion. Fondo beige. Nombres con underline rojo.",
    layout:
      "Stickers dispersos sobre beige, no contenidos en card unica. Rotaciones -1deg a 1deg por sticker.",
    typography: "Space Grotesk. Nombres 3rem sin background, solo underline. Mas grande overall.",
    notable:
      "Metafora sticker con transforms de rotacion. Layout scattershot. Pills individualmente rotados. Paleta calida beige/crema dominante.",
  },
  {
    version: "v14",
    label: "Carta v14",
    desc: "Comic panels — fondos pastel alternantes",
    era: "comic",
    intent:
      "Estetica comic multicolor: cada fila de producto con fondo pastel diferente (blanco, rosa, amarillo, verde) creando ritmo de panel.",
    changes:
      "De v13: agrega fondos pastel alternantes por fila (panel cycling). Section labels simplificados a red box. Footer con gradient.",
    layout: "Identico a v13 pero con background color alternation por dog row.",
    typography: "Igual a v13.",
    notable:
      "Color cycling en filas crea ritmo de comic. Bordes y sombras pesados mantenidos de v13. Footer gradient.",
  },
  {
    version: "v13",
    label: "Carta v13",
    desc: "Comic poster — bordes gruesos y speech bubbles",
    era: "comic",
    intent:
      "Estetica comic/poster con bordes negros 3px, speech bubble punch con cola, sombras tipo sticker 4px.",
    changes:
      "De v12: bordes pesados 3px en todo. Speech bubble punch con cola 45deg rotada. Fondo checkered. Sombras 4px 4px 0 black. Resaltados amarillos.",
    layout:
      "Card principal con bordes y sombra prominentes. Single column interno.",
    typography: "Space Grotesk. Nombres 2.8rem grandes. Punch title con gradient clip.",
    notable:
      "Speech bubble con cola rotada 45deg. Fondo checkered rojo/blanco. Drop shadows prominentes. Salsas sobre fondo amarillo. Comic book visual language.",
  },
  {
    version: "v12",
    label: "Carta v12",
    desc: "Gradientes bold con nombres rotados",
    era: "gradiente",
    intent:
      "Retorno a gradientes con nombres de producto en cajas coloreadas con rotacion -1.5deg. Punch grid 3-col mas redondeado.",
    changes:
      "De v11: quita ticket metaphor. Nombres en gradient background + white text + rotacion. Punch cards 3-col grid 12px rounded. Reglas gradient 5px.",
    layout:
      "Single column. Section bands con elementos dot + line. Filas separadas por thin borders.",
    typography:
      "Space Grotesk. Nombres 1.8rem rotados en gradient box. Precios 1.4rem dual. Descriptions 0.95rem mas grandes.",
    notable:
      "Nombres en cajas gradient rotadas. Punch grid espacioso. Salsas en grid layout. Footer inverted stripes. Resaltados amarillos FEF9C3.",
  },
  {
    version: "v11",
    label: "Carta v11",
    desc: "Cinema ticket — stub de precio lateral",
    era: "gradiente",
    intent:
      "Estetica cine/teatro con film strip y ticket stubs. Cada producto como entrada de cine con precio en stub lateral.",
    changes:
      "De v10: header oscurecido a burgundy. Ticket cards con stub crema lateral mostrando precio. Film strip perforaciones. Fonts: Anton + Playfair.",
    layout:
      "Single column. Ticket cards flex: body + stub side-by-side. Mobile: stacked con stub horizontal.",
    typography:
      "Anton (brand), Playfair Display (taglines serif italic), Inter (body). Nombres 1.5rem.",
    notable:
      "Metafora ticket con stub de precio coloreado. Perforaciones de film strip. 'Now Showing' marquee. Tipografia serif formal para taglines.",
  },
  {
    version: "v10",
    label: "Carta v10",
    desc: "Gradientes con punch interactivo",
    era: "gradiente",
    intent:
      "Establecer estetica gradient-driven con punch system. Degradados rojo-coral-rosa, textura grid sutil, franjas sunset.",
    changes:
      "De v9: abandona constructivismo por gradientes suaves. Introduce gradient borders en punch card. Textura grid en body. Sunset stripes decorativas.",
    layout:
      "Single column 800px. Header, section labels con rules, dog entries, punch boxes, salsas, footer apilados.",
    typography:
      "Space Grotesk. Titulo 4rem uppercase gradient clip. Nombres 1.5rem bold. Descriptions 0.88rem. Punch options 0.8rem.",
    notable:
      "Gradient transparent borders en punch card. Grid texture overlay en body. Sunset stripes invertidas en footer. Combo badge para items sin punch.",
  },
  {
    version: "v9",
    label: "Carta v9",
    desc: "Constructivismo — diagonales boldas",
    era: "pop",
    intent:
      "Diseño constructivista/modernista con barras diagonales, formas geometricas boldas y contraste rojo-negro inspirado en avant-garde siglo XX.",
    changes:
      "De v8: de VHS a constructivismo. Barras diagonales skewed. Bebas Neue para headlines. Acentos diagonales en punch box esquina superior-derecha.",
    layout:
      "Single column con bloques divisores diagonales. Header con barra roja skewed. Punch con acento diagonal rotado 45deg.",
    typography:
      "Bebas Neue extended uppercase (0.08-0.2em spacing) + Inter. Brand 5.5rem. Nombres 2rem. Section 1.1rem.",
    notable:
      "Barras diagonales skewX(-8deg). Acento diagonal en punch top-right (translate + rotate 45deg). Section headers con corte triangular (border-trick ::after). Taglines con borde izquierdo rojo 3px.",
  },
  {
    version: "v8",
    label: "Carta v8",
    desc: "VHS broadcast — tracking lines y monospace",
    era: "pop",
    intent:
      "Estetica VHS/broadcast 80s-90s con lineas de tracking, botones play, contadores de canal y tipografia monospace evocando UI de VCR.",
    changes:
      "De v7: de editorial elegante a VHS retro. IBM Plex Mono monospace. Tracking lines con franja roja. CH:01/CH:02 channel counters. Badge REC en header.",
    layout:
      "Single column con tracking-line dividers. Punch como interfaz play (triangulo play icon). Channel counters antes de section titles.",
    typography:
      "Oswald sans bold uppercase (headers) + IBM Plex Mono (labels/counters/timestamps). Nombres 1.6rem. Punch-pill 0.85rem. Counter 0.6rem mono red.",
    notable:
      "Tracking lines con franja roja (::before). Play icon triangulo antes de punch-label. Badge REC con dot rojo. Timestamps monospace. Corner-marks con bordes rojos 2px.",
  },
  {
    version: "v7",
    label: "Carta v7",
    desc: "Editorial contemporaneo — punch cards elegantes",
    era: "pop",
    intent:
      "Editorial contemporaneo refinado: punch-cards como pull-out editorial con acento triangular en esquina, minimalismo elegante.",
    changes:
      "De v6: refina el Swiss. Quita grid-number column. Punch-cards con acento triangular top-right. Dividing borders entre punch-options. Footer simplificado.",
    layout:
      "Single column semantico. Product header flex baseline. Punch-card estructura header/body/footer con bordes.",
    typography:
      "DM Serif Display italic (labels/titles) + Inter sans (body). Brand 4.5rem serif. Nombres 1.8rem serif. Punch-card-title 1rem italic.",
    notable:
      "Triangulo esquina punch-card top-right (border-trick ::before). Punch-options con vertical rules. Fondo rosa palido (#FDF0F2) en recomendados. Red dot bullet separators.",
  },
  {
    version: "v6",
    label: "Carta v6",
    desc: "Swiss editorial — Memphis geometrico con serif",
    era: "pop",
    intent:
      "Diseño modernista suizo con acentos Memphis geometricos. Tipografia serif-first, numeros grandes, paleta minima rojo/negro/blanco.",
    changes:
      "De v5: de arcade a Swiss editorial. DM Serif Display italic + Inter sans. Numeros grandes rojos (1-4) en columna izquierda. Elementos Memphis (triangulos, circulos).",
    layout:
      "Single column con grid numerado izquierdo (72px + 1fr). Section headers con sistema decorativo linea. Punch cards editoriales con triangulo rojo esquina.",
    typography:
      "DM Serif Display italic (serif-first). Brand 5rem serif. Nombres 1.6rem serif. Sections 0.65rem sans bold.",
    notable:
      "Numeros rojos grandes (1-4) indexando productos. Elementos Memphis decorativos en header. Punch cards con triangulo esquina y bordes rojos. Footer patron geometrico (3 cuadrados coloreados). High-fashion magazine aesthetic.",
  },
  {
    version: "v5",
    label: "Carta v5",
    desc: "Arcade retro — neon, scanlines y pixel font",
    era: "pop",
    intent:
      "Estetica arcade 80s con neon, pixel fonts, scanlines CRT y lenguaje de videojuego. Punch elevado a mecanica de juego.",
    changes:
      "De v4: giro radical a arcade. Press Start 2P pixel font. Punch-box como arcade cabinet con scanlines. Colores neon sobre fondo oscuro. Lenguaje 'Player 1', 'Game Over'.",
    layout:
      "Single column. Punch-boxes con overlay scanline (repeating linear gradient). Header con 'Player 1' subtitle en pixel font. Grid con hover effects.",
    typography:
      "Space Grotesk body + Press Start 2P pixel (arcade elements). Tamanos pixel: 0.35-0.6rem. All-caps con 0.1-0.2em spacing.",
    notable:
      "Efecto scanline CRT en punch-box. Cursor parpadeante en punch-subtitle. Estrellas recomendadas con glow neon (text-shadow + box-shadow cyan/yellow). Tropical Fuego como 'combo locked'. Lenguaje arcade extenso.",
  },
  {
    version: "v4",
    label: "Carta v4",
    desc: "Print narrative — storytelling con punch interactivo",
    era: "narrativa",
    intent:
      "Menu single-column optimizado para impresion con descripciones narrativas y sistema 'Dale tu Punch' interactivo.",
    changes:
      "De v3: de multi-card grid a single column 800px vertical. Descriptions narrativas con ingredientes en bold. Punch-box con visual rounded/dashed. Pricing dual (opcion A / B).",
    layout:
      "Single column vertical. Header centrado con border-bottom. Nombre-dots-precio. Punch-box flex para toppings. page-break-inside: avoid.",
    typography:
      "Space Grotesk. Brand 3.5rem. Nombres 1.4rem bold. Tagline 0.75rem uppercase. Description 0.85rem. Punch 0.85rem centered.",
    notable:
      "Descripciones narrativas (no tags). 'Dale tu Punch' concepto visual con punch-box. Estrellas doradas en recomendados. Dotted line fill entre nombre y precio. Print-optimized.",
  },
  {
    version: "v3",
    label: "Carta v3",
    desc: "Grid cards responsive con emoji",
    era: "conceptual",
    intent:
      "Sistema de cards en grid responsive. Clasicos 2-col, Especiales 3-col. Retorno a bordes con box-shadow.",
    changes:
      "De v2: de 2-col editorial a multi-card grid. Clasicos 2-col, Especiales 3-col responsive. Emoji grande 3.5rem por card. Ingredient pills coloreados.",
    layout:
      "Grid responsive: 1fr 1fr (clasicos), 1fr 1fr 1fr (especiales). Gap 1.25rem. Cards flex-column. Max-width 1100px.",
    typography:
      "Space Grotesk. Nombres clamp(1.4rem, 3vw, 1.8rem). Ingredient pills 0.65rem uppercase. Precio 1.4rem bottom.",
    notable:
      "Emoji grande como identificador visual primario. Pills coloreados (base/salsa/queso/crunch/fresco/proteina). Dashed border 'choose topping' dentro de cards. Precio por cantidad de toppings.",
  },
  {
    version: "v2",
    label: "Carta v2",
    desc: "Newspaper 2-col editorial",
    era: "conceptual",
    intent:
      "Layout periodico/revista 2-col con division simetrica izq/der entre Clasicos y Especiales.",
    changes:
      "De v1: de dark cards a light editorial 2-col. Elimina animaciones y card borders pesados. Accent dots coloreados antes de nombres. Pricing inline.",
    layout:
      "Grid 1fr 1fr con borde central divisor. Max-width 1100px. Bordes horizontales entre items.",
    typography:
      "Space Grotesk. Brand 3-5rem. Section titles 1.6rem. Nombres 1.2rem bold. Precios 1.1rem.",
    notable:
      "Accent dots (circulos coloreados) marcan nombres. Sin bordes de card (estilo lista inline). Tags simplificados. Toppings box compartido por seccion. Feel editorial/publicacion.",
  },
  {
    version: "v1",
    label: "Carta v1",
    desc: "Cinematico — marquee animado y dark theme",
    era: "conceptual",
    intent:
      "Menu cinematografico inspirado en posters de cine y marquees de teatro. Hot dogs como 'reviews' con estetica premium oscura.",
    changes:
      "Version inicial. Marquee lights animados. Card-based layout con 'film card' design. Color-coded ingredient tags. Sistema 'credits' para ingredientes.",
    layout:
      "Single column 680px. Vertical card stack. Header full-height marquee con luces animadas. Cards con bordes 3px + box-shadow 4px offset.",
    typography:
      "Space Grotesk. H1 responsive 4-8rem. Section titles 2-3rem. Nombres 1.8-2.4rem. Ingredients 0.85rem. Uppercase extenso.",
    notable:
      "Luces marquee pulsantes animadas. Bordes 3px solid black + 4px offset shadow. Tags coloreados por tipo de ingrediente. Dashed border 'pick section'. Pricing con slash separator. Estetica de poster de cine.",
  },
];

function getEra(id: string) {
  return ERAS.find((e) => e.id === id);
}

export default function DisenoMenuPage() {
  const [ascending, setAscending] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "timeline">("grid");

  const sorted = ascending ? [...PROTOTYPES].reverse() : PROTOTYPES;

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen"
      style={{ backgroundColor: "#fff", color: "#000" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1 text-xs text-neutral-500">
          <Link
            href="/lab"
            className="hover:text-neutral-800 transition-colors"
          >
            Lab
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-semibold">
            Diseno de Menu
          </span>
        </nav>

        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-2"
              style={{ color: "#e63946" }}
            >
              Diseno de Menu
            </h1>
            <p className="text-neutral-500 text-sm font-semibold">
              {PROTOTYPES.length} prototipos &middot; {ERAS.length} eras de
              diseño
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* View toggle */}
            <div
              style={{
                display: "flex",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setView("grid")}
                style={{
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  border: "none",
                  background: view === "grid" ? "#000" : "#fff",
                  color: view === "grid" ? "#fff" : "#000",
                }}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("timeline")}
                style={{
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  border: "none",
                  borderLeft: "2px solid #000",
                  background: view === "timeline" ? "#000" : "#fff",
                  color: view === "timeline" ? "#fff" : "#000",
                }}
              >
                Timeline
              </button>
            </div>

            {view === "grid" && (
              <button
                type="button"
                onClick={() => setAscending(!ascending)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  border: "2px solid #000",
                  background: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: "2px 2px 0 #000",
                }}
              >
                {ascending
                  ? "↑ Mas antiguo primero"
                  : "↓ Mas reciente primero"}
              </button>
            )}
          </div>
        </div>

        {/* ===== GRID VIEW ===== */}
        {view === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((p, i) => {
              const num = ascending ? i + 1 : PROTOTYPES.length - i;
              const era = getEra(p.era);
              const isExpanded = expandedVersion === p.version;

              return (
                <div key={p.version} className="flex flex-col">
                  <div
                    className="overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 flex-1 flex flex-col"
                    style={{
                      backgroundColor: "#fff",
                      border: "3px solid #000",
                      boxShadow: "4px 4px 0 #000",
                    }}
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{
                        backgroundColor: era?.color ?? "#000",
                      }}
                    />
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[0.6rem] px-2 py-0.5 font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor:
                              p.version === "v30" ? "#e63946" : "#f5f5f5",
                            color: p.version === "v30" ? "#fff" : "#666",
                            border: `2px solid ${p.version === "v30" ? "#e63946" : "#ddd"}`,
                          }}
                        >
                          #{num}
                        </span>
                        <span
                          className="text-[0.6rem] font-bold uppercase tracking-wider"
                          style={{ color: "#aaa" }}
                        >
                          {p.version}
                        </span>
                      </div>

                      <a
                        href={`/hotdogs/carta-${p.version}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline block"
                      >
                        <h2
                          className="font-bold text-lg tracking-wide uppercase mt-2 hover:underline"
                          style={{
                            color:
                              p.version === "v30" ? "#e63946" : "#0A0A0A",
                          }}
                        >
                          {p.label}
                        </h2>
                      </a>

                      <p className="text-xs text-neutral-500 mt-1 font-semibold">
                        {p.desc}
                      </p>

                      {era && (
                        <span
                          className="inline-block mt-2 text-[0.55rem] px-2 py-0.5 font-bold uppercase tracking-wider rounded-sm"
                          style={{
                            backgroundColor: era.color + "18",
                            color: era.color,
                            border: `1.5px solid ${era.color}40`,
                          }}
                        >
                          {era.label}
                        </span>
                      )}

                      <div className="mt-auto pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedVersion(
                              isExpanded ? null : p.version
                            )
                          }
                          className="text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#999",
                            padding: 0,
                          }}
                        >
                          {isExpanded ? "▲ Cerrar" : "▼ Detalles"}
                        </button>
                      </div>
                    </div>

                    {/* Expandable details */}
                    {isExpanded && (
                      <div
                        className="px-4 pb-4"
                        style={{
                          borderTop: "1.5px dashed #ddd",
                          fontSize: "0.7rem",
                          lineHeight: 1.6,
                          color: "#444",
                        }}
                      >
                        <div className="pt-3 space-y-2">
                          <div>
                            <span
                              className="font-bold uppercase tracking-wider"
                              style={{ color: "#999", fontSize: "0.6rem" }}
                            >
                              Intencion
                            </span>
                            <p className="mt-0.5">{p.intent}</p>
                          </div>
                          <div>
                            <span
                              className="font-bold uppercase tracking-wider"
                              style={{ color: "#999", fontSize: "0.6rem" }}
                            >
                              Cambios clave
                            </span>
                            <p className="mt-0.5">{p.changes}</p>
                          </div>
                          <div>
                            <span
                              className="font-bold uppercase tracking-wider"
                              style={{ color: "#999", fontSize: "0.6rem" }}
                            >
                              Layout
                            </span>
                            <p className="mt-0.5">{p.layout}</p>
                          </div>
                          <div>
                            <span
                              className="font-bold uppercase tracking-wider"
                              style={{ color: "#999", fontSize: "0.6rem" }}
                            >
                              Tipografia
                            </span>
                            <p className="mt-0.5">{p.typography}</p>
                          </div>
                          <div>
                            <span
                              className="font-bold uppercase tracking-wider"
                              style={{ color: "#999", fontSize: "0.6rem" }}
                            >
                              Notable
                            </span>
                            <p className="mt-0.5">{p.notable}</p>
                          </div>
                        </div>

                        <a
                          href={`/hotdogs/carta-${p.version}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-[0.65rem] font-bold uppercase tracking-wider no-underline"
                          style={{
                            padding: "0.35rem 0.75rem",
                            border: "2px solid #000",
                            background: "#000",
                            color: "#fff",
                            boxShadow: "2px 2px 0 #000",
                          }}
                        >
                          Abrir prototipo →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== TIMELINE VIEW ===== */}
        {view === "timeline" && (
          <div className="space-y-12">
            {ERAS.map((era) => {
              const eraPrototypes = PROTOTYPES.filter(
                (p) => p.era === era.id
              ).reverse(); // chronological within era

              return (
                <div key={era.id}>
                  {/* Era header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: era.color }}
                    />
                    <div>
                      <h2
                        className="text-xl font-bold tracking-widest uppercase"
                        style={{ color: era.color }}
                      >
                        {era.label}
                      </h2>
                      <p className="text-xs text-neutral-500 font-semibold">
                        {era.range} &middot; {eraPrototypes.length}{" "}
                        {eraPrototypes.length === 1
                          ? "prototipo"
                          : "prototipos"}{" "}
                        &middot; {era.desc}
                      </p>
                    </div>
                  </div>

                  {/* Timeline items */}
                  <div className="relative ml-1.5">
                    {/* Vertical line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5"
                      style={{ backgroundColor: era.color + "30" }}
                    />

                    <div className="space-y-4">
                      {eraPrototypes.map((p) => {
                        const isExpanded = expandedVersion === p.version;

                        return (
                          <div
                            key={p.version}
                            className="relative pl-6"
                          >
                            {/* Dot */}
                            <div
                              className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full -translate-x-1"
                              style={{
                                backgroundColor:
                                  p.version === "v30"
                                    ? "#e63946"
                                    : era.color,
                                border: "2px solid #fff",
                                boxShadow: `0 0 0 1.5px ${era.color}`,
                              }}
                            />

                            <div
                              style={{
                                border: "2px solid #e5e5e5",
                                borderLeft: `3px solid ${era.color}`,
                              }}
                            >
                              <div className="p-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="text-[0.6rem] px-1.5 py-0.5 font-bold uppercase tracking-wider"
                                      style={{
                                        backgroundColor:
                                          p.version === "v30"
                                            ? "#e63946"
                                            : "#f5f5f5",
                                        color:
                                          p.version === "v30"
                                            ? "#fff"
                                            : "#666",
                                        border: `1.5px solid ${p.version === "v30" ? "#e63946" : "#ddd"}`,
                                      }}
                                    >
                                      {p.version}
                                    </span>
                                    <a
                                      href={`/hotdogs/carta-${p.version}.html`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="no-underline"
                                    >
                                      <span
                                        className="font-bold text-sm tracking-wide uppercase hover:underline"
                                        style={{
                                          color:
                                            p.version === "v30"
                                              ? "#e63946"
                                              : "#0A0A0A",
                                        }}
                                      >
                                        {p.desc}
                                      </span>
                                    </a>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedVersion(
                                        isExpanded ? null : p.version
                                      )
                                    }
                                    className="text-[0.6rem] font-bold uppercase tracking-wider cursor-pointer"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#999",
                                      padding: 0,
                                    }}
                                  >
                                    {isExpanded ? "▲" : "▼"}
                                  </button>
                                </div>

                                {/* Brief intent always visible */}
                                <p
                                  className="mt-1"
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#777",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {p.intent}
                                </p>

                                {/* Expanded details */}
                                {isExpanded && (
                                  <div
                                    className="mt-3 pt-3 space-y-2"
                                    style={{
                                      borderTop: "1.5px dashed #e5e5e5",
                                      fontSize: "0.7rem",
                                      lineHeight: 1.6,
                                      color: "#444",
                                    }}
                                  >
                                    <div>
                                      <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{
                                          color: "#999",
                                          fontSize: "0.6rem",
                                        }}
                                      >
                                        Cambios clave
                                      </span>
                                      <p className="mt-0.5">
                                        {p.changes}
                                      </p>
                                    </div>
                                    <div>
                                      <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{
                                          color: "#999",
                                          fontSize: "0.6rem",
                                        }}
                                      >
                                        Layout
                                      </span>
                                      <p className="mt-0.5">
                                        {p.layout}
                                      </p>
                                    </div>
                                    <div>
                                      <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{
                                          color: "#999",
                                          fontSize: "0.6rem",
                                        }}
                                      >
                                        Tipografia
                                      </span>
                                      <p className="mt-0.5">
                                        {p.typography}
                                      </p>
                                    </div>
                                    <div>
                                      <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{
                                          color: "#999",
                                          fontSize: "0.6rem",
                                        }}
                                      >
                                        Notable
                                      </span>
                                      <p className="mt-0.5">
                                        {p.notable}
                                      </p>
                                    </div>

                                    <a
                                      href={`/hotdogs/carta-${p.version}.html`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mt-2 text-[0.65rem] font-bold uppercase tracking-wider no-underline"
                                      style={{
                                        padding: "0.3rem 0.6rem",
                                        border: "2px solid #000",
                                        background: "#000",
                                        color: "#fff",
                                      }}
                                    >
                                      Abrir →
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
