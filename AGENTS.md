# AGENTS.md — Hamburguesería 77

Guía obligatoria para cualquier agente (Codex incluido) que toque la interfaz. Viene de lo que ya se ajustó y aprobó en otro proyecto del mismo dueño (`../lm-perfumes`, ver `docs/DESIGN.md` y `apps/web/src/styles/base.css` allí). **Se copia el sistema (medidas, componentes, comportamiento), no los colores ni las fuentes**: la marca de la hamburguesería (naranja `#f15a24`, amarillo `#ffc629`, Barlow Condensed + DM Sans) se mantiene.

**El aspecto visual (estética, composición, tarjetas) lo marcan las referencias de José en `docs/referencias/` → ver §11.** Este archivo tiene dos capas: §11 dice *cómo debe verse*; §2–§9 dicen *cómo se construye* para que no falle (alturas, tamaños, grids, accesibilidad). Si chocan, manda §11 en lo estético y §2–§9 en lo técnico (tamaño mínimo de letra, 44 px táctiles, contraste).

Idioma de la interfaz y de los comentarios: español. Moneda CLP.

---

> **Estado 2026-11-03:** la reorganización de §10 (pasos 1–9) ya está hecha. Los estilos viven en `src/styles/base.css` (tokens y controles), `components/layout/layout.css`, `components/menu/menu.css`, `components/product/product.css`, `pages/pages.css` y `admin/admin.css`. `styles.css`, `refinements.css` y `structure.css` se borraron: **no recrearlos**. Todo `<select>` usa `components/ui/Select.tsx`. Para cambiar algo, edita la regla existente en su archivo; reutiliza `.btn`, `.input`, `.field`, `.form-card`, `.choices`, `.stepper`, `.pill`, `.add-btn`, `.icon-btn`, `.section-head` antes de crear clases nuevas. La tabla de §1 describe el estado anterior.
>
> **Reglas de José (2026-11-03), mandan sobre todo lo demás:**
> - **Nunca fotos genéricas que no correspondan al producto** (nada de hamburguesas en sándwiches, completos, churrascos o pollo). Sin foto real del plato → icono de `components/ui/FoodIcon.tsx` o solo texto. Promos y categorías van sin foto.
> - El botón del carrito es **naranja en ambos modos**; no usar `--strong` (se invierte con el tema) en elementos de marca.
> - El hero lleva **las dos cosas**: foto de fondo `public/images/hero-festin-callejero.png` con velo oscuro **y** encima la hamburguesa con su animación (flotar + órbitas + sticker «¿Hambre? Resuelta.»). No quitar ninguna.
> - Ubicación: **foto del local (`public/images/location.jpg`) de fondo** y encima una tarjeta con el **mapa de Google** y el botón **«Ubícanos»**. No quitar ni la foto ni el mapa.
> - Combos: tarjeta tipo ticket de la misma familia que la de plato (blanca, título Barlow, lista «✓», talón perforado con precio y «+»). `contentOf()` en `PromotionSection.tsx` quita las repeticiones de la base de datos; no mostrar descripción y componentes a la vez.
> - Pie: estructura de LM Perfumes (llamada a pedir, marca + 3 columnas en acordeón móvil, línea legal). No reducirlo a dirección + lista.
> - **Todas las tarjetas de un mismo tipo miden lo mismo**, tengan el contenido que tengan. Lo que no cabe se trunca con «…» (`line-clamp`) y el texto completo va en `title`. Tarjeta de combo: alto fijo 320 px, título máx. 2 líneas, máx. 2 ítems de 2 líneas, pago en 1 línea.
> - Ficha del plato: **siempre dos columnas con el cuadro de imagen a la izquierda** (foto real o placa oscura con el icono). El cuadro no es sticky y la ficha termina con aire propio: **el cuadro nunca toca el footer**.
> - Al cambiar de página se empieza arriba (`StoreLayout` hace scroll a 0 salvo que haya `#ancla`).
> - Carrito = panel lateral igual al de LM Perfumes (`components/cart/CartDrawer.tsx`): se abre con el botón del header y al agregar algo; desde ahí «Continuar con el pedido» lleva a `/checkout`. Totales con `lineTotal`/`cartTotal` de `store/cart.ts`.
> - Navegación activa (tienda y admin): **texto en color + subrayado**, nunca pastilla rellena.
> - Redes oficiales: Instagram `https://www.instagram.com/lahamburgueseria77` y Facebook `https://www.facebook.com/people/Hamburgueser%C3%ADa-Labranza/100063806342442/` (constantes en `StoreLayout.tsx`).
> - No eliminar ni rediseñar algo que ya existe sin que José lo pida.

