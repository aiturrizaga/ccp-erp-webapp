import { UserRole } from '@core/models';

/** The fixed catalog of Apps (Section 4 of the master context). Not every App is built in this phase. */
export interface AppDescriptor {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  implemented: boolean;
  /** Hidden from the App Launcher grid but still fully routable — not the same as `!implemented` ("Próximamente"), which the launcher still shows (grayed out). */
  hidden?: boolean;
  /** Roles allowed to see this App in the launcher. Omitted = visible to everyone. */
  roles?: UserRole[];
}

export const APP_CATALOG: AppDescriptor[] = [
  { id: 'purchasing', name: 'Compras', description: 'Solicitudes, cotizaciones, órdenes de compra y proveedores', icon: '🛒', route: '/apps/purchasing', implemented: true, roles: ['warehouse', 'purchasing'] },
  { id: 'inventory', name: 'Almacén', description: 'Artículos, almacenes, stock, kardex y recepciones', icon: '📦', route: '/apps/inventory', implemented: true, roles: ['warehouse', 'purchasing'] },
  { id: 'production', name: 'Producción', description: 'Hojas de trabajo, corridas de fabricación, productos, recetas y calidad', icon: '🏭', route: '/apps/production', implemented: true, hidden: true },
  { id: 'sales', name: 'Ventas', description: 'Productos, clientes, cotizaciones, pedidos, despacho y reclamos', icon: '💼', route: '/apps/sales', implemented: true, roles: ['sales'] },
  { id: 'finance', name: 'Finanzas', description: 'Comprobantes, guías de remisión, series SUNAT, cobranzas y convenios de crédito', icon: '💰', route: '/apps/finance', implemented: true, roles: ['sales', 'billing'] },
];
