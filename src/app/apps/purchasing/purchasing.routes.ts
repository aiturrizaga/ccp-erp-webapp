import { Routes } from '@angular/router';
import { roleGuard } from '@shell/role-guard';

export const PURCHASING_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'requisitions' },
  { path: 'requisitions', loadComponent: () => import('./requisitions/requisition-list/requisition-list').then((m) => m.RequisitionList) },
  { path: 'requisitions/new', loadComponent: () => import('./requisitions/requisition-create/requisition-create').then((m) => m.RequisitionCreate) },
  { path: 'requisitions/:id', loadComponent: () => import('./requisitions/requisition-detail/requisition-detail').then((m) => m.RequisitionDetail) },
  {
    path: 'sourcing',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./sourcing/quotation-list/quotation-list').then((m) => m.QuotationList),
  },
  {
    path: 'sourcing/comparison/:requisitionId',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./sourcing/quotation-comparison/quotation-comparison').then((m) => m.QuotationComparison),
  },
  {
    path: 'sourcing/:id',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./sourcing/quotation-detail/quotation-detail').then((m) => m.QuotationDetail),
  },
  {
    path: 'purchase-orders',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./purchase-orders/purchase-order-list/purchase-order-list').then((m) => m.PurchaseOrderList),
  },
  {
    path: 'purchase-orders/:id',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./purchase-orders/purchase-order-detail/purchase-order-detail').then((m) => m.PurchaseOrderDetail),
  },
  { path: 'suppliers', loadComponent: () => import('./suppliers/supplier-list/supplier-list').then((m) => m.SupplierList) },
  { path: 'suppliers/:id', loadComponent: () => import('./suppliers/supplier-detail/supplier-detail').then((m) => m.SupplierDetail) },
];