## 0. Reglas de trabajo (leer primero)

1. **No minificar el código fuente.** Hoy `styles.css`, `refinements.css`, `structure.css` y varios `.tsx` están escritos en una sola línea. Así no se puede revisar ni corregir. Una regla por línea en CSS (o propiedades en pocas líneas legibles), JSX con saltos de línea normales. Vite ya minifica al compilar.
2. **No crear archivos "de parche" que pisan reglas anteriores.** Hoy hay 3 hojas que se sobrescriben: `.category-nav`, `.hero`, `.dish-card`, `.carousel-track`, `.menu-page` y ~40 selectores más están definidos dos o tres veces con valores distintos. Cada componente tiene **un solo** bloque de estilos. Si algo cambia, se edita la regla original, no se añade otra debajo.
3. Estructura objetivo de estilos (igual que en perfumes):
   - `src/styles/base.css` → tokens, reset, `.container`, `.btn`, `.field`, `.input`, `.select`, `.choices`, `.alert`, `.skeleton`.
   - Un `.css` junto a cada grupo de componentes: `components/layout/layout.css`, `components/menu/menu.css`, `components/product/product.css`, `pages/pages.css`, `admin/admin.css`.
   - Al terminar, `refinements.css` y `structure.css` deben desaparecer (su contenido repartido en esos archivos, sin duplicados).
4. Cambios pequeños y comprobables. Antes de dar algo por terminado, revisarlo a **375 px, 768 px y 1280 px** de ancho, en claro y en oscuro.
5. No inventar textos de marketing ni datos del menú. Los datos vienen de Supabase.

---

## 1. Problemas concretos detectados hoy (prioridad alta)

| Problema | Dónde | Regla que se incumple |
|---|---|---|
| ~110 textos de **7, 8, 9 y 10 px** | `styles.css`, `refinements.css` | Mínimo 12 px (ver §3) |
| `<select>` sin estilo o con estilo distinto en cada página (`OrdersPage`, `ProductsPage` sin clase `.input`; `PromotionsPage` con ella) | admin | Un único componente `Select` (§5) |
| `input` con `border-radius: 12px`, tarjetas con 20 px, botones con 999px, select con 10px | todo | Un único `--radius` para controles (§2) |
| Inputs sin alto mínimo (`padding:13px` y nada más) → cada control mide distinto | `.input` en `structure.css` | `min-height: 48px` en todos (§5) |
| `input type=number` con flechas del navegador | admin | Quitarlas (§5) |
| Radios de entrega como texto suelto (`.choices label{display:flex}`) | Checkout | Pastillas táctiles de 44 px (§5) |
| `align-items:flex-center` (valor inválido) | `.category-browser-heading` | Revisar valores; el navegador los ignora en silencio |
| Paddings laterales en porcentaje (`7.2%`, `9.5%`, `6%`) distintos por sección → los bordes de las secciones no se alinean | header, hero, menú, admin | Un solo `--gutter` vía `.container` (§2) |
| Alturas fijas (`.site-header{height:79px}`, `.announcement{height:32px}`) | header | `min-height` para que el texto no se corte |
| Foto del plato como `background-image` en un `<a>` | `DishCard.tsx` | `<img>` con `alt`, `loading="lazy"` y caja fija (§6) |
| Breakpoints mezclados: 390, 720, 760, 1050 | 3 archivos | Solo los de §4 |
| Botones redondos de 43 px | header | Mínimo 44×44 px |

---

## 2. Tokens (en `src/styles/base.css`)

Se mantienen los colores actuales de la marca; se añaden los tokens de **sistema** que faltan:

```css
:root {
  /* marca (los de hoy) */
  --orange: #f15a24; --orange-strong: #c9441a; /* texto/botón sobre claro con contraste AA */
  --yellow: #ffc629;
  /* superficies (los de hoy) */
  --bg: #f6f4ef; --surface: #fff; --surface-2: #eceae4;
  --text: #191919; --text-muted: #5f5e5a; /* --muted actual (#72716d) no llega a AA en 13 px */
  --line: #dedbd3;
  --accent: var(--orange-strong); --on-accent: #fff;
  --danger: #b42318; --success: #1f7a4d;

  /* sistema (copiado de perfumes) */
  --font-display: 'Barlow Condensed', system-ui, sans-serif;
  --font-ui: 'DM Sans', system-ui, sans-serif;
  --radius: 14px;                              /* inputs, selects, tarjetas de opción */
  --radius-card: 20px;                         /* tarjetas de plato, resumen, bloques */
  --radius-lg: 28px;                           /* banners, hero, foto grande de la ficha */
  --radius-pill: 999px;                        /* botones, chips, buscador, stepper (como en las referencias) */
  --gutter: clamp(18px, 3vw, 56px);            /* margen lateral único de toda la web */
  --section-gap: clamp(40px, 5vw, 64px);       /* espacio entre secciones */
  --max: 1600px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --shadow: 0 12px 32px -12px rgb(20 18 14 / 0.16);
}
html[data-theme='dark'] { /* mismos nombres, valores oscuros (los de hoy) */ --accent: var(--orange); --on-accent: #1a0d06; --text-muted: #b2b0a8; }
```

