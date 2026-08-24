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
}

export const APP_CATALOG: AppDescriptor[] = [
  { id: 'purchasing', name: 'Compras', description: 'Solicitudes, cotizaciones, órdenes de compra y proveedores', icon: '🛒', route: '/apps/purchasing', implemented: true },
  { id: 'inventory', name: 'Almacén', description: 'Artículos, almacenes, stock, kardex y recepciones', icon: '📦', route: '/apps/inventory', implemented: true },
  { id: 'production', name: 'Producción', description: 'Órdenes de fabricación, hojas de trabajo y bolsas de salida', icon: '🏭', route: '/apps/production', implemented: true, hidden: true },
  { id: 'plm', name: 'PLM', description: 'Productos, recetas, especificaciones, versiones y cambios', icon: '🧬', route: '/apps/plm', implemented: true, hidden: true },
  { id: 'sales', name: 'Ventas', description: 'Clientes, cotizaciones, pedidos y despachos', icon: '💼', route: '/apps/sales', implemented: true, hidden: true },
  { id: 'crm', name: 'CRM', description: 'Leads, oportunidades y seguimiento comercial', icon: '🤝', route: '/apps/crm', implemented: true, hidden: true },
  { id: 'invoicing', name: 'Facturación', description: 'Comprobantes de venta y compra, notas de crédito/débito', icon: '🧾', route: '/apps/invoicing', implemented: true, hidden: true },
  { id: 'finance', name: 'Finanzas', description: 'Cuentas por pagar/cobrar, tesorería y presupuestos', icon: '💰', route: '/apps/finance', implemented: true, hidden: true },
];
