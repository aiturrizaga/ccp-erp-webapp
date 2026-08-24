import { NavItem } from '@shell/nav-item.model';

export const PLM_NAV: NavItem[] = [
  { label: 'Productos', route: '/apps/plm/products', icon: 'tablerCategory' },
  { label: 'BOM / Recetas', route: '/apps/plm/bill-of-materials', icon: 'tablerFlask' },
  { label: 'Cambios', route: '/apps/plm/change-management', icon: 'tablerTool' },
];
