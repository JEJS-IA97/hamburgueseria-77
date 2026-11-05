# Hamburguesería 77

Carta digital y administración del local. Aplicación React/Vite, con Supabase para el catálogo, inicio de sesión del equipo y órdenes. La publicación estática puede servirse desde Cloudflare Pages.

## Desarrollo

```sh
npm install
npm run dev
```

Para crear `dist` para Cloudflare Pages: `npm run build`. En Pages, usa comando `npm run build` y directorio `dist`. Copia `.env.example` a `.env` y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Configurar Supabase

1. Ejecuta en orden todas las migraciones `supabase/migrations/0001_menu_orders.sql` a `0004_extra_pricing_and_selection.sql` en el SQL Editor del proyecto.
2. Ejecuta `supabase/seed.sql`; importa las 2 cartas con precios en CLP, variantes, combos, promociones, ingredientes compartidos normalizados y extras.
3. En Authentication, desactiva el registro público. Crea las dos cuentas de administrador con invitación o desde el panel.
4. Añade únicamente los UUID de esas dos cuentas a `public.admins` desde el editor SQL: `insert into public.admins(user_id) values ('UUID-ADMIN-1'), ('UUID-ADMIN-2');`.
5. Usa solo la URL y la clave `anon`/publicable en el frontend. Nunca expongas la clave `service_role`.
6. Inicia sesión en `/admin` para revisar o actualizar los datos que quedaron en Supabase. Las imágenes quedan vacías para cargarlas después.

Sin credenciales Supabase, la carta no inventa ni presenta un menú de ejemplo, y `/admin` muestra que falta configuración. El seed SQL se genera de forma repetible desde `menu_general.md` y `menu_y_promociones.md` con `python scripts/build_catalog_seed.py`.

## Estructura

- `src/pages`: inicio, detalle de plato y checkout.
- `src/components`: estructura del sitio y tarjetas de platos.
- `src/store`: carrito persistente.
- `src/api`: lectura y escritura del catálogo y creación de órdenes.
- `src/admin`: login y páginas privadas para platos, categorías, pedidos y datos del local.
- `supabase/migrations`: esquema normalizado, políticas de acceso y función transaccional de órdenes.
- `supabase/seed.sql`: catálogo que se escribe en Supabase, no se empaqueta en el frontend.
- `scripts/build_catalog_seed.py`: regenerador del seed a partir de los dos Markdown.

El cliente no crea cuenta. Las órdenes requieren nombre, teléfono y RUT; delivery pide dirección, mesa pide número. La función de base de datos vuelve a leer platos y extras disponibles y calcula los precios antes de insertar la orden. El precio del Nescafé queda como rango y bloquea el pedido hasta que el local defina qué precio exacto corresponde a cada variante. Los Markdown tienen nombres de Instagram distintos; el seed no elige uno por el local.
