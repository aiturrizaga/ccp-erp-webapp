import { NavItem } from '@shell/nav-item.model';

export const INVENTORY_NAV: NavItem[] = [
  { label: 'Artículos', route: '/apps/inventory/items', icon: 'tablerBox' },
  { label: 'Almacenes', route: '/apps/inventory/warehouses', icon: 'tablerBuildingWarehouse' },
  { label: 'Recepciones', route: '/apps/inventory/goods-receipt', icon: 'tablerTruckDelivery' },
  { label: 'Existencias', route: '/apps/inventory/stock', icon: 'tablerStack' },
  { label: 'Kardex', route: '/apps/inventory/stock-ledger', icon: 'tablerListDetails' },
];
