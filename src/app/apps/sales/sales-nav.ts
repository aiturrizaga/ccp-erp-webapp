import { NavItem } from '@shell/nav-item.model';

export const SALES_NAV: NavItem[] = [
  // Dashboard se mantiene como acceso independiente, fuera de cualquier grupo.
  { label: 'Dashboard', route: '/apps/sales/dashboard', icon: 'tablerLayoutDashboard' },

  { label: 'Productos', route: '/apps/sales/products', icon: 'tablerPackage', section: 'Catálogo' },
  { label: 'Clientes', route: '/apps/sales/customers', icon: 'tablerUsers', section: 'Catálogo' },

  { label: 'Cotizaciones', route: '/apps/sales/quotations', icon: 'tablerFileText', section: 'Gestión comercial' },
  { label: 'Ordenes de pedidos', route: '/apps/sales/orders', icon: 'tablerClipboardList', section: 'Gestión comercial' },

  { label: 'Backlog de HT', route: '/apps/sales/production-board', icon: 'tablerBuildingFactory2', section: 'Operaciones' },
  { label: 'Despacho', route: '/apps/sales/dispatch', icon: 'tablerTruckDelivery', section: 'Operaciones' },
  { label: 'Reclamos', route: '/apps/sales/claims', icon: 'tablerAlertTriangle', section: 'Operaciones' },

  { label: 'Reportes de ventas', route: '/apps/sales/reports', icon: 'tablerChartBar', section: 'Reportes' },
];
