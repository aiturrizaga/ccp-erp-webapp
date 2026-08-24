import { NavItem } from '@shell/nav-item.model';

export const PRODUCTION_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/production/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Planificación', route: '/apps/production/planning', icon: 'tablerCalendar' },
  { label: 'Órdenes de fabricación', route: '/apps/production/production-orders', icon: 'tablerBuildingFactory' },
  { label: 'Hojas de trabajo', route: '/apps/production/work-sheets', icon: 'tablerClipboardText' },
  { label: 'Bolsa de salidas', route: '/apps/production/output-bundles', icon: 'tablerBackpack' },
  { label: 'Centros de trabajo', route: '/apps/production/work-centers', icon: 'tablerBuildingFactory2' },
  { label: 'Rutas', route: '/apps/production/operation-routes', icon: 'tablerRoute' },
];