- **Prohibido** escribir colores, radios o márgenes "a mano" dentro de componentes. Siempre `var(--…)`.
- Contenedor único: `.container { width:100%; max-width:var(--max); margin-inline:auto; padding-inline:var(--gutter); }`. Header, hero, menú, pie y admin usan `.container` → todos los bordes quedan alineados.
- Espacio vertical entre secciones: siempre `padding-top: var(--section-gap)`. El pie: `margin-top: calc(var(--section-gap) * 1.5)`.

---

## 3. Tipografía

| Uso | Tamaño |
|---|---|
| Texto base / inputs / selects | **16 px** (con menos, iPhone hace zoom al tocar el campo) |
| Botones, enlaces de navegación, opciones | 15 px, peso 600 |
| Etiqueta de campo (`.field > span`) | 14 px, 600 |
| Texto secundario, ayudas, meta de tarjeta | 13 px |
| Pastillas, contador del carrito, categoría en mayúsculas | 12 px, 700 (**mínimo absoluto**) |
| Título de sección (h2) | `clamp(30px, 4vw, 48px)` |
| Título de página (h1) | `clamp(36px, 5vw, 56px)` |
| Precio en ficha | `clamp(34px, 3.4vw, 42px)` |

- Nada por debajo de 12 px. Eliminar todos los 7–11 px actuales.
- `line-height: 1.55` en texto; títulos `1.0–1.1` y `text-wrap: balance`.
- Precios con `font-variant-numeric: tabular-nums`.
- Mayúsculas con `letter-spacing` solo en etiquetas cortas (≤ 3 palabras), nunca en párrafos ni botones largos.
- Sin "eyebrows" decorativos encima de cada título ni números de sección decorativos (`.hero-kicker`, `.hero-index`, `.catalog-eyebrow`: quitar). Sí se permite, como en ref-2, un **subtítulo en mayúsculas espaciadas debajo** del nombre del plato con información real (p. ej. «DOBLE CARNE · CHEDDAR · TOCINO»), 12–13 px.

---

## 4. Layout, grids y breakpoints

Breakpoints permitidos (mobile-first, `min-width`): **600, 768, 900, 1100**. Nada de 390/720/760/1050.

**Grid de platos** (copiado tal cual de perfumes, funcionó):

```css
.grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:28px 16px; }
@media (min-width:768px)  { .grid { grid-template-columns:repeat(3, minmax(0,1fr)); gap:40px 24px; } }
@media (min-width:1100px) { .grid { grid-template-columns:repeat(4, minmax(0,1fr)); } }
```

- Siempre `minmax(0,1fr)`, nunca `1fr` a secas en grids con texto (si no, un nombre largo ensancha la columna y rompe la fila).
- Todo hijo de grid/flex que contenga texto truncable lleva `min-width: 0`.
- Formularios: `.row { display:grid; gap:18px }` y a partir de 600 px dos columnas (`3fr 2fr` o `1fr 1fr`). En móvil siempre una columna.
- Ficha del plato y checkout: una columna en móvil; desde 900 px dos columnas (`minmax(0,11fr) minmax(0,9fr)` en ficha; `7fr 5fr` en checkout) con la columna lateral `position: sticky; top: 96px`.
- **Sin scroll horizontal** en ningún ancho ≥ 320 px. Comprobar con `document.documentElement.scrollWidth === innerWidth`.
- Filas de carrusel: `grid-auto-flow:column; grid-auto-columns: calc((100% - 16px) / 2.15)` en móvil (se ve un trozo de la siguiente tarjeta, invita a deslizar), `/ 3.3` en tablet, `/ 5` en escritorio; `scroll-snap-type:x mandatory`; barra de scroll oculta; flechas de 44 px que dan la vuelta en los extremos.

---

