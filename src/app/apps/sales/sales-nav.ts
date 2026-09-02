import { NavItem } from '@shell/nav-item.model';

export const SALES_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/sales/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Productos', route: '/apps/sales/products', icon: 'tablerPackage' },
  { label: 'Clientes', route: '/apps/sales/customers', icon: 'tablerUsers' },
  { label: 'Cotizaciones', route: '/apps/sales/quotations', icon: 'tablerFileText' },
  { label: 'Pedidos', route: '/apps/sales/orders', icon: 'tablerClipboardList' },
  { label: 'Producción', route: '/apps/sales/production-board', icon: 'tablerBuildingFactory2' },
  { label: 'Despacho', route: '/apps/sales/dispatch', icon: 'tablerTruckDelivery' },
  { label: 'Reclamos', route: '/apps/sales/claims', icon: 'tablerAlertTriangle' },
];
