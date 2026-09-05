import { NavItem } from '@shell/nav-item.model';

export const PRODUCTION_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/production/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Hojas de trabajo', route: '/apps/production/work-sheets', icon: 'tablerClipboardText' },
  { label: 'Planificación', route: '/apps/production/planning', icon: 'tablerCalendar' },
  { label: 'Productos', route: '/apps/production/products', icon: 'tablerCategory' },
  { label: 'BOM / Recetas', route: '/apps/production/bill-of-materials', icon: 'tablerFlask' },
  { label: 'Moldes', route: '/apps/production/molds', icon: 'tablerStack' },
  { label: 'Máquinas', route: '/apps/production/machines', icon: 'tablerBuildingFactory2' },
  { label: 'Centros de trabajo', route: '/apps/production/work-centers', icon: 'tablerRoute' },
  { label: 'Protocolos de calidad', route: '/apps/production/quality/protocols', icon: 'tablerShieldCheck' },
  { label: 'Inspecciones', route: '/apps/production/quality/inspections', icon: 'tablerZoomCheck' },
  { label: 'Bolsa de salidas', route: '/apps/production/output-bundles', icon: 'tablerBackpack' },
];
