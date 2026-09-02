import { NavItem } from '@shell/nav-item.model';

export const COLLECTIONS_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/collections/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Expediente del cliente', route: '/apps/collections/customer-file', icon: 'tablerFileSearch' },
  { label: 'Convenios de crédito', route: '/apps/collections/agreements', icon: 'tablerClipboardText' },
];