## 5. Controles de formulario (el bloque que más falla)

### Campo

```html
<label class="field">
  <span>Teléfono</span>
  <input class="input" type="tel" name="phone" autocomplete="tel" inputmode="tel" />
  <small>Te escribiremos por WhatsApp.</small>          <!-- ayuda opcional -->
  <small class="field__error">Falta el teléfono.</small> <!-- solo si hay error -->
</label>
```

```css
.field { display:grid; gap:6px; align-content:start; }
.field > span { font-size:14px; font-weight:600; }
.field small { font-size:13px; color:var(--text-muted); }
.field__error { color:var(--danger) !important; font-weight:600; }

.input { width:100%; min-height:48px; padding:10px 14px; border:1px solid var(--line);
  border-radius:var(--radius); background:var(--bg); color:var(--text); font:inherit; font-size:16px;
  transition:border-color .15s; }
.input:hover { border-color:var(--text-muted); }
.input:focus { outline:none; border-color:var(--accent);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
.input[aria-invalid='true'] { border-color:var(--danger); }
textarea.input { min-height:96px; resize:vertical; }
/* Sin flechas en number: cambian el alto y la alineación */
input[type='number'].input { -moz-appearance:textfield; }
input[type='number'].input::-webkit-inner-spin-button,
input[type='number'].input::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
```

- **Todos** los `input`, `select` y `textarea` llevan `.input`. Misma altura (48 px), mismo radio, mismo borde, mismo foco. Sin excepciones en el admin.
- Errores: `aria-invalid="true"` en el control + `<small class="field__error">` debajo del campo, no solo un aviso general arriba del formulario. Hoy el checkout solo dice "Revisa tu nombre, teléfono, RUT…"; hay que marcar el campo concreto.
- `autocomplete` y `inputmode` correctos (`name`, `tel`, `street-address`; RUT con `inputmode="text"` y `autocapitalize="characters"`).

### Select (dropdown) — crear `src/components/ui/Select.tsx` y usarlo en TODOS los `<select>`

```tsx
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

/** <select> nativo (teclado y móvil gratis) con la misma altura que los inputs y flecha propia centrada. */
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`select ${className}`}>
      <select className="input" {...props}>{children}</select>
      <ChevronDown className="select__chevron" size={18} aria-hidden="true" />
    </span>
  )
}
```

```css
.select { position:relative; display:block; }
.select > select.input { width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.select select { appearance:none; -webkit-appearance:none; padding-right:44px; cursor:pointer; }
.select__chevron { position:absolute; right:14px; top:50%; translate:0 -50%; pointer-events:none;
  color:var(--text-muted); transition:rotate .25s var(--ease-out), color .2s; }
.select:hover .select__chevron { color:var(--text); }
.select:has(select:focus-visible) .select__chevron { color:var(--accent); }
.select:has(select:open) .select__chevron { rotate:180deg; color:var(--accent); }
select.input option { background:var(--bg); color:var(--text); }

/* Lista desplegable con estilo propio (Chrome/Edge 135+). Safari y Firefox usan el menú nativo, y está bien. */
@supports (appearance: base-select) {
  .select select, .select select::picker(select) { appearance:base-select; }
  .select select::picker-icon { display:none; }
  .select select::picker(select) {
    /* Abre SIEMPRE hacia abajo; solo hacia arriba si no cabe. */
    position-area:block-end span-inline-end; position-try-order:normal; position-try-fallbacks:flip-block;
    margin-top:6px; padding:6px; border:1px solid var(--line); border-radius:var(--radius);
    background:var(--bg); color:var(--text); box-shadow:var(--shadow);
    opacity:0; translate:0 -6px;
    transition:opacity .18s var(--ease-out), translate .18s var(--ease-out), display .18s allow-discrete, overlay .18s allow-discrete;
  }
  .select select:open::picker(select) { opacity:1; translate:0 0; }
  @starting-style { .select select:open::picker(select) { opacity:0; translate:0 -6px; } }
  .select select option { display:flex; align-items:center; gap:10px; min-height:40px; padding:8px 12px;
    border-radius:calc(var(--radius) - 3px); background:transparent; font-size:15px; cursor:pointer; }
  .select select option::checkmark { order:1; margin-left:auto; color:var(--accent); }
  .select select option:hover, .select select option:focus-visible { background:var(--surface-2); outline:none; }
  .select select option:checked { color:var(--accent); font-weight:700; background:color-mix(in srgb, var(--accent) 10%, var(--bg)); }
}
```

