import { NavItem } from '@shell/nav-item.model';

export const INVOICING_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/invoicing/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Comprobantes', route: '/apps/invoicing/invoices', icon: 'tablerReceipt2' },
  { label: 'Guías de remisión', route: '/apps/invoicing/guides', icon: 'tablerTruckDelivery' },
  { label: 'Series y correlativos', route: '/apps/invoicing/series', icon: 'tablerListDetails' },
];
