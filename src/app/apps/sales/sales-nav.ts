import { NavItem } from '@shell/nav-item.model';

export const SALES_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/sales/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Productos', route: '/apps/sales/products', icon: 'tablerPackage', section: 'CATÁLOGO' },
  { label: 'Clientes', route: '/apps/sales/customers', icon: 'tablerUsers', section: 'CATÁLOGO' },
  { label: 'Cotizaciones', route: '/apps/sales/quotations', icon: 'tablerFileText', section: 'GESTIÓN COMERCIAL' },
  { label: 'Ordenes de pedidos', route: '/apps/sales/orders', icon: 'tablerClipboardList', section: 'GESTIÓN COMERCIAL' },
  { label: 'Backlog de HT', route: '/apps/sales/production-board', icon: 'tablerBuildingFactory2', section: 'OPERACIONES' },
  { label: 'Reclamos', route: '/apps/sales/claims', icon: 'tablerAlertTriangle', section: 'OPERACIONES' },
  { label: 'Reportes de ventas', route: '/apps/sales/reports', icon: 'tablerChartBar', section: 'REPORTES' },
];