- Nada de dropdowns hechos con `div` + estado propio: el `<select>` nativo ya da teclado, lector de pantalla y la rueda del móvil.
- Si un select va en una barra (orden, filtro de estado), se le da ancho al envoltorio: `.toolbar .select { width:190px }`, nunca al `<select>` interno.

### Opciones de una sola elección (entrega: delivery / retiro / mesa) → pastillas

```css
.choices { border:0; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:8px; }
.choices legend { font-size:14px; font-weight:600; margin-bottom:8px; padding:0; }
.choices label { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 14px;
  border:1px solid var(--line); border-radius:999px; cursor:pointer; font-size:15px; }
.choices label:has(input:checked) { border-color:var(--accent); font-weight:600;
  background:color-mix(in srgb, var(--accent) 8%, var(--bg)); }
.choices input { accent-color:var(--accent); margin:0; }
```

### Casillas (extras del plato, "disponible" en admin)
Fila entera clicable: `label` con `display:flex; align-items:center; gap:10px; min-height:44px`; `input[type=checkbox]` de 20×20 con `accent-color: var(--accent)`. En extras, el precio va a la derecha con `margin-left:auto` y `tabular-nums`.

### Botones

```css
.btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:48px; padding:0 22px;
  border:1px solid transparent; border-radius:var(--radius-pill); font-size:15px; font-weight:600;
  transition:background-color .2s, border-color .2s, color .2s, transform .2s var(--ease-out); }
.btn:active { transform:scale(.98); }
.btn:disabled { opacity:.55; cursor:not-allowed; }
.btn-primary { background:var(--accent); color:var(--on-accent); }
.btn-primary:hover:not(:disabled) { background:color-mix(in srgb, var(--accent) 86%, var(--text)); }
.btn-outline { border-color:var(--line); background:transparent; }
.btn-outline:hover { border-color:var(--text); }
.btn-block { width:100%; }
.icon-btn { display:grid; place-items:center; width:44px; height:44px; border:0; border-radius:50%; background:none; }
```

- Tres variantes y ya: primario, contorno, icono. No inventar una clase de botón por pantalla (`.hero-cta`, `.category-more`, `.dialog-add`… pasan a `.btn` + modificador).
- Botón de compra de **ancho natural** en escritorio; `btn-block` solo en móvil, carrito y checkout.
- Mientras guarda: `disabled` + texto "Guardando…" o icono girando. Nunca doble envío.

### Cantidad (stepper)
`inline-flex` con borde `var(--line)`, botones 40×40 (44 en móvil), número en medio `min-width:28px`, `font-weight:700`, `tabular-nums`. El botón "−" se desactiva en 1.

---

## 6. Tarjeta de plato y fotos

(Aspecto exacto en §11.3. Aquí las reglas que evitan que se rompa.)

- Tarjeta de **alto fijo**: `display:grid; grid-template-rows:auto 1fr; min-width:0`.
- Foto con `<img>` (no `background-image`): caja `aspect-ratio: 1` (cuadrada, como ref-1 y ref-7), `object-fit: cover`, `border-radius: var(--radius-card)`, `loading="lazy"`, `alt` con el nombre del plato. Al pasar el ratón `transform: scale(1.04)` en 0.6 s con `--ease-out`.
- Sin foto: placa `var(--surface-2)` con icono centrado, misma caja. Nunca un hueco de altura distinta.
- Nombre en **una línea** con `…` (`overflow:hidden; white-space:nowrap; text-overflow:ellipsis`) y el texto completo en `title`. Ingredientes: máximo 2 líneas (`-webkit-line-clamp:2`).
- Pie de tarjeta: precio a la izquierda (16–18 px, 700, tabular), botón redondo de añadir 40–44 px a la derecha, **relleno naranja con «+» blanco** (ref-7). Sustituye el texto "VER PLATO →" de 9 px.
- Etiqueta (promo, nuevo): pastilla arriba a la izquierda, 12 px, 700, `border-radius:999px`.

---

## 7. Header, menú móvil, carrito, pie

