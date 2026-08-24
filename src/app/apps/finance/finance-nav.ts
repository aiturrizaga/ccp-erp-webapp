import { NavItem } from '@shell/nav-item.model';

export const FINANCE_NAV: NavItem[] = [
  { label: 'Cuentas por pagar', route: '/apps/finance/payable', icon: 'tablerCashBanknote' },
  { label: 'Cuentas por cobrar', route: '/apps/finance/receivable', icon: 'tablerReceipt2' },
];
