import { Routes } from '@angular/router';

const comingSoon = () => import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon);

export const INVENTORY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  { path: 'items', loadComponent: () => import('./items/item-list/item-list').then((m) => m.ItemList) },
  { path: 'items/:id', loadComponent: () => import('./items/item-detail/item-detail').then((m) => m.ItemDetail) },
  { path: 'warehouses', loadComponent: () => import('./warehouses/warehouse-list/warehouse-list').then((m) => m.WarehouseList) },
  { path: 'warehouses/:id', loadComponent: () => import('./warehouses/warehouse-detail/warehouse-detail').then((m) => m.WarehouseDetail) },
  { path: 'goods-receipt', loadComponent: () => import('./goods-receipt/goods-receipt-list/goods-receipt-list').then((m) => m.GoodsReceiptList) },
  { path: 'goods-receipt/:id', loadComponent: () => import('./goods-receipt/goods-receipt-detail/goods-receipt-detail').then((m) => m.GoodsReceiptDetail) },
  { path: 'stock', loadComponent: () => import('./stock/stock-list/stock-list').then((m) => m.StockList) },
  { path: 'stock-ledger', loadComponent: () => import('./stock-ledger/stock-ledger-list/stock-ledger-list').then((m) => m.StockLedgerList) },
  { path: 'transfers', loadComponent: comingSoon, data: { title: 'Transferencias', description: 'Movimientos entre almacenes y ubicaciones. Próximamente.', icon: 'tablerArrowsExchange' } },
  { path: 'picking', loadComponent: comingSoon, data: { title: 'Picking', description: 'Preparación de materiales para despacho o producción. Próximamente.', icon: 'tablerChecklist' } },
  { path: 'reservations', loadComponent: comingSoon, data: { title: 'Reservas', description: 'Reserva de stock para órdenes de producción o venta. Próximamente.', icon: 'tablerLock' } },
  { path: 'adjustments', loadComponent: comingSoon, data: { title: 'Ajustes', description: 'Ajustes manuales de inventario con motivo y autorización. Próximamente.', icon: 'tablerAdjustments' } },
];
