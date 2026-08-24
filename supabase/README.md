# Persistencia con Supabase (rama `supabase`)

Compras y Almacén ahora leen y escriben directamente contra tablas reales de Supabase — no hay
fixtures "cargados en memoria" como fuente de verdad: cada solicitud, cotización, orden de compra,
proveedor, artículo, recepción, salida y movimiento de kardex es una fila individual en su propia
tabla. Los cambios de un usuario aparecen para los demás **en vivo** (Supabase Realtime), sin
necesidad de recargar la página.

## Tablas

| Tabla | Entidad | Columnas filtrables |
|---|---|---|
| `items` | Artículos | `code`, `active` |
| `suppliers` | Proveedores | `status` |
| `purchase_requisitions` | Solicitudes de compra | `status`, `area` |
| `quotations` | Cotizaciones | `status`, `requisition_id` |
| `purchase_orders` | Órdenes de compra | `status`, `supplier_id` |
| `goods_receipts` | Recepciones | `status`, `purchase_order_id` |
| `stock_issues` | Salidas | `status`, `work_sheet_id` |
| `stock_ledger_entries` | Kardex | `item_id` |

Cada fila es `{ id, <columnas filtrables>, data jsonb, updated_at }` — `data` guarda la entidad
completa (incluye sub-listas como las líneas de una solicitud o las ofertas de una cotización sin
normalizar en tablas hijas propias; eso queda para cuando se diseñe el backend real). Las columnas
extra existen para poder filtrar/consultar por SQL sin tener que leer todo el JSON.

## Cómo funciona en el código

`src/app/core/supabase/table-store.ts` — `TableStore<T>` por tabla, con tres operaciones:

- `fetchAll()` — trae todas las filas al arrancar la app.
- `upsert(entity)` — guarda una fila (o varias) apenas cambian en memoria.
- `subscribe(onChange)` — Realtime: cuando otro usuario cambia una fila, la mezcla al signal local
  automáticamente (sin recargar).

`PurchasingState`, `WarehouseOpsState` e `InventoryState` (en `apps/purchasing` y
`apps/inventory`) usan esto en su constructor y después de cada mutación. Si Supabase no está
configurado (`environment.ts` vacío) o la tabla no existe, todo cae de vuelta a los fixtures
originales — la app sigue funcionando igual que antes de esta integración.

## Cómo activarlo (o resetear la data demo)

1. Corre `supabase/migration.sql` en el **SQL Editor** de tu proyecto (crea las 8 tablas + políticas
   RLS abiertas para `anon` + las agrega a la publicación de Realtime). Es seguro volver a correrlo.
2. Pega tu **Project URL** y **anon public key** (Project Settings → API) en
   `src/environments/environment.ts`.
3. Corre el seed una vez (y cuantas veces quieras resetear la data a su estado original):
   ```bash
   npm run seed:supabase
   ```
4. `npm run start`. Cualquier cambio que hagas ahora se guarda por fila y se ve reflejado en vivo
   en cualquier otra pestaña/dispositivo conectado.

## Qué NO quedó cubierto

- Las Apps ocultas del selector (Producción, PLM, Ventas, CRM, Facturación, Finanzas) — mismo
  patrón (`TableStore` + wiring en el constructor del `*State`), no está hecho todavía.
- Sin autenticación real contra Supabase — el login sigue siendo los 2 usuarios de prueba fijos del
  código; la política RLS es intencionalmente abierta (`anon` puede leer/escribir todo) porque no
  hay sesión de Supabase de por medio. No usar esta política tal cual el día que haya datos reales.
- Sin normalización de líneas/sub-listas en tablas hijas — viven como `jsonb` dentro de la fila
  padre. Suficiente para el prototipo; se rediseña cuando se defina el backend real.
