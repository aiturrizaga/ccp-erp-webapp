import { NavItem } from '@shell/nav-item.model';

export const PURCHASING_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/purchasing/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Reposición sugerida', route: '/apps/purchasing/replenishment-suggestions', icon: 'tablerClipboardList' },
  { label: 'Requerimiento de compra', route: '/apps/purchasing/requirements', icon: 'tablerClipboardCheck' },
  { label: 'Cotizaciones', route: '/apps/purchasing/sourcing', icon: 'tablerFileSearch', roles: ['purchasing'] },
  { label: 'Órdenes de compra', route: '/apps/purchasing/purchase-orders', icon: 'tablerShoppingCart', roles: ['purchasing'] },
  { label: 'Proveedores', route: '/apps/purchasing/suppliers', icon: 'tablerBuilding' },
];