- Header `position:sticky; top:0`, fondo `color-mix(in srgb, var(--bg) 92%, transparent)` + `backdrop-filter: saturate(1.4) blur(10px)`, borde inferior `var(--line)`, `min-height:68px` (60 en móvil).
- Nav de escritorio: enlaces de 15 px, 600, `min-height:44px`; el activo con línea inferior de 2 px del acento.
- **Móvil (<768 px): una sola fila `grid-template-columns: 44px 1fr 44px`** → menú · logo centrado · carrito. La navegación, el tema y la búsqueda van dentro del menú lateral.
- Menú lateral y carrito: `<dialog>` nativo (`showModal()`), alto `100dvh`, ancho `min(340px, 86vw)` (menú, entra por la izquierda) y `min(440px, 100vw)` (carrito, por la derecha), animación `translateX` 0.32 s, fondo `::backdrop` `rgb(8 10 14 / .5)`. Enlaces del menú de 56 px de alto. Pie del panel con `padding-bottom: calc(16px + env(safe-area-inset-bottom))`.
- Contador del carrito: 20×20, 12 px, 700.
- Pie: oscuro en ambos modos; columnas en escritorio (`2fr 1fr 1.3fr 1fr`), **acordeón con `<details>` en móvil**; separación con `gap`, no con márgenes de párrafos.

---

## 8. Admin

- Fondo `var(--surface)`, contenido en tarjetas `var(--bg)` con borde `var(--line)`, `max-width: 1040px` centrado.
- Barra superior sticky con pestañas de 44 px, scroll horizontal en móvil.
- Listas como filas de grid: `grid-template-columns: 48px 1fr auto auto` (miniatura · nombre/precio · estado · acción); en < 560 px se oculta la columna de estado.
- Filtros arriba: buscador (icono a la izquierda, `padding-left:42px`) + selects, en grid `minmax(0,1fr) 220px 240px` desde 720 px; una columna en móvil. Contador "N platos" en 13 px.
- Lista larga con su propio scroll: `max-height: min(62vh, 640px); overflow-y:auto; overscroll-behavior:contain`.
- Formulario de edición: `fieldset` por grupo, filas de 2 columnas desde 640 px, acciones al final (guardar a la izquierda, eliminar a la derecha en rojo con `margin-left:auto`).
- Estados de pedido con pastillas de color fijo: nuevo azul, confirmado amarillo, entregado verde, cancelado rojo (fondo claro + texto oscuro, 12 px 700).
- Tablas: `border-collapse:collapse`, celdas `10px 14px`, cabecera 13 px gris.

---

## 9. Tema y accesibilidad

- Tema claro/oscuro: sigue al dispositivo (`prefers-color-scheme`) hasta que se pulsa el botón; la elección se guarda en `localStorage` (`h77-theme`) dentro de `try/catch`. Actualizar también `<meta name="theme-color">`.
- Foco visible en todo: `:focus-visible { outline:2px solid var(--accent); outline-offset:3px }`.
- Objetivos táctiles ≥ 44×44 px.
- `@media (prefers-reduced-motion: reduce)` → sin animaciones; los carruseles **no** avanzan solos en ese caso. Quitar animaciones infinitas decorativas (`burger-float`, `orbit-turn`) o dejarlas solo con `no-preference`.
- Contraste AA: texto gris mínimo `--text-muted` sobre `--bg`; naranja como texto solo en su versión fuerte (`--orange-strong`) sobre claro.
- Desplegables, menús y popovers abren hacia abajo; hacia arriba solo si no caben.

---

## 10. Orden de trabajo sugerido

1. Crear `src/styles/base.css` con §2, §3 y §5. Crear `components/ui/Select.tsx`.
2. Reemplazar todos los `<select>` por `<Select>`; añadir `.input` a todos los controles; quitar tamaños < 12 px.
3. Unificar márgenes laterales con `.container` y espacios con `--section-gap`.
4. Rehacer `DishCard` (§6) y el grid (§4).
5. Checkout: campos con error por campo, pastillas de entrega, resumen sticky.
6. Header/menú móvil/carrito (§7).
7. Admin (§8).
8. Ficha, carrito, checkout y confirmación con el aspecto de §11.6–11.9.
9. Repartir y borrar `refinements.css` y `structure.css`. Buscar selectores duplicados: no debe quedar ninguno.

**Comprobación al final de cada paso:** 375 / 768 / 1280 px, claro y oscuro; sin scroll horizontal; todos los controles de un mismo formulario miden lo mismo de alto; ningún texto < 12 px (`grep -rE "font-size: ?([0-9]|1[01])px" src` no devuelve nada); y la pantalla se parece a su referencia de §11.

---

## 11. Referencias visuales de José (`docs/referencias/`): cómo debe verse

**Antes de tocar cualquier pantalla, abre la imagen que le corresponde y compárala con tu resultado.** No se copian textos, logos ni fotos; se copia la composición, la jerarquía y el tipo de componente.

