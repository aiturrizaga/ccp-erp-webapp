import { NavItem } from '@shell/nav-item.model';

export const INVENTORY_NAV: NavItem[] = [
  { label: 'Artículos', route: '/apps/inventory/items', icon: 'tablerBox' },
  { label: 'Almacenes', route: '/apps/inventory/warehouses', icon: 'tablerBuildingWarehouse' },
  { label: 'Recepciones', route: '/apps/inventory/goods-receipt', icon: 'tablerTruckDelivery' },
  { label: 'Salidas', route: '/apps/inventory/stock-issues', icon: 'tablerArrowsExchange' },
  { label: 'Existencias', route: '/apps/inventory/stock', icon: 'tablerStack' },
  { label: 'Kardex', route: '/apps/inventory/stock-ledger', icon: 'tablerListDetails' },
];
