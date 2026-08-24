import { NavItem } from '@shell/nav-item.model';

export const PURCHASING_NAV: NavItem[] = [
  { label: 'Solicitudes de compra', route: '/apps/purchasing/requisitions', icon: 'tablerClipboardList' },
  { label: 'Abastecimiento', route: '/apps/purchasing/sourcing', icon: 'tablerFileSearch' },
  { label: 'Órdenes de compra', route: '/apps/purchasing/purchase-orders', icon: 'tablerShoppingCart' },
  { label: 'Proveedores', route: '/apps/purchasing/suppliers', icon: 'tablerBuilding' },
  { label: 'Acuerdos', route: '/apps/purchasing/agreements', icon: 'tablerHeartHandshake' },
];