| Archivo | Qué tomar de ella |
|---|---|
| `ref-7.jpg` | **La principal.** Ficha del plato, opciones (Single/Double/Combo), extras con «+», carrito, barra inferior con stepper + botón con el precio dentro. Encaja 1:1 con nuestros datos (variantes, combos, extras). |
| `ref-1.jpg` | Fila de categorías en círculos, tarjetas de plato con «+» sobre la foto, pastilla de descuento, historial de pedidos, pantalla «Pedido confirmado». |
| `ref-5.jpg` | Tarjeta destacada estilo **B** (foto a sangre + texto encima + botón naranja ancho). |
| `ref-2.jpg` | Ficha con foto grande y botones flotantes redondos; ingredientes como círculos; filtros en pastillas; grid de 2 columnas con nombre y precio sobre la foto. |
| `ref-3.jpg` | Formulario de pago/entrega: campos grandes redondeados con etiqueta arriba, casilla de términos, bloque «Total» + botón negro ancho. |
| `ref-4.jpg`, `ref-6.jpg` | Versión **escritorio**: hero oscuro con hamburguesa grande a la derecha y titular a la izquierda, mosaico de promociones (1 grande + 2 apiladas), secciones oscuras alternadas, pie en columnas. |

### 11.1 Paleta y ambiente
- Naranja de marca = color de acción (botones, «+», barra de compra, pestaña activa). Fondo crema cálido en claro (`--bg #f6f4ef`, el actual), tarjetas blancas.
- **Hero y bloques destacados en negro/carbón cálido** con foto de comida iluminada (ref-6, ref-4, ref-1 centro). El modo oscuro de toda la web sigue esa sensación: carbón `#111210`, naranja más brillante.
- Botón secundario fuerte en **negro** (ref-3 «Place order», ref-1 «Follow»); en oscuro pasa a blanco.
- Amarillo `--yellow` solo para estrellas e insignias, nunca para texto sobre crema.

### 11.2 Tipografía
- Titulares en **Barlow Condensed 800**, grandes y apretados como «Good Food / Great Mood» (ref-7): primera línea en `--text`, la línea o palabra clave en naranja. Como mucho una parte resaltada por título.
- Nombre del plato en la ficha: 36–56 px. En tarjetas: 16–18 px, 700, DM Sans.

### 11.3 Tarjeta de plato (grid del menú): estilo ref-7 / ref-1
```
┌───────────────────┐
│  foto cuadrada  ♡ │  ← radio 20 px; corazón opcional en círculo blanco 36 px arriba-derecha
│                   │  ← pastilla «-20 %» o «Promo» arriba-izquierda (naranja, texto blanco, 12 px)
└───────────────────┘
Cheese Burger          ← 16–17 px, 700, una línea con …
Simple · 180 g         ← 13 px, muted (tamaño/variante)
$7.990            (+)  ← precio 700 tabular · botón naranja redondo 40–44 px
```
- Tarjeta blanca (`--surface`), `padding: 10px`, radio `--radius-card`, sombra muy suave (`--shadow`) o borde `--line`; la foto va dentro con su propio radio.
- Hoy no hay fotos: placeholder cuadrado `--surface-2` con icono de Lucide (`Sandwich`, `Pizza`, `CupSoda`…) centrado en gris. Debe verse igual de ordenado que con foto.

### 11.4 Tarjeta destacada / promoción: estilo **B** de ref-5
- Foto a sangre de fondo, degradado negro desde abajo (`linear-gradient(to top, #000d 0%, #0008 45%, transparent 75%)`), texto blanco encima.
- Arriba: pastilla tipo vidrio con un dato real («Combo», «2×1», precio anterior) a la izquierda; corazón a la derecha.
- Abajo: título 24–28 px, 1–2 líneas de descripción, chips translúcidos (`rgb(255 255 255 / .12)`, borde `rgb(255 255 255 / .2)`), botón naranja **a todo el ancho** «Agregar · $X →».
- Solo en «Promociones» y en el carrusel de destacados, no en el grid normal.

### 11.5 Categorías
- Móvil (ref-1, ref-7): fila con scroll horizontal de **círculos o cuadrados redondeados de 64–72 px** con foto/icono y nombre debajo (13–14 px). La activa con anillo naranja de 2 px.
- Filtros dentro de una categoría: pastillas (`--radius-pill`, 44 px de alto), la activa rellena (naranja o negro), el resto `--surface` (ref-2 «All / Starters…»).
- Cabecera de sección: título a la izquierda, «Ver todo ›» a la derecha (14 px, 600) (ref-7 «Popular Now · See all»).

