import { NavItem } from '@shell/nav-item.model';

export const CRM_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/crm/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Leads', route: '/apps/crm/leads', icon: 'tablerUserPlus' },
  { label: 'Oportunidades', route: '/apps/crm/opportunities', icon: 'tablerTargetArrow' },
  { label: 'Clientes', route: '/apps/crm/customers', icon: 'tablerUsers' },
];
