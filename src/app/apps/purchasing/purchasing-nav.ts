import { NavItem } from '@shell/nav-item.model';

export const PURCHASING_NAV: NavItem[] = [
  { label: 'Solicitudes de compra', route: '/apps/purchasing/requisitions', icon: 'tablerClipboardList' },
  { label: 'Abastecimiento', route: '/apps/purchasing/sourcing', icon: 'tablerFileSearch', roles: ['purchasing'] },
  { label: 'Órdenes de compra', route: '/apps/purchasing/purchase-orders', icon: 'tablerShoppingCart', roles: ['purchasing'] },
  { label: 'Proveedores', route: '/apps/purchasing/suppliers', icon: 'tablerBuilding' },
];