### 11.6 Ficha del plato: ref-7 (centro) + ref-2 (centro)
1. Foto grande arriba (móvil: a sangre, `aspect-ratio: 1`, esquinas inferiores `--radius-lg`; escritorio: columna izquierda con `--radius-lg`). Botones flotantes **atrás** (izq.) y **favorito/compartir** (der.) en círculos blancos de 44 px con sombra.
2. Nombre grande + subtítulo en mayúsculas espaciadas con ingredientes clave + precio grande.
3. Descripción 15–16 px, `--text-muted`, máx. 60ch.
4. **«Elige tu opción»** (variantes, tamaños, combo): grid de 3 tarjetas seleccionables (`repeat(3, minmax(0,1fr))`, 2 por debajo de 380 px). Cada una: nombre 15 px 700 + precio 14 px muted (+ línea extra si es combo: «Papas + bebida»). Seleccionada: borde 2 px naranja y fondo `color-mix(in srgb, var(--accent) 8%, var(--surface))`. Con `<input type="radio">` oculto visualmente dentro del `<label>` (funciona con teclado).
5. **«Agrega extras»**: grid de tarjetas iguales con nombre, «+$1.000» y botón «+» naranja abajo a la derecha; al añadir, el «+» pasa a «✓» y la tarjeta queda marcada. Respetar `extra_selection_limit`. Con `<input type="checkbox">` dentro del `<label>`.
6. Ingredientes (si hay): chips en fila (ref-2).
7. **Barra de compra fija abajo en móvil** (`position: sticky; bottom: 0`, fondo `--bg`, `padding-bottom: env(safe-area-inset-bottom)`): stepper en pastilla `− 1 +` a la izquierda + botón naranja que ocupa el resto **con el total dentro**: «Agregar al carrito   $10.990». El total se recalcula con opción + extras × cantidad. En escritorio la misma fila va al final de la columna derecha, sin fijar.

### 11.7 Carrito: ref-7 (derecha)
- Cada línea en tarjeta blanca: miniatura cuadrada 72 px radio 14 px · nombre 15 px 700 · variante 13 px muted · stepper pequeño · precio arriba a la derecha · papelera abajo a la derecha (`icon-btn`).
- Fila «Código de descuento ›» solo si esa función existe; si no, no se pinta.
- Resumen: Subtotal / Delivery / Total (total 20 px 700) y botón naranja ancho «Ir a pagar · $X →».

### 11.8 Checkout: ref-3 (centro)
- Campos grandes (§5) en tarjetas blancas por grupo: «Tus datos», «Entrega» (pastillas delivery/retiro/mesa), «Dirección» o «Mesa» según la elección.
- Al final: bloque «Total» con desglose plegable y botón **negro** ancho «Confirmar pedido» (blanco en oscuro).

### 11.9 Pedido confirmado: ref-1 (abajo a la derecha)
Pantalla centrada: icono grande (Lucide `PackageCheck` o `CircleCheck`, 96 px, naranja), «¡Pedido confirmado!» 32–40 px Barlow, número de pedido, texto muted, botón «Enviar por WhatsApp» y enlace «Volver al menú».

### 11.10 Inicio en escritorio: ref-6 / ref-4
- Hero oscuro a todo el ancho: titular grande a la izquierda (máx. 3 líneas) + texto + botón naranja; foto de hamburguesa grande a la derecha. Sin órbitas ni animaciones infinitas.
- Debajo: buscador + categorías → mosaico de promociones (1 grande estilo §11.4 + 2 apiladas, `grid-template-columns: 2fr 1fr`) → secciones por categoría con el grid de §4 → «Cómo pedir» en 3 pasos con icono en círculo naranja → pie.
- En móvil el hero se apila: titular arriba, foto debajo, alto máx. 560 px.

### 11.11 Navegación móvil
- Barra inferior flotante tipo ref-7/ref-1 **opcional** (Inicio · Buscar · Carrito central en círculo naranja con contador · Pedidos). Si se hace: `position: fixed; bottom: calc(12px + env(safe-area-inset-bottom))`, pastilla blanca con sombra, ítems de 44 px, y la página lleva `padding-bottom` para no quedar tapada. En la ficha del plato se oculta (allí manda la barra de compra).

### 11.12 Qué NO copiar de las referencias
- Los textos de 9–11 px de los mockups: en pantalla real no se leen. Mínimo 12 px.
- Formularios con solo línea inferior (contacto de ref-4): usar los campos con caja de §5.
- Valoraciones, tiempos de entrega u otros datos que no existan en Supabase: no inventarlos. Sin dato, el elemento no se pinta.
