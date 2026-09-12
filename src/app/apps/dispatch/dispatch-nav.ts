import { NavItem } from '@shell/nav-item.model';

export const DISPATCH_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/dispatch/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Planificar despacho', route: '/apps/dispatch/planning', icon: 'tablerCalendar' },
  { label: 'Stock producto terminado', route: '/apps/dispatch/finished-stock', icon: 'tablerPackage' },
  { label: 'Reportes de despacho', route: '/apps/dispatch/reports', icon: 'tablerChartBar' },
];
