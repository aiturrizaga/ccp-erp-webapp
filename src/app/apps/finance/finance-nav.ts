import { NavItem } from '@shell/nav-item.model';

export const FINANCE_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/finance/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Comprobantes', route: '/apps/finance/invoices', icon: 'tablerReceipt2' },
  { label: 'Guías de remisión', route: '/apps/finance/guides', icon: 'tablerTruckDelivery' },
  { label: 'Series y correlativos', route: '/apps/finance/series', icon: 'tablerListDetails' },
  { label: 'Cobranzas', route: '/apps/finance/collections', icon: 'tablerTrendingUp' },
  { label: 'Pagos por validar', route: '/apps/finance/payments', icon: 'tablerCashBanknote' },
  { label: 'Expediente del cliente', route: '/apps/finance/customer-file', icon: 'tablerFileSearch' },
  { label: 'Convenios de crédito', route: '/apps/finance/agreements', icon: 'tablerClipboardText' },
];
