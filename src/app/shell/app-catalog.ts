/** The fixed catalog of Apps (Section 4 of the master context). Not every App is built in this phase. */
export interface AppDescriptor {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  implemented: boolean;
}

export const APP_CATALOG: AppDescriptor[] = [
  { id: 'purchasing', name: 'Compras', description: 'Solicitudes, cotizaciones, órdenes de compra y proveedores', icon: '🛒', route: '/apps/purchasing', implemented: true },
  { id: 'inventory', name: 'Inventario', description: 'Artículos, almacenes, stock, kardex y recepciones', icon: '📦', route: '/apps/inventory', implemented: true },
  { id: 'production', name: 'Producción', description: 'Órdenes de fabricación, hojas de trabajo y bolsas de salida', icon: '🏭', route: '/apps/production', implemented: true },
  { id: 'plm', name: 'PLM', description: 'Productos, recetas, especificaciones, versiones y cambios', icon: '🧬', route: '/apps/plm', implemented: true },
  { id: 'sales', name: 'Ventas', description: 'Clientes, cotizaciones, pedidos y despachos', icon: '💼', route: '/apps/sales', implemented: true },
  { id: 'crm', name: 'CRM', description: 'Leads, oportunidades y seguimiento comercial', icon: '🤝', route: '/apps/crm', implemented: true },
  { id: 'invoicing', name: 'Facturación', description: 'Comprobantes de venta y compra, notas de crédito/débito', icon: '🧾', route: '/apps/invoicing', implemented: true },
  { id: 'finance', name: 'Finanzas', description: 'Cuentas por pagar/cobrar, tesorería y presupuestos', icon: '💰', route: '/apps/finance', implemented: true },
];
