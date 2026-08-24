# Persistencia con Supabase (rama `supabase`)

Esta rama agrega persistencia compartida entre usuarios/dispositivos para las Apps **Compras** y
**Almacén** — las cotizaciones, solicitudes, órdenes de compra, proveedores nuevos, recepciones,
salidas y kardex ahora sobreviven a un reload y se comparten entre todos los que prueben el
prototipo, sin necesidad de construir un backend propio todavía.

## Cómo funciona

No hay un esquema relacional por entidad (eso se diseñará cuando el backend real esté definido).
En su lugar, cada `*State` service serializa **todo su estado en memoria como un JSON** y lo guarda
en una sola tabla `app_state(key text, data jsonb)`:

- `key = 'purchasing'` → solicitudes, cotizaciones, órdenes de compra, proveedores.
- `key = 'warehouse-ops'` → recepciones, salidas, kardex.
- `key = 'inventory-items'` → catálogo de artículos (incluye los que se creen desde "Nuevo artículo").

Al arrancar, cada servicio intenta cargar su fila; si no existe (o Supabase no está configurado),
usa los fixtures de siempre — la app funciona exactamente igual que antes. Cada cambio (crear una
cotización, confirmar una recepción, etc.) se guarda de vuelta con un debounce de 600ms.

Ver `src/app/core/supabase/state-persistence.ts` para el detalle.

## Cómo activarlo

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito alcanza de sobra).
2. En el **SQL Editor** del proyecto, corre el script `supabase/migration.sql` de este repo — crea
   la tabla `app_state` con una política abierta para el rol `anon` (es un prototipo interno sin
   autenticación propia; no uses esta política tal cual si esta tabla llegara a tener datos reales).
3. En **Project Settings → API**, copia la **Project URL** y la **anon public key**.
4. Pégalas en `src/environments/environment.ts`:
   ```ts
   export const environment = {
     supabaseUrl: 'https://tu-proyecto.supabase.co',
     supabaseAnonKey: 'tu-anon-key',
   };
   ```
5. `npm run start` — listo. Verifica en el SQL Editor (`select * from app_state;`) que las filas se
   van creando/actualizando a medida que usas la app.

## Qué NO quedó cubierto

Las Apps ocultas del selector (Producción, PLM, Ventas, CRM, Facturación, Finanzas) siguen sin
persistencia — solo se conectaron las dos Apps visibles hoy. El mismo patrón (`loadPersistedState`
+ `persistState` en el constructor del `*State` service, una `key` nueva) aplica igual de fácil
cuando se necesite extenderlas.
