import { NavItem } from '@shell/nav-item.model';

export const INVENTORY_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/apps/inventory/dashboard', icon: 'tablerLayoutDashboard' },
  { label: 'Ejecución de HT', route: '/apps/inventory/work-sheets-board', icon: 'tablerClipboardText' },
  { label: 'Artículos', route: '/apps/inventory/items', icon: 'tablerBox' },
  { label: 'Almacenes', route: '/apps/inventory/warehouses', icon: 'tablerBuildingWarehouse' },
  { label: 'Notas de ingreso', route: '/apps/inventory/goods-receipt', icon: 'tablerTruckDelivery' },
  { label: 'Notas de salida', route: '/apps/inventory/stock-issues', icon: 'tablerArrowsExchange' },
  { label: 'Existencias', route: '/apps/inventory/stock', icon: 'tablerStack' },
  { label: 'Kardex', route: '/apps/inventory/stock-ledger', icon: 'tablerListDetails' },
];
