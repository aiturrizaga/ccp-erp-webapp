import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  { path: 'items', loadComponent: () => import('./items/item-list/item-list').then((m) => m.ItemList) },
  { path: 'items/new', loadComponent: () => import('./items/item-create/item-create').then((m) => m.ItemCreate) },
  { path: 'items/:id', loadComponent: () => import('./items/item-detail/item-detail').then((m) => m.ItemDetail) },
  { path: 'warehouses', loadComponent: () => import('./warehouses/warehouse-list/warehouse-list').then((m) => m.WarehouseList) },
  { path: 'warehouses/:id', loadComponent: () => import('./warehouses/warehouse-detail/warehouse-detail').then((m) => m.WarehouseDetail) },
  { path: 'goods-receipt', loadComponent: () => import('./goods-receipt/goods-receipt-list/goods-receipt-list').then((m) => m.GoodsReceiptList) },
  { path: 'goods-receipt/:id', loadComponent: () => import('./goods-receipt/goods-receipt-detail/goods-receipt-detail').then((m) => m.GoodsReceiptDetail) },
  { path: 'stock-issues', loadComponent: () => import('./stock-issues/stock-issue-list/stock-issue-list').then((m) => m.StockIssueList) },
  { path: 'stock-issues/new', loadComponent: () => import('./stock-issues/stock-issue-create/stock-issue-create').then((m) => m.StockIssueCreate) },
  { path: 'stock-issues/:id', loadComponent: () => import('./stock-issues/stock-issue-detail/stock-issue-detail').then((m) => m.StockIssueDetail) },
  { path: 'stock', loadComponent: () => import('./stock/stock-list/stock-list').then((m) => m.StockList) },
  { path: 'stock-ledger', loadComponent: () => import('./stock-ledger/stock-ledger-list/stock-ledger-list').then((m) => m.StockLedgerList) },
];
