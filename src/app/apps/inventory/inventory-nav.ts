import { NavItem } from '@shell/nav-item.model';

export const INVENTORY_NAV: NavItem[] = [
  { label: 'Artículos', route: '/apps/inventory/items', icon: 'tablerBox' },
  { label: 'Almacenes', route: '/apps/inventory/warehouses', icon: 'tablerBuildingWarehouse' },
  { label: 'Recepciones', route: '/apps/inventory/goods-receipt', icon: 'tablerTruckDelivery' },
  { label: 'Existencias', route: '/apps/inventory/stock', icon: 'tablerStack' },
  { label: 'Kardex', route: '/apps/inventory/stock-ledger', icon: 'tablerListDetails' },
  { label: 'Transferencias', route: '/apps/inventory/transfers', icon: 'tablerArrowsExchange' },
  { label: 'Picking', route: '/apps/inventory/picking', icon: 'tablerChecklist' },
  { label: 'Reservas', route: '/apps/inventory/reservations', icon: 'tablerLock' },
  { label: 'Ajustes', route: '/apps/inventory/adjustments', icon: 'tablerAdjustments' },
];
